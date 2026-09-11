import { ImagePalette, NeonScribbleRenderPlan, RecordArtDirection, RenderedArtwork } from "@/types/record";

export type OuterArtworkPlan = Pick<
  NeonScribbleRenderPlan,
  "version" | "palette" | "density" | "material" | "compositionMode" | "motifs" | "composition" | "prompt" | "negativePrompt"
>;

export interface ArtworkGenerationRequest {
  requestId: string;
  plan: OuterArtworkPlan;
  width: 2048;
  height: 2048;
  transparentCenter: true;
}

export interface ArtworkProviderPrivacyContext {
  userMessage?: string;
  catalogNumber: string;
  date: string;
  applicationRenderedPhrases: readonly string[];
}

export function createArtworkGenerationRequest(requestId: string, plan: NeonScribbleRenderPlan): ArtworkGenerationRequest {
  return {
    requestId,
    plan: {
      version: plan.version,
      palette: plan.palette,
      density: plan.density,
      material: plan.material,
      compositionMode: plan.compositionMode,
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

export function createArtworkProviderPrompt(request: ArtworkGenerationRequest): string {
  return `${request.plan.prompt} Avoid: ${request.plan.negativePrompt}. Return only the square outer-art layer; the application will mask the center and render all text.`;
}

export function assertArtworkProviderBoundaryPrivacy(
  request: ArtworkGenerationRequest,
  context: ArtworkProviderPrivacyContext,
): void {
  const forbiddenKeys = new Set([
    "userMessage",
    "catalogNumber",
    "date",
    "aiPhrases",
    "deterministicMetadata",
    "recordType",
    "renderedAt",
  ]);
  const requestKeys = collectObjectKeys(request);
  for (const key of forbiddenKeys) {
    if (requestKeys.has(key)) throw new Error(`Artwork provider request contains forbidden deterministic field: ${key}`);
  }

  const outboundStrings = [...collectStringValues(request), createArtworkProviderPrompt(request)]
    .map((value) => value.normalize("NFKC").toLocaleLowerCase());
  const forbiddenValues = [
    context.userMessage,
    context.catalogNumber,
    context.date,
    ...context.applicationRenderedPhrases,
  ].filter((value): value is string => Boolean(value?.trim()));

  for (const value of forbiddenValues) {
    const normalized = value.normalize("NFKC").toLocaleLowerCase();
    if (outboundStrings.some((outbound) => outbound.includes(normalized))) {
      throw new Error("Artwork provider request contains deterministic application-rendered text");
    }
  }

  if (request.plan.compositionMode === "text_led") {
    const heroZone = request.plan.composition.heroLetteringZone;
    if (!heroZone.reserved || !heroZone.applicationOwnedText) {
      throw new Error("TEXT-LED provider requests must reserve an application-owned Hero Lettering zone");
    }
  }
}

function collectObjectKeys(value: unknown, keys = new Set<string>()): Set<string> {
  if (!value || typeof value !== "object") return keys;
  if (Array.isArray(value)) {
    for (const item of value) collectObjectKeys(item, keys);
    return keys;
  }
  for (const [key, nested] of Object.entries(value)) {
    keys.add(key);
    collectObjectKeys(nested, keys);
  }
  return keys;
}

function collectStringValues(value: unknown, strings: string[] = []): string[] {
  if (typeof value === "string") {
    strings.push(value);
    return strings;
  }
  if (!value || typeof value !== "object") return strings;
  for (const nested of Array.isArray(value) ? value : Object.values(value)) collectStringValues(nested, strings);
  return strings;
}

export interface ArtworkGenerationResult {
  layerDataUrl: string;
  mimeType: "image/png" | "image/jpeg" | "image/webp" | "image/svg+xml";
  providerId: string;
  modelId: string;
  providerMode: "development" | "production";
  requestId: string;
  providerRequestId?: string;
  latencyMs: number;
  seed?: number;
  cost?: {
    amountUsd?: number;
    providerUnits?: number;
    providerUnitName?: string;
    kind: "actual" | "estimate" | "unavailable";
  };
}

export interface ArtworkGenerationProvider {
  readonly id: string;
  readonly modelId: string;
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
