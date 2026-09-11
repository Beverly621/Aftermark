import { ImagePalette, NeonScribbleRenderPlan, RecordArtDirection, RenderedArtwork } from "@/types/record";

export type OuterArtworkPlan = Pick<
  NeonScribbleRenderPlan,
  "version" | "palette" | "density" | "material" | "motifs" | "composition" | "prompt" | "negativePrompt"
>;

export interface ArtworkGenerationRequest {
  requestId: string;
  plan: OuterArtworkPlan;
  width: 2048;
  height: 2048;
  transparentCenter: true;
}

export function createArtworkGenerationRequest(requestId: string, plan: NeonScribbleRenderPlan): ArtworkGenerationRequest {
  return {
    requestId,
    plan: {
      version: plan.version,
      palette: plan.palette,
      density: plan.density,
      material: plan.material,
      motifs: plan.motifs,
      composition: plan.composition,
      prompt: plan.prompt,
      negativePrompt: plan.negativePrompt,
    },
    width: 2048,
    height: 2048,
    transparentCenter: true,
  };
}

export interface ArtworkGenerationResult {
  layerDataUrl: string;
  mimeType: "image/png" | "image/svg+xml";
  providerId: string;
  providerMode: "development" | "production";
}

export interface ArtworkGenerationProvider {
  readonly id: string;
  readonly mode: "development" | "production";
  generate(request: ArtworkGenerationRequest): Promise<ArtworkGenerationResult>;
}

export interface PhraseGenerator {
  generate(input: { motifs: string[]; palette: ImagePalette; requestId: string }): Promise<string[]>;
}

export interface FinalRecordCompositorInput {
  artDirection: RecordArtDirection;
  plan: NeonScribbleRenderPlan;
  outerArtwork: ArtworkGenerationResult;
}

export interface FinalRecordCompositorResult {
  artwork: RenderedArtwork;
  sourceImageSha256: string;
}

export interface FinalRecordCompositor {
  compose(input: FinalRecordCompositorInput): Promise<FinalRecordCompositorResult>;
}
