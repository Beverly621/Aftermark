import { createHash } from "node:crypto";
import { appendFile, readFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { mapRecordType } from "../src/lib/record-types";
import { SharpFinalRecordCompositor } from "../src/lib/rendering/compositor.server";
import {
  assertArtworkProviderBoundaryPrivacy,
  createArtworkGenerationRequest,
} from "../src/lib/rendering/contracts";
import { decodeAssetDataUrl } from "../src/lib/rendering/data-url.server";
import { buildNeonScribbleRenderPlan } from "../src/lib/rendering/neon-scribble-plan";
import { DevelopmentPhraseGenerator } from "../src/lib/rendering/phrases";
import { DevelopmentOuterArtProvider } from "../src/lib/rendering/providers.server";
import { createServerShareCard } from "../src/lib/rendering/share-card.server";
import { DevelopmentSourceImageAnalyzer } from "../src/lib/rendering/source-analysis.server";
import {
  atomicWrite,
  loadStudioRuntimeContext,
  safeProjectPath,
  writeStudioStatus,
} from "../src/lib/studio/runtime.server";
import { RecordArtDirection } from "../src/types/record";

async function main(): Promise<void> {
  const projectArgument = argumentValue("--project");
  if (!projectArgument) throw new Error("Usage: npm run studio:process -- --project <absolute-project-path>");
  const context = await loadStudioRuntimeContext(projectArgument);
  if (!context.request) throw new Error("The Studio request is not ready.");
  if (context.status.state === "complete") {
    process.stdout.write(`${JSON.stringify({ resumed: true, state: "complete", output: context.status.output })}\n`);
    return;
  }

  const sourcePath = safeProjectPath(context.projectRoot, context.request.sourceImagePath);
  try {
    await writeStudioStatus(context.projectRoot, context.session, "generating_outer_art", "Creating the local development outer-art placeholder.");
    await log(context.projectRoot, "Development outer-art generation started.");
    const sourceBuffer = await readFile(sourcePath);
    const mimeType = sourceMimeType(context.request.sourceImagePath);
    const date = context.request.createdAt.slice(0, 10);
    const catalogNumber = createCatalogNumber(context.session.sessionId, context.request.createdAt);
    const artDirection: RecordArtDirection = {
      image: `data:${mimeType};base64,${sourceBuffer.toString("base64")}`,
      stylePack: context.request.stylePack,
      doodleDensity: context.request.doodleDensity,
      compositionMode: context.request.compositionMode,
      material: context.request.material,
      userMessage: context.request.userMessage,
      date,
      catalogNumber,
    };
    const analysis = await new DevelopmentSourceImageAnalyzer().analyze({ imageDataUrl: artDirection.image });
    const requestId = createHash("sha256")
      .update(`${context.session.sessionId}:${analysis.sourceImageSha256}:${context.request.compositionMode}`)
      .digest("hex")
      .slice(0, 24);
    const aiPhrases = await new DevelopmentPhraseGenerator().generate({ motifs: analysis.motifs, palette: analysis.palette, requestId });
    const plan = buildNeonScribbleRenderPlan({ artDirection, analysis, aiPhrases });
    const providerRequest = createArtworkGenerationRequest(requestId, plan);
    assertArtworkProviderBoundaryPrivacy(providerRequest, {
      userMessage: artDirection.userMessage,
      catalogNumber,
      date,
      applicationRenderedPhrases: aiPhrases,
    });
    const provider = new DevelopmentOuterArtProvider();
    const outerArtwork = await provider.generate(providerRequest);
    const outerArtPng = await sharp(decodeAssetDataUrl(outerArtwork.layerDataUrl), { density: 144 })
      .resize(2048, 2048, { fit: "fill" })
      .png()
      .toBuffer();
    await atomicWrite(safeProjectPath(context.projectRoot, "assets/outer-art.png"), outerArtPng);

    await writeStudioStatus(context.projectRoot, context.session, "compositing", "Protecting the center and composing deterministic text.");
    await log(context.projectRoot, "Deterministic compositing started.");
    const composited = await new SharpFinalRecordCompositor().compose({ artDirection, plan, outerArtwork });
    const record = decodeAssetDataUrl(composited.artwork.dataUrl);
    const recordType = mapRecordType(artDirection);
    const renderedAt = new Date().toISOString();
    const shareCard = await createServerShareCard({
      record,
      recordType,
      catalogNumber,
      date,
      userMessage: artDirection.userMessage,
    });
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
    };
    await writeStudioStatus(context.projectRoot, context.session, "complete", "Your Aftermark record is ready.", output);
    await log(context.projectRoot, "Studio pipeline completed with the development outer-art placeholder.");
    process.stdout.write(`${JSON.stringify({ resumed: false, state: "complete", output })}\n`);
  } catch (error) {
    await writeStudioStatus(context.projectRoot, context.session, "error", "The local development render could not be completed.");
    await log(context.projectRoot, `Studio pipeline error: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
}

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
