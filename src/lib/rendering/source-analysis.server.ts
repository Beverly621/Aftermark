import "server-only";
import { createHash } from "node:crypto";
import sharp from "sharp";
import { fallbackPalette } from "@/lib/palette-constants";
import { decodeImageDataUrl } from "@/lib/rendering/data-url.server";
import { RenderPipelineError } from "@/lib/rendering/errors";
import { ImagePalette, SourceImageAnalysis, SourceImageAnalyzer, SourceImageInput } from "@/types/record";

export class DevelopmentSourceImageAnalyzer implements SourceImageAnalyzer {
  async analyze(input: SourceImageInput): Promise<SourceImageAnalysis> {
    const { buffer } = decodeImageDataUrl(input.imageDataUrl);
    try {
      const metadata = await sharp(buffer, { failOn: "error" }).metadata();
      if (!metadata.width || !metadata.height) throw new Error("Image dimensions are unavailable");
      if (metadata.width * metadata.height > 40_000_000 || metadata.width > 12_000 || metadata.height > 12_000) {
        throw new Error("Image dimensions are too large");
      }
      const palette = sanitizePalette(input.palette ?? fallbackPalette);
      const motifs = inferDevelopmentMotifs(palette);
      return {
        palette,
        motifs,
        sceneSummary: "Palette-informed development analysis",
        sourceImageSha256: createHash("sha256").update(buffer).digest("hex"),
        analysisMode: "development",
      };
    } catch (error) {
      throw new RenderPipelineError("INVALID_IMAGE", "That image could not be decoded. Choose another image.", false, { cause: error });
    }
  }
}

export class PaletteFallbackAnalyzer implements SourceImageAnalyzer {
  async analyze(input: SourceImageInput): Promise<SourceImageAnalysis> {
    const { buffer } = decodeImageDataUrl(input.imageDataUrl);
    return {
      palette: sanitizePalette(input.palette ?? fallbackPalette),
      motifs: ["star", "arrow", "motion"],
      sourceImageSha256: createHash("sha256").update(buffer).digest("hex"),
      analysisMode: "palette-fallback",
    };
  }
}

function sanitizePalette(palette: ImagePalette): ImagePalette {
  const color = /^#[0-9a-f]{6}$/i;
  return {
    primary: color.test(palette.primary) ? palette.primary : fallbackPalette.primary,
    secondary: color.test(palette.secondary) ? palette.secondary : fallbackPalette.secondary,
    neutral: color.test(palette.neutral) ? palette.neutral : fallbackPalette.neutral,
    surprise: color.test(palette.surprise) ? palette.surprise : fallbackPalette.surprise,
  };
}

function inferDevelopmentMotifs(palette: ImagePalette): string[] {
  const [red, green, blue] = hexToRgb(palette.primary);
  if (blue > red * 1.12 && blue > green * 1.04) return ["wave", "sun", "bird", "horizon"];
  if (green > red * 1.1 && green > blue * 1.02) return ["flower", "leaf", "sun", "path"];
  if ((red + green + blue) / 3 < 92) return ["star", "moon", "streetlight", "window"];
  if (red > blue * 1.16) return ["sun", "flower", "heart", "motion"];
  return ["star", "cloud", "arrow", "circle"];
}

function hexToRgb(hex: string): [number, number, number] {
  return [1, 3, 5].map((index) => Number.parseInt(hex.slice(index, index + 2), 16)) as [number, number, number];
}
