import { RenderPipelineError } from "@/lib/rendering/errors";

const supportedSourceMimeTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"]);
const supportedAssetMimeTypes = new Set(["image/png", "image/svg+xml"]);

export function decodeImageDataUrl(value: string): { buffer: Buffer; mimeType: string } {
  const match = /^data:([^;,]+);base64,([A-Za-z0-9+/=\s]+)$/.exec(value);
  if (!match || !supportedSourceMimeTypes.has(match[1])) {
    throw new RenderPipelineError("INVALID_IMAGE", "Choose a supported JPG, PNG, WebP, GIF, or AVIF image.", false);
  }
  const buffer = Buffer.from(match[2].replace(/\s/g, ""), "base64");
  if (buffer.length === 0 || buffer.length > 18 * 1024 * 1024) {
    throw new RenderPipelineError("INVALID_IMAGE", "The image is empty or larger than 18 MB.", false);
  }
  return { buffer, mimeType: match[1] };
}

export function decodeAssetDataUrl(value: string): Buffer {
  const match = /^data:([^;,]+);base64,([A-Za-z0-9+/=\s]+)$/.exec(value);
  if (!match || !supportedAssetMimeTypes.has(match[1])) {
    throw new RenderPipelineError("GENERATION_FAILED", "The artwork provider returned an invalid image layer.", true);
  }
  const buffer = Buffer.from(match[2].replace(/\s/g, ""), "base64");
  if (buffer.length === 0 || buffer.length > 20 * 1024 * 1024) {
    throw new RenderPipelineError("GENERATION_FAILED", "The artwork provider returned an empty or oversized image layer.", true);
  }
  return buffer;
}
