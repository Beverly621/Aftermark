import sharp from "sharp";
import { parseStudioRequest } from "@/lib/studio/contracts";
import {
  StudioRuntimeError,
  assertLocalStudioRequest,
  createStudioBrowserSnapshot,
  loadStudioRuntimeContext,
  writeStudioRequest,
} from "@/lib/studio/runtime.server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_SOURCE_BYTES = 18 * 1024 * 1024;
const MIME_EXTENSIONS: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};

export async function POST(request: Request) {
  try {
    assertLocalStudioRequest(request);
    const contentLength = Number(request.headers.get("content-length") ?? 0);
    if (contentLength > MAX_SOURCE_BYTES + 64 * 1024) throw new StudioRuntimeError("The Studio upload is too large.", 413);

    const context = await loadStudioRuntimeContext();
    const form = await request.formData();
    const source = form.get("source");
    const requestJson = form.get("request");
    if (!(source instanceof File) || typeof requestJson !== "string") {
      throw new StudioRuntimeError("Studio request must include one source image and request JSON.");
    }
    if (!MIME_EXTENSIONS[source.type]) throw new StudioRuntimeError("Use a PNG, JPEG, or WebP source image.", 415);
    if (source.size <= 0 || source.size > MAX_SOURCE_BYTES) throw new StudioRuntimeError("The Studio source image is empty or too large.", 413);

    let requestValue: unknown;
    try {
      requestValue = JSON.parse(requestJson);
    } catch {
      throw new StudioRuntimeError("Studio request JSON is invalid.");
    }
    const studioRequest = parseStudioRequest(requestValue, context.session);
    const expectedPath = `assets/source.${MIME_EXTENSIONS[source.type]}`;
    if (studioRequest.sourceImagePath.toLowerCase() !== expectedPath) {
      throw new StudioRuntimeError("Studio request source path does not match the uploaded image type.");
    }
    if (new Date(studioRequest.createdAt).valueOf() > Date.now() + 5 * 60_000) {
      throw new StudioRuntimeError("Studio request timestamp is in the future.");
    }

    const sourceBuffer = Buffer.from(await source.arrayBuffer());
    try {
      const metadata = await sharp(sourceBuffer, { failOn: "error" }).metadata();
      if (!metadata.width || !metadata.height || metadata.width > 12_000 || metadata.height > 12_000 || metadata.width * metadata.height > 40_000_000) {
        throw new Error("unsupported dimensions");
      }
    } catch {
      throw new StudioRuntimeError("The uploaded source is not a valid supported image.", 415);
    }

    const updated = await writeStudioRequest(context, studioRequest, sourceBuffer);
    return Response.json(await createStudioBrowserSnapshot(updated), {
      status: 201,
      headers: { "cache-control": "no-store" },
    });
  } catch (error) {
    const runtimeError = error instanceof StudioRuntimeError ? error : new StudioRuntimeError("Aftermark Studio could not save this request.", 500);
    return Response.json(
      { error: runtimeError.message },
      { status: runtimeError.status, headers: { "cache-control": "no-store" } },
    );
  }
}
