import "server-only";
import sharp, { Metadata } from "sharp";
import { RenderPipelineError } from "@/lib/rendering/errors";

export const OUTER_ART_SIZE = 2048;
export const OUTER_ART_CENTER = OUTER_ART_SIZE / 2;
export const OUTER_ART_OUTER_RADIUS = OUTER_ART_SIZE * 0.48;
export const OUTER_ART_CENTER_RADIUS = OUTER_ART_SIZE * 0.15;
const NEAR_EMPTY_ANNULAR_COVERAGE = 0.001;
const FULL_CANVAS_BACKGROUND_COVERAGE = 0.995;

export interface OuterArtQaMetrics {
  schemaVersion: "aftermark-outer-art-qa-v1";
  attemptCount: 1 | 2;
  selectedGeneratedPath: "assets/outer-art.raw.png";
  nativeDimensions: { width: number; height: number; channels: number };
  normalizedDimensions: { width: 2048; height: 2048; channels: 4 };
  alphaBackgroundResult: "pass" | "fail";
  visualTextCheck: "pass" | "fail";
  rawNontransparentCoverage: number;
  annularNontransparentCoverage: number;
  centerPixelsRemoved: number;
  outsideRecordPixelsRemoved: number;
  warnings: string[];
  failures: string[];
  retryCorrection?: string;
  accepted: boolean;
}

export async function normalizeAndValidateOuterArt(input: {
  raw: Buffer;
  attemptCount: 1 | 2;
  visualTextCheck: "pass" | "fail";
}): Promise<{ png: Buffer; qa: OuterArtQaMetrics }> {
  let metadata: Metadata;
  let normalized: Buffer;
  try {
    const source = sharp(input.raw, { failOn: "error", limitInputPixels: 64_000_000 }).rotate();
    metadata = await source.metadata();
    if (!metadata.width || !metadata.height) throw new Error("Image dimensions are unavailable.");
    normalized = await source
      .resize(OUTER_ART_SIZE, OUTER_ART_SIZE, { fit: "fill" })
      .ensureAlpha()
      .png({ compressionLevel: 9, adaptiveFiltering: true })
      .toBuffer();
  } catch (error) {
    throw new RenderPipelineError("INVALID_IMAGE", "The built-in image-generation result is corrupt or unsupported.", false, { cause: error });
  }

  const { data, info } = await sharp(normalized).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const pixelCount = info.width * info.height;
  let rawNontransparent = 0;
  let annularPixels = 0;
  let annularNontransparent = 0;
  let centerPixelsRemoved = 0;
  let outsideRecordPixelsRemoved = 0;
  for (let y = 0; y < info.height; y += 1) {
    for (let x = 0; x < info.width; x += 1) {
      const alpha = data[(y * info.width + x) * info.channels + 3];
      if (alpha > 0) rawNontransparent += 1;
      const distance = Math.hypot(x + 0.5 - OUTER_ART_CENTER, y + 0.5 - OUTER_ART_CENTER);
      if (distance <= OUTER_ART_CENTER_RADIUS) {
        if (alpha > 0) centerPixelsRemoved += 1;
      } else if (distance <= OUTER_ART_OUTER_RADIUS) {
        annularPixels += 1;
        if (alpha > 0) annularNontransparent += 1;
      } else if (alpha > 0) {
        outsideRecordPixelsRemoved += 1;
      }
    }
  }

  const rawCoverage = rawNontransparent / pixelCount;
  const annularCoverage = annularPixels ? annularNontransparent / annularPixels : 0;
  const failures: string[] = [];
  const warnings: string[] = [];
  if (rawNontransparent === 0) failures.push("empty_output");
  else if (annularCoverage < NEAR_EMPTY_ANNULAR_COVERAGE) failures.push("near_empty_output");
  if (rawCoverage >= FULL_CANVAS_BACKGROUND_COVERAGE) failures.push("fully_opaque_full_canvas_background");
  if (input.visualTextCheck === "fail") failures.push("readable_or_pseudo_text_detected");
  if (annularCoverage > 0 && (annularCoverage < 0.25 || annularCoverage > 0.4)) warnings.push("annular_coverage_outside_medium_guidance");

  const mask = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${OUTER_ART_SIZE}" height="${OUTER_ART_SIZE}">
    <mask id="annulus"><rect width="100%" height="100%" fill="black"/><circle cx="${OUTER_ART_CENTER}" cy="${OUTER_ART_CENTER}" r="${OUTER_ART_OUTER_RADIUS}" fill="white"/><circle cx="${OUTER_ART_CENTER}" cy="${OUTER_ART_CENTER}" r="${OUTER_ART_CENTER_RADIUS}" fill="black"/></mask>
    <rect width="100%" height="100%" fill="white" mask="url(#annulus)"/>
  </svg>`);
  const png = await sharp(normalized)
    .composite([{ input: mask, blend: "dest-in" }])
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toBuffer();
  const retryCorrection = failures.includes("fully_opaque_full_canvas_background")
    ? "Background must be genuinely transparent; remove the solid full-canvas field."
    : failures.includes("readable_or_pseudo_text_detected")
      ? "Remove all readable text and pseudo-lettering; keep abstract paint marks only."
      : failures.includes("empty_output") || failures.includes("near_empty_output")
        ? "Restore a medium-density annular set of opaque acrylic paint-marker marks."
        : undefined;
  const qa: OuterArtQaMetrics = {
    schemaVersion: "aftermark-outer-art-qa-v1",
    attemptCount: input.attemptCount,
    selectedGeneratedPath: "assets/outer-art.raw.png",
    nativeDimensions: { width: metadata.width!, height: metadata.height!, channels: metadata.channels ?? 0 },
    normalizedDimensions: { width: 2048, height: 2048, channels: 4 },
    alphaBackgroundResult: rawCoverage < FULL_CANVAS_BACKGROUND_COVERAGE ? "pass" : "fail",
    visualTextCheck: input.visualTextCheck,
    rawNontransparentCoverage: roundMetric(rawCoverage),
    annularNontransparentCoverage: roundMetric(annularCoverage),
    centerPixelsRemoved,
    outsideRecordPixelsRemoved,
    warnings,
    failures,
    ...(retryCorrection ? { retryCorrection } : {}),
    accepted: failures.length === 0,
  };
  return { png, qa };
}

function roundMetric(value: number): number {
  return Math.round(value * 1_000_000) / 1_000_000;
}
