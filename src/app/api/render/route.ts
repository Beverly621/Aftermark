import { ServerAIRecordRenderer } from "@/lib/rendering/ai-record-renderer.server";
import { RenderPipelineError, translateUnknownError } from "@/lib/rendering/errors";
import { validateUserMessage } from "@/lib/message-validation";
import { RecordArtDirection } from "@/types/record";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_REQUEST_BYTES = 25 * 1024 * 1024;

export async function POST(request: Request) {
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > MAX_REQUEST_BYTES) {
    return errorResponse(new RenderPipelineError("INVALID_IMAGE", "The render request is too large.", false));
  }

  try {
    const payload = await readJsonBody(request);
    const artDirection = parseArtDirection(payload.artDirection);
    const result = await new ServerAIRecordRenderer().render(artDirection);
    return Response.json({ result }, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    return errorResponse(translateUnknownError(error));
  }
}

function parseArtDirection(value: unknown): RecordArtDirection {
  if (!value || typeof value !== "object") throw new RenderPipelineError("INVALID_REQUEST", "The render request is invalid.", false);
  const input = value as Partial<RecordArtDirection>;
  if (typeof input.image !== "string" || !input.image.startsWith("data:image/")) {
    throw new RenderPipelineError("INVALID_IMAGE", "Choose a supported image and try again.", false);
  }
  if (input.stylePack !== "neon_scribble" || input.doodleDensity !== "medium" || input.material !== "classic") {
    throw new RenderPipelineError("UNSUPPORTED_COMBINATION", "Task 01 supports After Dark, Leave a Trace, and Classic only.", false);
  }
  if (!isIsoDate(input.date) || typeof input.catalogNumber !== "string" || !/^NS-\d{6}-\d{3}$/.test(input.catalogNumber)) {
    throw new RenderPipelineError("INVALID_REQUEST", "The collectible metadata is invalid.", false);
  }
  if (input.userMessage !== undefined) {
    if (typeof input.userMessage !== "string" || !validateUserMessage(input.userMessage).valid) {
      throw new RenderPipelineError("INVALID_MESSAGE", "Keep your mark to 30 words or characters.", false);
    }
  }
  if (input.imagePalette !== undefined && !isImagePalette(input.imagePalette)) {
    throw new RenderPipelineError("INVALID_REQUEST", "The image palette is invalid.", false);
  }
  return input as RecordArtDirection;
}

async function readJsonBody(request: Request): Promise<{ artDirection?: unknown }> {
  if (!request.body) throw new RenderPipelineError("INVALID_REQUEST", "The render request is empty.", false);
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > MAX_REQUEST_BYTES) {
      await reader.cancel();
      throw new RenderPipelineError("INVALID_IMAGE", "The render request is too large.", false);
    }
    chunks.push(value);
  }

  const body = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }

  try {
    return JSON.parse(new TextDecoder().decode(body)) as { artDirection?: unknown };
  } catch {
    throw new RenderPipelineError("INVALID_REQUEST", "The render request is not valid JSON.", false);
  }
}

function isIsoDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value;
}

function isImagePalette(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  const palette = value as Record<string, unknown>;
  return ["primary", "secondary", "neutral", "surprise"].every((key) => typeof palette[key] === "string" && /^#[0-9a-f]{6}$/i.test(palette[key]));
}

function errorResponse(error: RenderPipelineError) {
  const status = error.code === "INVALID_IMAGE" || error.code === "INVALID_MESSAGE" || error.code === "INVALID_REQUEST" ? 400
    : error.code === "UNSUPPORTED_COMBINATION" ? 422
      : error.code === "MISSING_CONFIGURATION" ? 503
        : error.code === "TIMEOUT" ? 504
          : 502;
  return Response.json({ error: { code: error.code, message: error.message, retryable: error.retryable } }, { status, headers: { "cache-control": "no-store" } });
}
