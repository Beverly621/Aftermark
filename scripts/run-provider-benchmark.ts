import { createHash } from "node:crypto";
import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { loadEnvConfig } from "@next/env";
import sharp from "sharp";
import { createBenchmarkProviderCandidates } from "../src/lib/rendering/benchmark-providers.server";
import {
  assertArtworkProviderBoundaryPrivacy,
  createArtworkGenerationRequest,
} from "../src/lib/rendering/contracts";
import { buildNeonScribbleRenderPlan } from "../src/lib/rendering/neon-scribble-plan";
import { CompositionMode, ImagePalette, RecordArtDirection, SourceImageAnalysis } from "../src/types/record";

interface BenchmarkConfig {
  version: string;
  outputDirectory: string;
  date: string;
  modes: CompositionMode[];
  inputs: BenchmarkInput[];
}

interface BenchmarkInput {
  id: "G01" | "G02" | "G06";
  label: string;
  sourcePath: string;
  sha256: string;
  palette: ImagePalette;
  motifs: string[];
  sceneSummary: string;
  userMessage: string;
  aiPhrases: string[];
}

interface BenchmarkInputState {
  input: BenchmarkInput;
  sourcePath: string;
  available: boolean;
  actualSha256?: string;
  hashMatches: boolean;
  sourceDataUrl?: string;
}

interface BenchmarkEntry {
  providerAlias: "P1" | "P2" | "P3";
  providerId: string;
  modelId: string;
  inputId: BenchmarkInput["id"];
  compositionMode: CompositionMode;
  status: "completed" | "skipped" | "failed";
  requestId?: string;
  outputPath?: string;
  latencyMs?: number;
  cost?: { amountUsd?: number; providerUnits?: number; providerUnitName?: string; kind: "actual" | "estimate" | "unavailable" };
  reason?: string;
}

interface RequestLogEntry {
  timestamp: string;
  status: BenchmarkEntry["status"];
  requestId?: string;
  providerAlias: BenchmarkEntry["providerAlias"];
  providerId: string;
  modelId: string;
  inputId: BenchmarkInput["id"];
  compositionMode: CompositionMode;
  normalizedRequest: {
    planVersion: string;
    width: number;
    height: number;
    transparentCenter: true;
    palette: ImagePalette;
    motifs: string[];
    centerLabelRatio: number;
    heroLetteringReserved: boolean;
    promptSha256: string;
    sourceImageSha256: string;
  };
  reason?: string;
}

const projectRoot = process.cwd();
loadEnvConfig(projectRoot);

