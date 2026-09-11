import "server-only";

import {
  ArtworkGenerationProvider,
  ArtworkGenerationRequest,
  ArtworkGenerationResult,
  createArtworkProviderPrompt,
} from "@/lib/rendering/contracts";
import { RenderPipelineError, translateUnknownError } from "@/lib/rendering/errors";

const OPENAI_ENDPOINT = "https://api.openai.com/v1/images/generations";
const GOOGLE_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models";
const BFL_ENDPOINT = "https://api.bfl.ai/v1";

export type BenchmarkProviderId = "openai" | "google" | "bfl";

export interface BenchmarkProviderCandidate {
  alias: "P1" | "P2" | "P3";
  providerId: BenchmarkProviderId;
  modelId: string;
  available: boolean;
  missingConfiguration: string[];
  create(): ArtworkGenerationProvider;
}

export function createBenchmarkProviderCandidates(env: NodeJS.ProcessEnv = process.env): BenchmarkProviderCandidate[] {
  const openAiKey = env.AFTERMARK_OPENAI_API_KEY || env.OPENAI_API_KEY || "";
  const googleKey = env.AFTERMARK_GOOGLE_API_KEY || env.GEMINI_API_KEY || env.GOOGLE_API_KEY || "";
  const bflKey = env.AFTERMARK_BFL_API_KEY || env.BFL_API_KEY || "";
  const openAiModel = env.AFTERMARK_OPENAI_IMAGE_MODEL || "gpt-image-2";
  const googleModel = env.AFTERMARK_GOOGLE_IMAGE_MODEL || "gemini-3-pro-image";
  if (googleModel !== "gemini-3-pro-image") {
    throw new RenderPipelineError("MISSING_CONFIGURATION", "The frozen Google benchmark model must be gemini-3-pro-image.", false);
  }
  const bflModel = env.AFTERMARK_BFL_IMAGE_MODEL || "flux-2-pro";

  return [
    candidate("P1", "openai", openAiModel, openAiKey, "AFTERMARK_OPENAI_API_KEY or OPENAI_API_KEY", () => new OpenAIImageProvider(openAiKey, openAiModel, optionalCost(env.AFTERMARK_OPENAI_COST_ESTIMATE_USD))),
    candidate("P2", "google", googleModel, googleKey, "AFTERMARK_GOOGLE_API_KEY, GEMINI_API_KEY, or GOOGLE_API_KEY", () => new GoogleImageProvider(googleKey, googleModel, optionalCost(env.AFTERMARK_GOOGLE_COST_ESTIMATE_USD))),
    candidate("P3", "bfl", bflModel, bflKey, "AFTERMARK_BFL_API_KEY or BFL_API_KEY", () => new BflImageProvider(bflKey, bflModel)),
  ];
}

function candidate(
  alias: BenchmarkProviderCandidate["alias"],
  providerId: BenchmarkProviderId,
  modelId: string,
  apiKey: string,
  keyDescription: string,
  factory: () => ArtworkGenerationProvider,
): BenchmarkProviderCandidate {
  return {
    alias,
    providerId,
    modelId,
    available: Boolean(apiKey),
    missingConfiguration: apiKey ? [] : [keyDescription],
    create: factory,
  };
}

abstract class RealBenchmarkProvider implements ArtworkGenerationProvider {
  readonly mode = "production" as const;

  constructor(
    readonly id: string,
    readonly modelId: string,
    protected readonly apiKey: string,
    protected readonly timeoutMs = 120_000,
  ) {
    if (!apiKey) throw new RenderPipelineError("MISSING_CONFIGURATION", `${id} benchmark credentials are not configured.`, false);
  }

  abstract generate(request: ArtworkGenerationRequest): Promise<ArtworkGenerationResult>;
}

export class OpenAIImageProvider extends RealBenchmarkProvider {
  constructor(apiKey: string, modelId = "gpt-image-2", private readonly costEstimateUsd?: number) {
    super("openai-images", modelId, apiKey);
  }

