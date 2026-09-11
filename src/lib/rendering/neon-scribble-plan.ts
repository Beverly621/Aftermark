import { RenderPipelineError } from "@/lib/rendering/errors";
import { sanitizeAiPhrases } from "@/lib/rendering/phrases";
import { NeonScribbleRenderPlan, RecordArtDirection, SourceImageAnalysis } from "@/types/record";

export function isGoldenPath(input: RecordArtDirection): boolean {
  return input.stylePack === "neon_scribble" && input.doodleDensity === "medium" && input.material === "classic";
}

export function buildNeonScribbleRenderPlan(input: {
  artDirection: RecordArtDirection;
  analysis: SourceImageAnalysis;
  aiPhrases: string[];
}): NeonScribbleRenderPlan {
  if (!isGoldenPath(input.artDirection)) {
    throw new RenderPipelineError(
      "UNSUPPORTED_COMBINATION",
      "Task 01 supports After Dark, Leave a Trace, and Classic only.",
      false,
    );
  }

  const motifs = [...new Set(input.analysis.motifs.map(normalizeMotif).filter(Boolean))].slice(0, 4);
  const aiPhrases = sanitizeAiPhrases(input.aiPhrases);
  const prompt = [
    "Create a transparent outer artwork layer for a real black vinyl record.",
    "Use opaque acrylic paint-marker strokes with hand pressure variation, uneven edges, repeated passes, and human wobble.",
    `Use this controlled palette: primary ${input.analysis.palette.primary}, secondary ${input.analysis.palette.secondary}, neutral ${input.analysis.palette.neutral}, surprise accent ${input.analysis.palette.surprise}.`,
    `Use one loose larger motif and smaller marginal marks inspired by: ${motifs.join(", ") || "star, arrow, circle"}.`,
    "Medium density: rich and energetic, roughly 6–10 meaningful larger elements and 10–18 smaller marks, with visible breathing room.",
    "Reserve the center 30% diameter as a completely clean circular zone. Preserve visible grooves between marks.",
    "No typography, letters, numbers, signatures, labels, center photo, sleeve, or background. Output marks only on transparency.",
  ].join(" ");

  return {
    version: "neon-scribble-v1",
    palette: input.analysis.palette,
    density: "medium",
    material: "classic",
    motifs,
    userMessage: input.artDirection.userMessage,
    aiPhrases,
    composition: {
      centerLabelRatio: 0.3,
      preserveGrooves: true,
      maxLargeMotifs: 1,
      centerProtection: "composite-source-last",
    },
    prompt,
    negativePrompt: "cyberpunk HUD, neon signage, glossy CGI, vector icons, sticker collage, chalk, crayon, watercolor, rainbow fill, poster layout, text, letters, logo, face, portrait, center label",
  };
}

function normalizeMotif(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9 -]/g, "").trim().split(/\s+/).slice(0, 2).join(" ");
}
