import "server-only";
import { createHash } from "node:crypto";
import { mapRecordType } from "@/lib/record-types";
import { SharpFinalRecordCompositor } from "@/lib/rendering/compositor.server";
import { createArtworkGenerationRequest } from "@/lib/rendering/contracts";
import { translateUnknownError } from "@/lib/rendering/errors";
import { buildNeonScribbleRenderPlan } from "@/lib/rendering/neon-scribble-plan";
import { DevelopmentPhraseGenerator } from "@/lib/rendering/phrases";
import { resolveArtworkProvider } from "@/lib/rendering/providers.server";
import { DevelopmentSourceImageAnalyzer, PaletteFallbackAnalyzer } from "@/lib/rendering/source-analysis.server";
import { RecordArtDirection, RecordRenderResult, SourceImageAnalysis } from "@/types/record";

export class ServerAIRecordRenderer {
  async render(artDirection: RecordArtDirection): Promise<RecordRenderResult> {
    const analysis = await analyzeWithSafeFallback(artDirection);
    const requestId = createRequestId(artDirection, analysis.sourceImageSha256);
    const phraseGenerator = new DevelopmentPhraseGenerator();
    const aiPhrases = await phraseGenerator.generate({ motifs: analysis.motifs, palette: analysis.palette, requestId });
    const plan = buildNeonScribbleRenderPlan({ artDirection, analysis, aiPhrases });
    const provider = resolveArtworkProvider();

    try {
      const outerArtwork = await provider.generate(createArtworkGenerationRequest(requestId, plan));
      const composited = await new SharpFinalRecordCompositor().compose({ artDirection, plan, outerArtwork });
      const recordType = mapRecordType(artDirection);
      return {
        artDirection: { ...artDirection, recordType, imagePalette: analysis.palette },
        recordType,
        catalogNumber: artDirection.catalogNumber,
        renderedAt: new Date().toISOString(),
        mainArtwork: composited.artwork,
        renderPlan: plan,
        renderMode: provider.mode,
        sourceImageSha256: composited.sourceImageSha256,
        providerDiagnostics: {
          providerId: outerArtwork.providerId,
          modelId: outerArtwork.modelId,
          latencyMs: outerArtwork.latencyMs,
          costUsd: outerArtwork.cost?.amountUsd,
          costKind: outerArtwork.cost?.kind,
        },
      };
    } catch (error) {
      throw translateUnknownError(error);
    }
  }
}

async function analyzeWithSafeFallback(artDirection: RecordArtDirection): Promise<SourceImageAnalysis> {
  try {
    return await new DevelopmentSourceImageAnalyzer().analyze({ imageDataUrl: artDirection.image, palette: artDirection.imagePalette });
  } catch (error) {
    const translated = translateUnknownError(error);
    if (translated.code === "INVALID_IMAGE") throw translated;
    return new PaletteFallbackAnalyzer().analyze({ imageDataUrl: artDirection.image, palette: artDirection.imagePalette });
  }
}

function createRequestId(input: RecordArtDirection, sourceImageSha256: string): string {
  return createHash("sha256")
    .update(JSON.stringify({ sourceImageSha256, style: input.stylePack, density: input.doodleDensity, compositionMode: input.compositionMode, material: input.material, message: input.userMessage ?? "", catalog: input.catalogNumber }))
    .digest("hex")
    .slice(0, 24);
}