async function main(): Promise<void> {
  const paidExecutionRequested = process.argv.includes("--execute");
  const paidExecutionApproved = process.env.AFTERMARK_BENCHMARK_PAID_APPROVED === "true";
  if (paidExecutionRequested && !paidExecutionApproved) {
    throw new Error("Paid benchmark execution requires AFTERMARK_BENCHMARK_PAID_APPROVED=true in addition to --execute");
  }

  const configPath = path.join(projectRoot, "benchmarks/provider-benchmark.config.json");
  const config = JSON.parse(await readFile(configPath, "utf8")) as BenchmarkConfig;
  validateConfig(config);

  const outputDirectory = path.resolve(projectRoot, config.outputDirectory);
  const renderDirectory = path.join(outputDirectory, "renders");
  await mkdir(renderDirectory, { recursive: true });

  const candidates = createBenchmarkProviderCandidates();
  if (candidates.length * config.inputs.length * config.modes.length !== 18) {
    throw new Error("The frozen benchmark matrix must contain exactly 18 jobs");
  }
  const inputStates = await Promise.all(config.inputs.map(loadInputState));
  const entries: BenchmarkEntry[] = [];
  const requestLog: RequestLogEntry[] = [];
  let providerBoundaryPrivacyChecks = 0;
  let paidProviderCallAttempted = false;

  for (const candidate of candidates) {
  const provider = paidExecutionRequested && paidExecutionApproved && candidate.available ? candidate.create() : undefined;
  for (const inputState of inputStates) {
    const { input } = inputState;
    const sourceUsable = inputState.available && inputState.hashMatches;
    for (const compositionMode of config.modes) {
      const sourceImageSha256 = inputState.actualSha256 ?? `missing-${input.id.toLowerCase()}`;
      const artDirection = createArtDirection(input, compositionMode, config.date, inputState.sourceDataUrl ?? missingSourceDataUrl());
      const analysis = createFrozenAnalysis(input, sourceImageSha256);
      const plan = buildNeonScribbleRenderPlan({ artDirection, analysis, aiPhrases: input.aiPhrases });
      const requestId = hashJson({ benchmarkVersion: config.version, providerAlias: candidate.alias, inputId: input.id, compositionMode, plan }).slice(0, 24);
      const request = createArtworkGenerationRequest(requestId, plan);
      assertArtworkProviderBoundaryPrivacy(request, {
        userMessage: artDirection.userMessage,
        catalogNumber: artDirection.catalogNumber,
        date: artDirection.date,
        applicationRenderedPhrases: input.aiPhrases,
      });
      providerBoundaryPrivacyChecks += 1;
      const normalizedRequest = {
        planVersion: plan.version,
        width: request.width,
        height: request.height,
        transparentCenter: request.transparentCenter,
        palette: plan.palette,
        motifs: plan.motifs,
        centerLabelRatio: plan.composition.centerLabelRatio,
        heroLetteringReserved: plan.composition.heroLetteringZone.reserved,
        promptSha256: createHash("sha256").update(plan.prompt).digest("hex"),
        sourceImageSha256,
      };

      if (!sourceUsable || !provider) {
        const reasons = [
          ...(!inputState.available ? [`missing input: ${input.sourcePath}`] : []),
          ...(inputState.available && !inputState.hashMatches
            ? [`input hash mismatch: expected ${input.sha256}, got ${inputState.actualSha256}`]
            : []),
          ...(!candidate.available ? candidate.missingConfiguration.map((name) => `missing credential: ${name}`) : []),
          ...(candidate.available && !paidExecutionRequested ? ["paid execution not requested"] : []),
        ];
        const entry: BenchmarkEntry = {
          providerAlias: candidate.alias,
          providerId: candidate.providerId,
          modelId: candidate.modelId,
          inputId: input.id,
          compositionMode,
          status: "skipped",
          requestId,
          reason: reasons.join("; "),
        };
        entries.push(entry);
        requestLog.push({
          timestamp: new Date().toISOString(),
          status: entry.status,
          requestId,
          providerAlias: candidate.alias,
          providerId: candidate.providerId,
          modelId: candidate.modelId,
          inputId: input.id,
          compositionMode,
          normalizedRequest,
          reason: entry.reason,
        });
        continue;
      }

      try {
        paidProviderCallAttempted = true;
        const generated = await provider.generate(request);
        const filename = `${candidate.alias}-${input.id}-${compositionMode}.png`;
        const outputPath = path.join(renderDirectory, filename);
        const generatedBuffer = decodeDataUrl(generated.layerDataUrl);
        await sharp(generatedBuffer).resize(request.width, request.height, { fit: "fill" }).png().toFile(outputPath);
        const entry: BenchmarkEntry = {
          providerAlias: candidate.alias,
          providerId: candidate.providerId,
          modelId: generated.modelId,
          inputId: input.id,
          compositionMode,
          status: "completed",
          requestId,
          outputPath: path.relative(projectRoot, outputPath),
          latencyMs: generated.latencyMs,
          cost: generated.cost,
        };
        entries.push(entry);
        requestLog.push({
          timestamp: new Date().toISOString(),
          status: entry.status,
          requestId,
          providerAlias: candidate.alias,
          providerId: candidate.providerId,
          modelId: generated.modelId,
          inputId: input.id,
          compositionMode,
          normalizedRequest,
        });
      } catch (error) {
        const reason = error instanceof Error ? error.message : "Unknown provider error";
        const entry: BenchmarkEntry = {
          providerAlias: candidate.alias,
          providerId: candidate.providerId,
          modelId: candidate.modelId,
          inputId: input.id,
          compositionMode,
          status: "failed",
          requestId,
          reason,
        };
        entries.push(entry);
        requestLog.push({
          timestamp: new Date().toISOString(),
          status: entry.status,
          requestId,
          providerAlias: candidate.alias,
          providerId: candidate.providerId,
          modelId: candidate.modelId,
          inputId: input.id,
          compositionMode,
          normalizedRequest,
          reason,
        });
      }
    }
  }
  }

  const contactSheetPath = path.join(outputDirectory, "anonymous-contact-sheet.png");
  const blindReviewManifestPath = path.join(outputDirectory, "blind-review-manifest.json");
  await createAnonymousContactSheet(config, entries, contactSheetPath);

  const generatedAt = new Date().toISOString();
  const manifest = {
  schemaVersion: "aftermark-provider-benchmark-v1",
  benchmarkVersion: config.version,
  generatedAt,
  executionMode: paidProviderCallAttempted ? "paid" : "dry-run",
  paidExecutionRequested,
  paidExecutionApproved,
  paidProviderCallAttempted,
  paidGenerationStarted: paidProviderCallAttempted,
  winnerSelected: false,
  invariants: {
    expectedJobs: 18,
    providerBoundaryPrivacyChecks,
    deterministicTextExcluded: providerBoundaryPrivacyChecks === 18,
    rawProviderPromptsLogged: false,
  },
  frozenSettings: { stylePack: "neon_scribble", density: "medium", material: "classic", modes: config.modes },
  counts: {
    planned: entries.length,
    completed: entries.filter((entry) => entry.status === "completed").length,
    skipped: entries.filter((entry) => entry.status === "skipped").length,
    failed: entries.filter((entry) => entry.status === "failed").length,
  },
  artifacts: {
    anonymousContactSheet: path.relative(projectRoot, contactSheetPath),
    blindReviewManifest: path.relative(projectRoot, blindReviewManifestPath),
    providerKey: path.relative(projectRoot, path.join(outputDirectory, "provider-key.json")),
    normalizedRequestLog: path.relative(projectRoot, path.join(outputDirectory, "request-log.jsonl")),
  },
  inputs: inputStates.map(({ input, available, actualSha256, hashMatches }) => ({
    id: input.id,
    label: input.label,
    sourcePath: input.sourcePath,
    pinnedSha256: input.sha256,
    actualSha256,
    available,
    hashMatches,
    palette: input.palette,
    motifs: input.motifs,
    sceneSummary: input.sceneSummary,
  })),
  results: entries,
  };

  const blindReviewManifest = {
    schemaVersion: "aftermark-blind-review-manifest-v1",
    benchmarkVersion: config.version,
    generatedAt,
    reviewStatus: "awaiting-blind-scoring",
    winnerSelected: false,
    aliases: candidates.map(({ alias }) => alias),
    counts: manifest.counts,
    frozenSettings: manifest.frozenSettings,
    invariants: manifest.invariants,
    artifacts: {
      anonymousContactSheet: path.relative(projectRoot, contactSheetPath),
    },
    inputs: manifest.inputs,
    results: entries.map(toBlindReviewEntry),
  };
  assertBlindManifestPrivacy(blindReviewManifest, candidates);

  await writeFile(path.join(outputDirectory, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  await writeFile(blindReviewManifestPath, `${JSON.stringify(blindReviewManifest, null, 2)}\n`, "utf8");
  await writeFile(path.join(outputDirectory, "request-log.jsonl"), `${requestLog.map((entry) => JSON.stringify(entry)).join("\n")}\n`, "utf8");
  await writeFile(path.join(outputDirectory, "provider-key.json"), `${JSON.stringify({
  generatedAt,
  revealOnlyAfterBlindScoring: true,
  winnerSelected: false,
  providers: candidates.map(({ alias, providerId, modelId, available, missingConfiguration }) => ({ alias, providerId, modelId, available, missingConfiguration })),
  }, null, 2)}\n`, "utf8");

  process.stdout.write(`${JSON.stringify({ outputDirectory: path.relative(projectRoot, outputDirectory), ...manifest.counts }, null, 2)}\n`);
}

function toBlindReviewEntry(entry: BenchmarkEntry) {
  const blockerCodes = [
    ...(entry.reason?.includes("missing input") ? ["source_image_missing"] : []),
    ...(entry.reason?.includes("input hash mismatch") ? ["source_image_hash_mismatch"] : []),
    ...(entry.reason?.includes("missing credential") ? ["provider_credentials_missing"] : []),
    ...(entry.reason?.includes("paid execution") ? ["paid_execution_not_requested_or_approved"] : []),
    ...(entry.status === "failed" ? ["provider_call_failed"] : []),
  ];
  return {
    providerAlias: entry.providerAlias,
    inputId: entry.inputId,
    compositionMode: entry.compositionMode,
    status: entry.status,
    requestId: entry.requestId,
    outputPath: entry.outputPath,
    blockerCodes,
  };
}

function assertBlindManifestPrivacy(
  manifest: unknown,
  candidates: ReturnType<typeof createBenchmarkProviderCandidates>,
): void {
  const serialized = JSON.stringify(manifest);
  if (/"(?:providerId|modelId)"\s*:/.test(serialized)) {
    throw new Error("Blind review manifest contains a provider or model identity field");
  }
  for (const candidate of candidates) {
    if (serialized.includes(candidate.providerId) || serialized.includes(candidate.modelId)) {
      throw new Error("Blind review manifest exposes provider identity");
    }
  }
}

function createArtDirection(input: BenchmarkInput, compositionMode: CompositionMode, date: string, image: string): RecordArtDirection {
  return {
    image,
    stylePack: "neon_scribble",
    doodleDensity: "medium",
    compositionMode,
    material: "classic",
    userMessage: input.userMessage,
    date,
    catalogNumber: `NS-${date.replaceAll("-", "").slice(2)}-${input.id.slice(1).padStart(3, "0")}`,
    imagePalette: input.palette,
  };
}

function createFrozenAnalysis(input: BenchmarkInput, sourceImageSha256: string): SourceImageAnalysis {
  return {
    palette: input.palette,
    motifs: input.motifs,
    sceneSummary: input.sceneSummary,
    sourceImageSha256,
    analysisMode: "production",
  };
}

async function createAnonymousContactSheet(config: BenchmarkConfig, entries: BenchmarkEntry[], outputPath: string): Promise<void> {
  const tileSize = 280;
  const labelHeight = 38;
  const gap = 12;
  const columns = ["SOURCE", "P1", "P2", "P3"] as const;
  const rows = config.inputs.flatMap((input) => config.modes.map((mode) => ({ input, mode })));
  const width = columns.length * tileSize + (columns.length + 1) * gap;
  const rowHeight = labelHeight + tileSize + gap;
  const height = 58 + rows.length * rowHeight + gap;
  const composites: Array<{ input: Buffer; left: number; top: number }> = [];

  for (let rowIndex = 0; rowIndex < rows.length; rowIndex += 1) {
    const { input, mode } = rows[rowIndex];
    for (let columnIndex = 0; columnIndex < columns.length; columnIndex += 1) {
      const column = columns[columnIndex];
      const left = gap + columnIndex * (tileSize + gap);
      const top = 58 + rowIndex * rowHeight;
      const label = column === "SOURCE" ? `${input.id} · ${mode === "text_led" ? "TEXT-LED" : "MOTIF-LED"} · SOURCE` : `${input.id} · ${mode === "text_led" ? "TEXT-LED" : "MOTIF-LED"} · ${column}`;
      composites.push({ input: Buffer.from(labelSvg(label, tileSize, labelHeight)), left, top });
      const assetTop = top + labelHeight;
      let tile: Buffer;
      if (column === "SOURCE") {
        const sourcePath = path.resolve(projectRoot, input.sourcePath);
        tile = await fileExists(sourcePath) ? await imageTile(await readFile(sourcePath), tileSize) : Buffer.from(emptyTileSvg("SOURCE NOT PROVIDED", tileSize));
      } else {
        const entry = entries.find((item) => item.providerAlias === column && item.inputId === input.id && item.compositionMode === mode);
        tile = entry?.outputPath
          ? await imageTile(await readFile(path.resolve(projectRoot, entry.outputPath)), tileSize)
          : Buffer.from(emptyTileSvg(entry?.status === "failed" ? "GENERATION FAILED" : "NOT RUN", tileSize));
      }
      composites.push({ input: tile, left, top: assetTop });
    }
  }

  const title = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="48"><text x="12" y="31" fill="#f4f0e6" font-family="Arial" font-size="18" font-weight="700" letter-spacing="2">AFTERMARK · TASK 02-B01 · BLIND PROVIDER CONTACT SHEET</text></svg>`);
  composites.unshift({ input: title, left: 0, top: 0 });
  await sharp({ create: { width, height, channels: 4, background: "#11110f" } }).composite(composites).png().toFile(outputPath);
}

async function imageTile(buffer: Buffer, size: number): Promise<Buffer> {
  return sharp(buffer).resize(size, size, { fit: "cover", position: "attention" }).png().toBuffer();
}

function labelSvg(label: string, width: number, height: number): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><rect width="100%" height="100%" fill="#2a2a27"/><text x="10" y="25" fill="#f4f0e6" font-family="Arial" font-size="11" font-weight="700" letter-spacing="1">${label}</text></svg>`;
}

function emptyTileSvg(label: string, size: number): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><rect width="100%" height="100%" fill="#242421"/><path d="M24 24L${size - 24} ${size - 24}M${size - 24} 24L24 ${size - 24}" stroke="#4b4b46" stroke-width="2"/><text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle" fill="#9b988e" font-family="Arial" font-size="12" font-weight="700" letter-spacing="1">${label}</text></svg>`;
}

function decodeDataUrl(value: string): Buffer {
  const match = /^data:[^;,]+;base64,([A-Za-z0-9+/=]+)$/.exec(value);
  if (!match) throw new Error("Provider returned an invalid data URL");
  return Buffer.from(match[1], "base64");
}

async function imageDataUrl(filePath: string): Promise<string> {
  const extension = path.extname(filePath).toLowerCase();
  const mime = extension === ".png" ? "image/png" : extension === ".webp" ? "image/webp" : "image/jpeg";
  return `data:${mime};base64,${(await readFile(filePath)).toString("base64")}`;
}

function missingSourceDataUrl(): string {
  return `data:image/svg+xml;base64,${Buffer.from(emptyTileSvg("MISSING SOURCE", 16)).toString("base64")}`;
}

async function sha256File(filePath: string): Promise<string> {
  return createHash("sha256").update(await readFile(filePath)).digest("hex");
}

async function loadInputState(input: BenchmarkInput): Promise<BenchmarkInputState> {
  const sourcePath = path.resolve(projectRoot, input.sourcePath);
  const available = await fileExists(sourcePath);
  if (!available) {
    return { input, sourcePath, available: false, hashMatches: false };
  }

  const actualSha256 = await sha256File(sourcePath);
  return {
    input,
    sourcePath,
    available: true,
    actualSha256,
    hashMatches: actualSha256 === input.sha256,
    sourceDataUrl: await imageDataUrl(sourcePath),
  };
}

function hashJson(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

function validateConfig(value: BenchmarkConfig): void {
  if (value.version !== "task-02-b01-v1") throw new Error("Unsupported benchmark config version");
  if (value.inputs.map((input) => input.id).join(",") !== "G01,G02,G06") throw new Error("Benchmark subset must be G01, G02, G06");
  if (value.modes.join(",") !== "text_led,motif_led") throw new Error("Benchmark modes must be text_led and motif_led");
  for (const input of value.inputs) {
    if (!input.sourcePath.startsWith("assets/benchmark-inputs/")) throw new Error(`Input path is outside the benchmark input directory: ${input.id}`);
    if (!/^[a-f0-9]{64}$/.test(input.sha256)) throw new Error(`Input SHA-256 is not pinned: ${input.id}`);
    if (input.userMessage !== "summer never ended") throw new Error(`Benchmark message is not frozen: ${input.id}`);
  }
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.stack ?? error.message : String(error)}\n`);
  process.exitCode = 1;
});
