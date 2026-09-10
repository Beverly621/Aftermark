import { StylePack } from "@/types/record";

const styleCodes: Record<StylePack, string> = {
  neon_scribble: "NS",
  analog_memory: "AM",
  dream_archive: "DA",
};

export function createCatalogNumber(style: StylePack, date = new Date()): string {
  const dateCode = [date.getFullYear().toString().slice(-2), String(date.getMonth() + 1).padStart(2, "0"), String(date.getDate()).padStart(2, "0")].join("");
  const seed = ((date.getTime() + style.length * 37) % 997) + 1;
  return `${styleCodes[style]}-${dateCode}-${String(seed).padStart(3, "0")}`;
}

export function todayIso(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}
