import { RecordArtDirection } from "@/types/record";

const names = {
  neon_scribble: ["SOFT STATIC", "AFTERGLOW", "CLEAR SIGNAL", "ELECTRIC SUMMER", "NEON RIOT", "MIDNIGHT COLOR"],
  analog_memory: ["FADED NOTE", "OLD HABITS", "LAST POSTCARD", "SUNDAY DRAWER"],
  dream_archive: ["SOFT ORBIT", "DREAM STATIC", "PALE MOON", "AFTER DREAM"],
} as const;

export function mapRecordType(input: RecordArtDirection): string {
  const pool = names[input.stylePack];
  const seed = `${input.material}:${input.doodleDensity}:${input.userMessage ?? ""}`
    .split("")
    .reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return pool[seed % pool.length];
}
