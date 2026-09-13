import { createHash } from "node:crypto";
import { appendFile, readFile } from "node:fs/promises";
import path from "node:path";
import { mapRecordType } from "../src/lib/record-types";
import { SharpFinalRecordCompositor } from "../src/lib/rendering/compositor.server";
import { ArtworkGenerationResult } from "../src/lib/rendering/contracts";
import { decodeAssetDataUrl } from "../src/lib/rendering/data-url.server";
import {
  assertNativePromptPrivacy,
  compileNativeGenerationPlan,
  createCompositorRenderPlan,
  parseNativeGenerationPlan,
  parseNativeSourceAnalysis,
  sourceSha256,
} from "../src/lib/rendering/native-imagegen";
import { normalizeAndValidateOuterArt } from "../src/lib/rendering/outer-art-normalization.server";
import { createServerShareCard } from "../src/lib/rendering/share-card.server";
import {
  atomicWrite,
  atomicWriteJson,
  loadStudioRuntimeContext,
  safeProjectPath,
  writeStudioStatus,
} from "../src/lib/studio/runtime.server";
import { RecordArtDirection } from "../src/types/record";

async function main(): Promise<void> {
  const projectArgument = argumentValue("--project");
  const attempt = Number(argumentValue("--attempt") ?? "1");
  const visualTextCheck = argumentValue("--visual-text-check");
  if (!projectArgument || (attempt !== 1 && attempt !== 2) || (visualTextCheck !== "pass" && visualTextCheck !== "fail")) {
    throw new Error("Usage: npm run studio:finalize -- --project <absolute-project-path> --attempt <1|2> --visual-text-check <pass|fail>");
  }
  const attemptCount = attempt as 1 | 2;
  const context = await loadStudioRuntimeContext(projectArgument);
  if (!context.request) throw new Error("The Studio request is not ready.");
  if (context.status.state === "complete") {
    process.stdout.write(`${JSON.stringify({ resumed: true, state: "complete", output: context.status.output })}\n`);
    return;
  }

  try {
    const sourcePath = safeProjectPath(context.projectRoot, context.request.sourceImagePath);
    const source = await readFile(sourcePath);
    const analysis = parseNativeSourceAnalysis(
      JSON.parse(await readFile(safeProjectPath(context.projectRoot, "analysis.json"), "utf8")),
      context.request,
    );
    if (analysis.sourceImageSha256 !== sourceSha256(source)) throw new Error("analysis.json does not describe the current source image.");
    const storedPlan = parseNativeGenerationPlan(
      JSON.parse(await readFile(safeProjectPath(context.projectRoot, "generation-plan.json"), "utf8")),
      context.request,
    );
    const expectedPlan = compileNativeGenerationPlan(context.request, analysis);
    if (JSON.stringify(storedPlan) !== JSON.stringify(expectedPlan)) throw new Error("generation-plan.json is not the deterministic plan for this request and analysis.");
    assertNativePromptPrivacy(storedPlan, context.request);

    await writeStudioStatus(context.projectRoot, context.session, "validating_outer_art", "Checking the generated outer art and protecting its center.");
    const raw = await readFile(safeProjectPath(context.projectRoot, "assets/outer-art.raw.png"));
    const normalized = await normalizeAndValidateOuterArt({ raw, attemptCount, visualTextCheck });
    await atomicWriteJson(safeProjectPath(context.projectRoot, "outer-art-qa.json"), normalized.qa);
    if (!normalized.qa.accepted) {
      const message = attemptCount === 1 && normalized.qa.retryCorrection
        ? `One targeted retry is allowed: ${normalized.qa.retryCorrection}`
        : "The generated outer art failed validation after the allowed attempts.";
      await writeStudioStatus(context.projectRoot, context.session, attemptCount === 1 ? "generating_outer_art" : "error", message);
      throw new NativeValidationStop(message);
    }
    await atomicWrite(safeProjectPath(context.projectRoot, "assets/outer-art.png"), normalized.png);

    await writeStudioStatus(context.projectRoot, context.session, "compositing", "Protecting the source center and composing deterministic text.");
    const date = context.request.createdAt.slice(0, 10);
    const catalogNumber = createCatalogNumber(context.session.sessionId, context.request.createdAt);
    const artDirection: RecordArtDirection = {
      image: `data:${sourceMimeType(context.request.sourceImagePath)};base64,${source.toString("base64")}`,
      stylePack: context.request.stylePack,
      doodleDensity: context.request.doodleDensity,
      compositionMode: context.request.compositionMode,
      material: context.request.material,
      userMessage: context.request.userMessage,
      date,
      catalogNumber,
    };
    const renderPlan = createCompositorRenderPlan(context.request, analysis, storedPlan);
    const outerArtwork: ArtworkGenerationResult = {
      layerDataUrl: `data:image/png;base64,${normalized.png.toString("base64")}`,
      mimeType: "image/png",
      providerId: "codex-built-in-imagegen",
      modelId: "codex-native-image-generation",
      providerMode: "production",
      requestId: createHash("sha256").update(`${context.session.sessionId}:${analysis.sourceImageSha256}:${context.request.compositionMode}`).digest("hex").slice(0, 24),
      latencyMs: 0,
      cost: { kind: "unavailable" },
    };
    const composited = await new SharpFinalRecordCompositor().compose({ artDirection, plan: renderPlan, outerArtwork });
    if (composited.sourceImageSha256 !== analysis.sourceImageSha256) throw new Error("The final compositor did not use the analyzed source image.");
    const record = decodeAssetDataUrl(composited.artwork.dataUrl);
    const recordType = mapRecordType(artDirection);
    const renderedAt = new Date().toISOString();
    const shareCard = await createServerShareCard({ record, recordType, catalogNumber, date, userMessage: artDirection.userMessage });
    await Promise.all([
      atomicWrite(safeProjectPath(context.projectRoot, "output/record.png"), record),
      atomicWrite(safeProjectPath(context.projectRoot, "output/share-card.png"), shareCard),
    ]);
    const output = {
      recordPath: "output/record.png" as const,
      shareCardPath: "output/share-card.png" as const,
      outerArtPath: "assets/outer-art.png" as const,
      recordType,
      catalogNumber,
      renderedAt,
      generator: "codex_native" as const,
    };
    await writeStudioStatus(context.projectRoot, context.session, "complete", "Your Aftermark record is ready.", output);
    await log(context.projectRoot, `Codex native outer art accepted after ${attemptCount} attempt(s); deterministic composition completed.`);
    process.stdout.write(`${JSON.stringify({ resumed: false, state: "complete", output, qa: normalized.qa })}\n`);
  } catch (error) {
    if (error instanceof NativeValidationStop) throw error;
    await writeStudioStatus(context.projectRoot, context.session, "error", "The Codex native image-generation flow could not be completed.");
    await log(context.projectRoot, `Codex native pipeline error: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
}

class NativeValidationStop extends Error {}

function argumentValue(name: string): string | undefined {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function createCatalogNumber(sessionId: string, createdAt: string): string {
  const date = createdAt.slice(2, 10).replaceAll("-", "");
  const serial = (Number.parseInt(createHash("sha256").update(sessionId).digest("hex").slice(0, 8), 16) % 997) + 1;
  return `NS-${date}-${String(serial).padStart(3, "0")}`;
}

function sourceMimeType(sourcePath: string): string {
  const extension = path.extname(sourcePath).toLowerCase();
  if (extension === ".png") return "image/png";
  if (extension === ".webp") return "image/webp";
  return "image/jpeg";
}

async function log(projectRoot: string, message: string): Promise<void> {
  await appendFile(path.join(projectRoot, "logs/session.log"), `${new Date().toISOString()} ${message}\n`, "utf8");
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.stack ?? error.message : String(error)}\n`);
  process.exitCode = 1;
});
