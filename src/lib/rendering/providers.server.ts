import "server-only";
import { ArtworkGenerationProvider, ArtworkGenerationRequest, ArtworkGenerationResult } from "@/lib/rendering/contracts";
import { RenderPipelineError, translateUnknownError } from "@/lib/rendering/errors";

export class DevelopmentOuterArtProvider implements ArtworkGenerationProvider {
  readonly id = "development-svg-outer-art-v1";
  readonly mode = "development" as const;

  async generate(request: ArtworkGenerationRequest): Promise<ArtworkGenerationResult> {
    const svg = createDevelopmentOuterArt(request);
    return {
      layerDataUrl: `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`,
      mimeType: "image/svg+xml",
      providerId: this.id,
      providerMode: this.mode,
    };
  }
}

/**
 * Production adapter for a private HTTP image service. The endpoint must accept
 * structured plan data and return { imageBase64, mimeType }. Secrets are read
 * only in this server-only module and are never placed in client configuration.
 */
export class HttpArtworkGenerationProvider implements ArtworkGenerationProvider {
  readonly id = "configured-http-artwork-provider";
  readonly mode = "production" as const;

  constructor(private readonly endpoint: string, private readonly apiKey: string, private readonly timeoutMs = 30_000) {
    if (!endpoint || !apiKey) {
      throw new RenderPipelineError("MISSING_CONFIGURATION", "Production artwork generation is not configured.", false);
    }
  }

  async generate(request: ArtworkGenerationRequest): Promise<ArtworkGenerationResult> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const response = await fetch(this.endpoint, {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${this.apiKey}` },
        body: JSON.stringify(request),
        signal: controller.signal,
      });
      if (!response.ok) throw new RenderPipelineError("GENERATION_FAILED", `Artwork provider returned ${response.status}.`, true);
      const payload = await response.json() as { imageBase64?: string; mimeType?: string };
      if (!payload.imageBase64 || (payload.mimeType !== "image/png" && payload.mimeType !== "image/svg+xml")) {
        throw new RenderPipelineError("GENERATION_FAILED", "Artwork provider returned an invalid image layer.", true);
      }
      return {
        layerDataUrl: `data:${payload.mimeType};base64,${payload.imageBase64}`,
        mimeType: payload.mimeType,
        providerId: this.id,
        providerMode: this.mode,
      };
    } catch (error) {
      throw translateUnknownError(error);
    } finally {
      clearTimeout(timeout);
    }
  }
}

export function resolveArtworkProvider(): ArtworkGenerationProvider {
  const mode = process.env.AFTERMARK_ARTWORK_PROVIDER ?? "development";
  if (mode === "development") return new DevelopmentOuterArtProvider();
  if (mode === "http") {
    return new HttpArtworkGenerationProvider(
      process.env.AFTERMARK_ARTWORK_PROVIDER_URL ?? "",
      process.env.AFTERMARK_ARTWORK_PROVIDER_API_KEY ?? "",
    );
  }
  throw new RenderPipelineError("MISSING_CONFIGURATION", `Unknown artwork provider mode: ${mode}.`, false);
}

function createDevelopmentOuterArt({ plan, width, height }: ArtworkGenerationRequest): string {
  const p = plan.palette;
  const motif = plan.motifs[0] ?? "star";
  const thematic = motifPath(motif, p.primary);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 2048 2048">
    <g fill="none" stroke-linecap="round" stroke-linejoin="round">
      ${thematic}
      <path d="M455 530c80-92 188-38 189 48 38-86 161-112 208-28 54 98-117 221-197 276-85-54-270-174-200-296z" stroke="${p.surprise}" stroke-width="34"/>
      <path d="M1420 398l35 92 98 6-76 61 25 96-82-55-84 52 29-94-73-64 98 0z" stroke="${p.secondary}" stroke-width="30"/>
      <path d="M1442 1390c80 3 156 48 178 119-58 70-151 97-236 67-48-76-21-150 58-186z" stroke="${p.primary}" stroke-width="32"/>
      <path d="M1480 1475h5M1570 1475h5M1498 1522c34 25 68 24 101-2" stroke="${p.primary}" stroke-width="28"/>
      <path d="M326 1320c116 42 214 108 288 210M348 1380c92 31 165 75 223 137" stroke="${p.neutral}" stroke-width="30"/>
      <path d="M1405 835c116 27 214 24 318-18M1425 900c96 20 178 14 258-9" stroke="${p.secondary}" stroke-width="29"/>
      <path d="M390 955c105-51 216-61 314-28M398 1016c99-35 193-35 276-12" stroke="${p.primary}" stroke-width="30"/>
      <path d="M1338 1655l66 39-52 55 64 48-53 58" stroke="${p.surprise}" stroke-width="32"/>
      <path d="M625 1690c48-57 122-57 178 0-57 64-117 67-178 0zM714 1650v87" stroke="${p.neutral}" stroke-width="27"/>
      <path d="M818 314c-34 82-49 161-45 238M881 315c-30 85-39 160-26 233" stroke="${p.neutral}" stroke-width="28"/>
      <path d="M302 760l72 26-59 48 52 48-79 12" stroke="${p.secondary}" stroke-width="30"/>
      <path d="M1635 610c64 47 105 110 116 190M1567 654c47 38 81 91 91 153" stroke="${p.surprise}" stroke-width="29"/>
    </g>
    <g fill="${p.primary}"><circle cx="410" cy="1730" r="17"/><circle cx="512" cy="1780" r="12"/></g>
    <g fill="${p.surprise}"><circle cx="760" cy="360" r="14"/><circle cx="1740" cy="1130" r="15"/></g>
    <g fill="${p.neutral}"><circle cx="1700" cy="1260" r="16"/><circle cx="1260" cy="320" r="12"/></g>
  </svg>`;
}

function motifPath(motif: string, color: string): string {
  if (motif === "wave" || motif === "horizon") return `<path d="M330 1120c120-95 210 91 326 0 118-92 209 89 327-3" stroke="${color}" stroke-width="34"/>`;
  if (motif === "sun") return `<circle cx="420" cy="430" r="96" stroke="${color}" stroke-width="32"/><path d="M420 270v-80M420 670v-80M260 430h-80M660 430h-80" stroke="${color}" stroke-width="28"/>`;
  if (motif === "flower" || motif === "leaf") return `<path d="M430 500c-95-110-190 30-80 94-105 77 15 180 93 76 54 120 200 45 184-61 135-25 112-190-18-184-19-131-176-121-179 75z" stroke="${color}" stroke-width="31"/>`;
  if (motif === "cloud") return `<path d="M260 600c35-118 174-132 227-39 104-59 214 24 195 131H228c-23-54-10-87 32-92z" stroke="${color}" stroke-width="31"/>`;
  return `<path d="M360 430l38 98 104 6-81 65 27 101-88-59-89 55 31-100-78-69 105 1z" stroke="${color}" stroke-width="31"/>`;
}
