import { RecordMaterial, StylePack } from "@/types/record";

export interface MaterialStyleModifiers {
  markerContrast: number;
  glow: number;
  iridescence: number;
  transparency: number;
}

export function getMaterialStyleModifiers(stylePack: StylePack, material: RecordMaterial): MaterialStyleModifiers {
  const base: Record<RecordMaterial, MaterialStyleModifiers> = {
    classic: { markerContrast: 1, glow: 0.15, iridescence: 0, transparency: 0 },
    clear: { markerContrast: 1.12, glow: 0.2, iridescence: 0.08, transparency: 0.55 },
    smoke: { markerContrast: 1.05, glow: 0.12, iridescence: 0, transparency: 0.28 },
    aurora: { markerContrast: 1.08, glow: 0.36, iridescence: 0.68, transparency: 0.12 },
    pearl: { markerContrast: 1.22, glow: 0.24, iridescence: 0.28, transparency: 0.08 },
  };

  const modifiers = { ...base[material] };
  if (stylePack === "dream_archive" && material === "aurora") modifiers.glow = 0.62;
  if (stylePack === "analog_memory" && material === "aurora") modifiers.iridescence = 0.28;
  if (stylePack === "neon_scribble" && material === "pearl") modifiers.markerContrast = 1.36;
  return modifiers;
}
