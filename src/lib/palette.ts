import { ImagePalette } from "@/types/record";

export async function extractPalette(source: string): Promise<ImagePalette> {
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 24;
      canvas.height = 24;
      const context = canvas.getContext("2d", { willReadFrequently: true });
      if (!context) return resolve(fallbackPalette);
      context.drawImage(image, 0, 0, 24, 24);
      const pixels = context.getImageData(0, 0, 24, 24).data;
      const buckets = new Map<string, { total: number; r: number; g: number; b: number }>();
      for (let index = 0; index < pixels.length; index += 16) {
        const r = pixels[index];
        const g = pixels[index + 1];
        const b = pixels[index + 2];
        const key = `${Math.round(r / 48)}:${Math.round(g / 48)}:${Math.round(b / 48)}`;
        const bucket = buckets.get(key) ?? { total: 0, r: 0, g: 0, b: 0 };
        bucket.total += 1; bucket.r += r; bucket.g += g; bucket.b += b;
        buckets.set(key, bucket);
      }
      const colors = [...buckets.values()].sort((a, b) => b.total - a.total).slice(0, 2).map((entry) => rgbToHex(entry.r / entry.total, entry.g / entry.total, entry.b / entry.total));
      resolve({ primary: colors[0] ?? fallbackPalette.primary, secondary: colors[1] ?? fallbackPalette.secondary, neutral: "#f4f0e6", surprise: "#ff4f9a" });
    };
    image.onerror = () => resolve(fallbackPalette);
    image.src = source;
  });
}

const fallbackPalette: ImagePalette = { primary: "#2bc4d9", secondary: "#ffd34e", neutral: "#f4f0e6", surprise: "#ff4f9a" };

function rgbToHex(red: number, green: number, blue: number) {
  return `#${[red, green, blue].map((value) => Math.round(value).toString(16).padStart(2, "0")).join("")}`;
}