  async generate(request: ArtworkGenerationRequest): Promise<ArtworkGenerationResult> {
    const startedAt = performance.now();
    try {
      const response = await fetchWithTimeout(OPENAI_ENDPOINT, {
        method: "POST",
        headers: { authorization: `Bearer ${this.apiKey}`, "content-type": "application/json" },
        body: JSON.stringify({
          model: this.modelId,
          prompt: createArtworkProviderPrompt(request),
          size: `${request.width}x${request.height}`,
          quality: "high",
          background: "transparent",
          output_format: "png",
          n: 1,
        }),
      }, this.timeoutMs);
      const payload = await readProviderJson<{ data?: Array<{ b64_json?: string }>; id?: string; request_id?: string }>(response, this.id);
      const imageBase64 = payload.data?.[0]?.b64_json;
      if (!imageBase64) throw invalidProviderResponse(this.id);
      return result(request, this, imageBase64, "image/png", startedAt, {
        providerRequestId: payload.request_id ?? payload.id,
        cost: this.costEstimateUsd === undefined ? { kind: "unavailable" } : { kind: "estimate", amountUsd: this.costEstimateUsd },
      });
    } catch (error) {
      throw translateUnknownError(error);
    }
  }
}

export class GoogleImageProvider extends RealBenchmarkProvider {
  constructor(apiKey: string, modelId = "gemini-3-pro-image", private readonly costEstimateUsd?: number) {
    if (modelId !== "gemini-3-pro-image") {
      throw new RenderPipelineError("MISSING_CONFIGURATION", "The frozen Google benchmark model must be gemini-3-pro-image.", false);
    }
    super("google-gemini-images", modelId, apiKey);
  }

  async generate(request: ArtworkGenerationRequest): Promise<ArtworkGenerationResult> {
    const startedAt = performance.now();
    try {
      const endpoint = `${GOOGLE_ENDPOINT}/${encodeURIComponent(this.modelId)}:generateContent`;
      const response = await fetchWithTimeout(endpoint, {
        method: "POST",
        headers: { "x-goog-api-key": this.apiKey, "content-type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: createArtworkProviderPrompt(request) }] }],
          generationConfig: {
            responseModalities: ["IMAGE"],
            responseFormat: { image: { aspectRatio: "1:1", imageSize: "2K" } },
          },
        }),
      }, this.timeoutMs);
      const payload = await readProviderJson<{
        responseId?: string;
        candidates?: Array<{ content?: { parts?: Array<{ inlineData?: { data?: string; mimeType?: string }; inline_data?: { data?: string; mime_type?: string } }> } }>;
      }>(response, this.id);
      const parts = payload.candidates?.[0]?.content?.parts ?? [];
      const imagePart = parts.find((part) => part.inlineData?.data || part.inline_data?.data);
      const imageBase64 = imagePart?.inlineData?.data ?? imagePart?.inline_data?.data;
      const mimeType = normalizeRasterMime(imagePart?.inlineData?.mimeType ?? imagePart?.inline_data?.mime_type);
      if (!imageBase64 || !mimeType) throw invalidProviderResponse(this.id);
      return result(request, this, imageBase64, mimeType, startedAt, {
        providerRequestId: payload.responseId,
        cost: this.costEstimateUsd === undefined ? { kind: "unavailable" } : { kind: "estimate", amountUsd: this.costEstimateUsd },
      });
    } catch (error) {
      throw translateUnknownError(error);
    }
  }
}

export class BflImageProvider extends RealBenchmarkProvider {
  constructor(apiKey: string, modelId = "flux-2-pro") {
    super("black-forest-labs", modelId, apiKey);
  }

