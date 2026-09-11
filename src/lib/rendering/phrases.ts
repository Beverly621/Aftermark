import { PhraseGenerator } from "@/lib/rendering/contracts";

const phraseByMotif: Record<string, string> = {
  wave: "same sea",
  sun: "late light",
  bird: "open air",
  horizon: "still moving",
  flower: "in bloom",
  leaf: "green hours",
  path: "this way",
  star: "soft static",
  moon: "after dark",
  streetlight: "last light",
  window: "lights on",
  cloud: "passing through",
  arrow: "keep going",
  circle: "come around",
  heart: "held close",
  motion: "good days",
};

export class DevelopmentPhraseGenerator implements PhraseGenerator {
  async generate({ motifs }: Parameters<PhraseGenerator["generate"]>[0]): Promise<string[]> {
    const candidates = motifs.map((motif) => phraseByMotif[motif]).filter((phrase): phrase is string => Boolean(phrase));
    return sanitizeAiPhrases(candidates.length ? candidates.slice(0, 2) : ["good days"]);
  }
}

export function sanitizeAiPhrases(phrases: string[]): string[] {
  const unique = new Set<string>();
  for (const phrase of phrases) {
    const cleaned = phrase.replace(/[\r\n<>]/g, " ").replace(/\s+/g, " ").trim().slice(0, 48);
    const words = cleaned.split(/\s+/).filter(Boolean);
    if (words.length >= 2 && words.length <= 5) unique.add(cleaned);
    if (unique.size === 2) break;
  }
  return [...unique];
}