  async generate(request: ArtworkGenerationRequest): Promise<ArtworkGenerationResult> {
    const startedAt = performance.now();
    try {
      const response = await fetchWithTimeout(`${BFL_ENDPOINT}/${encodeURIComponent(this.modelId)}`, {
        method: "POST",
        headers: { "x-key": this.apiKey, accept: "application/json", "content-type": "application/json" },
        body: JSON.stringify({
          prompt: createArtworkProviderPrompt(request),
          width: request.width,
          height: request.height,
          output_format: "png",
          prompt_upsampling: false,
        }),
      }, this.timeoutMs);
      const submitted = await readProviderJson<{ id?: string; polling_url?: string; cost?: number }>(response, this.id);
      if (!submitted.id || !submitted.polling_url || !isTrustedBflUrl(submitted.polling_url)) throw invalidProviderResponse(this.id);
      const ready = await this.poll(submitted.polling_url, startedAt);
      if (!ready.sample || !isTrustedBflUrl(ready.sample)) throw invalidProviderResponse(this.id);
      const imageResponse = await fetchWithTimeout(ready.sample, { headers: { accept: "image/*" } }, this.timeoutMs);
      if (!imageResponse.ok) throw providerHttpError(this.id, imageResponse.status);
      const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
      if (!imageBuffer.length || imageBuffer.length > 40 * 1024 * 1024) throw invalidProviderResponse(this.id);
      const mimeType = normalizeRasterMime(imageResponse.headers.get("content-type")) ?? "image/png";
      return result(request, this, imageBuffer.toString("base64"), mimeType, startedAt, {
        providerRequestId: submitted.id,
        cost: typeof submitted.cost === "number"
          ? { kind: "actual", amountUsd: submitted.cost * 0.01, providerUnits: submitted.cost, providerUnitName: "credits" }
          : { kind: "unavailable" },
      });
    } catch (error) {
      throw translateUnknownError(error);
    }
  }

  private async poll(pollingUrl: string, startedAt: number): Promise<{ sample?: string }> {
    while (performance.now() - startedAt < this.timeoutMs) {
      const response = await fetchWithTimeout(pollingUrl, { headers: { "x-key": this.apiKey, accept: "application/json" } }, 15_000);
      const payload = await readProviderJson<{ status?: string; result?: { sample?: string } }>(response, this.id);
      if (payload.status === "Ready") return payload.result ?? {};
      if (payload.status === "Error" || payload.status === "Failed" || payload.status === "Request Moderated" || payload.status === "Content Moderated") {
        throw new RenderPipelineError("GENERATION_FAILED", `${this.id} could not complete the benchmark render.`, true);
      }
      await new Promise((resolve) => setTimeout(resolve, 750));
    }
    throw new RenderPipelineError("TIMEOUT", `${this.id} benchmark render timed out.`, true);
  }
}

function result(
  request: ArtworkGenerationRequest,
  provider: Pick<ArtworkGenerationProvider, "id" | "modelId" | "mode">,
  imageBase64: string,
  mimeType: ArtworkGenerationResult["mimeType"],
  startedAt: number,
  metadata: Pick<ArtworkGenerationResult, "providerRequestId" | "cost">,
): ArtworkGenerationResult {
  return {
    layerDataUrl: `data:${mimeType};base64,${imageBase64}`,
    mimeType,
    providerId: provider.id,
    modelId: provider.modelId,
    providerMode: provider.mode,
    requestId: request.requestId,
    providerRequestId: metadata.providerRequestId,
    latencyMs: Math.round(performance.now() - startedAt),
    cost: metadata.cost,
  };
}

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") throw new RenderPipelineError("TIMEOUT", "Artwork provider timed out.", true);
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

async function readProviderJson<T>(response: Response, providerId: string): Promise<T> {
  if (!response.ok) throw providerHttpError(providerId, response.status);
  try {
    return await response.json() as T;
  } catch (error) {
    throw new RenderPipelineError("GENERATION_FAILED", `${providerId} returned invalid JSON.`, true, { cause: error });
  }
}

function providerHttpError(providerId: string, status: number): RenderPipelineError {
  return new RenderPipelineError("GENERATION_FAILED", `${providerId} returned HTTP ${status}.`, status === 408 || status === 409 || status === 429 || status >= 500);
}

function invalidProviderResponse(providerId: string): RenderPipelineError {
  return new RenderPipelineError("GENERATION_FAILED", `${providerId} returned an invalid image result.`, true);
}

function normalizeRasterMime(value: string | null | undefined): ArtworkGenerationResult["mimeType"] | undefined {
  const mime = value?.split(";")[0].trim().toLowerCase();
  return mime === "image/png" || mime === "image/jpeg" || mime === "image/webp" ? mime : undefined;
}

function isTrustedBflUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && (url.hostname === "bfl.ai" || url.hostname.endsWith(".bfl.ai"));
  } catch {
    return false;
  }
}

function optionalCost(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
}
