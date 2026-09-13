import { createHash } from "node:crypto";
import { AftermarkStudioRequest, StudioProtocolError } from "@/lib/studio/contracts";
import { NeonScribbleRenderPlan } from "@/types/record";

export const SOURCE_ANALYSIS_SCHEMA = "aftermark-source-analysis-v1" as const;
export const GENERATION_PLAN_SCHEMA = "aftermark-neon-plan-v1" as const;

const HEX_COLOR = /^#[0-9a-f]{6}$/i;
const SHA256 = /^[0-9a-f]{64}$/i;
const BLOCKED_PROMPT_TERMS = ["userMessage", "catalogNumber", "deterministicMetadata", "recordType", "renderedAt"];

export interface NativeSourceMotif {
  name: string;
  visualShorthand: string;
  salience: "high" | "medium" | "low";
}

export interface NativeSourceAnalysis {
  schemaVersion: typeof SOURCE_ANALYSIS_SCHEMA;
  sessionId: string;
  sourceImageSha256: string;
  sourceSummary: string;
  palette: {
    primary: string[];
    neutral: string[];
    surprise: string[];
  };
  motifs: NativeSourceMotif[];
  mood: string[];
  avoidMotifs: string[];
}

export interface NativeGenerationPlan {
  schemaVersion: typeof GENERATION_PLAN_SCHEMA;
  sessionId: string;
  assetRole: "outer_art_overlay";
  stylePack: "neon_scribble";
  density: "medium";
  compositionMode: "text_led" | "motif_led";
  materialContext: "deep glossy black classic vinyl";
  outputIntent: {
    background: "transparent";
    text: "none";
    finalUse: "overlay_on_vinyl";
  };
  palette: {
    sourceWeight: 0.65;
    neutralWeight: 0.25;
    surpriseWeight: 0.1;
    colors: string[];
  };
  motifs: string[];
  mood: string[];
  marginalPhrases: string[];
  layout: {
    protectedCenterDiameterRatio: 0.3;
    outerCircleDiameterRatio: 0.96;
    heroLetteringReserved: boolean;
    heroLetteringCorridor: "lower-right curved arc" | "none";
    heroMotifMaxCount: 1;
    asymmetry: "strong";
  };
  paint: {
    medium: "opaque acrylic paint marker";
    edge: "slightly irregular";
    stroke: "pressure variation, occasional repeated pass, slight hand wobble";
    glow: "none";
  };
  avoid: string[];
  compiledPrompt: string;
}

export function parseNativeSourceAnalysis(value: unknown, request: AftermarkStudioRequest): NativeSourceAnalysis {
  const input = objectValue(value, "analysis.json");
  assertExactKeys(input, [
    "schemaVersion",
    "sessionId",
    "sourceImageSha256",
    "sourceSummary",
    "palette",
    "motifs",
    "mood",
    "avoidMotifs",
  ], "analysis.json");
  if (input.schemaVersion !== SOURCE_ANALYSIS_SCHEMA) throw new StudioProtocolError("Unsupported source-analysis schema.");
  if (input.sessionId !== request.sessionId) throw new StudioProtocolError("analysis.json belongs to a different session.");
  if (typeof input.sourceImageSha256 !== "string" || !SHA256.test(input.sourceImageSha256)) throw new StudioProtocolError("analysis.json has an invalid source hash.");
  if (typeof input.sourceSummary !== "string" || !betweenWords(input.sourceSummary, 2, 24)) throw new StudioProtocolError("analysis.json sourceSummary must be compact.");

  const palette = objectValue(input.palette, "analysis palette");
  assertExactKeys(palette, ["primary", "neutral", "surprise"], "analysis palette");
  const primary = parseStringArray(palette.primary, "analysis primary palette", 1, 3, HEX_COLOR);
  const neutral = parseStringArray(palette.neutral, "analysis neutral palette", 1, 2, HEX_COLOR);
  const surprise = parseStringArray(palette.surprise, "analysis surprise palette", 1, 1, HEX_COLOR);
  const colors = [...new Set([...primary, ...neutral, ...surprise].map((color) => color.toLowerCase()))];
  if (colors.length < 3 || colors.length > 5) throw new StudioProtocolError("analysis.json must contain 3–5 distinct palette colors.");

  if (!Array.isArray(input.motifs) || input.motifs.length < 3 || input.motifs.length > 6) {
    throw new StudioProtocolError("analysis.json must contain 3–6 motifs.");
  }
  const motifs = input.motifs.map((value, index) => parseMotif(value, index));
  const mood = parseStringArray(input.mood, "analysis mood", 2, 4);
  const avoidMotifs = parseStringArray(input.avoidMotifs, "analysis avoidMotifs", 0, 8);
  return {
    schemaVersion: SOURCE_ANALYSIS_SCHEMA,
    sessionId: request.sessionId,
    sourceImageSha256: input.sourceImageSha256.toLowerCase(),
    sourceSummary: input.sourceSummary.trim(),
    palette: { primary, neutral, surprise },
    motifs,
    mood,
    avoidMotifs,
  };
}

export function compileNativeGenerationPlan(
  request: AftermarkStudioRequest,
  analysis: NativeSourceAnalysis,
): NativeGenerationPlan {
  if (request.stylePack !== "neon_scribble" || request.doodleDensity !== "medium" || request.material !== "classic") {
    throw new StudioProtocolError("Task 2C02 supports only After Dark, Leave a Trace, and Classic.");
  }
  if (analysis.sessionId !== request.sessionId) throw new StudioProtocolError("Source analysis does not match the Studio request.");

  const colors = [...analysis.palette.primary, ...analysis.palette.neutral, ...analysis.palette.surprise];
  const motifs = analysis.motifs.map((motif) => motif.name);
  const motifLanguage = analysis.motifs.map((motif) => motif.visualShorthand).join("; ");
  const modeInstruction = request.compositionMode === "text_led"
    ? "Reserve one broad, loose, curved lower-right hero-lettering corridor across the annulus. Keep it substantially clear so Aftermark can add precise typography later. Marks may frame, underline, point toward, or orbit the corridor, but draw no letters or pseudo-letter shapes."
    : "Let one source-derived thematic motif lead without becoming a polished standalone illustration. Build the rest from smaller source-derived symbols, arrows, circles, stars, short abstract strokes, and micro marks.";
  const compiledPrompt = [
    "Asset role: Create a transparent raster overlay of hand-drawn acrylic paint-marker doodles for the outer area of a collectible black vinyl record. This is NOT the final record.",
    "Material/mark language: Opaque POSCA-like acrylic paint marker. Pigment-rich matte marks intended to sit over deep glossy black vinyl. Slightly irregular edges, pressure variation, occasional repeated strokes, subtle hand wobble. No glow.",
    "Circular composition: Compose marks around a centered vinyl annulus. Keep the central 30% diameter visually quiet and keep marks inside the outer circular record area. Aftermark will enforce the mask deterministically.",
    "Density: Medium / LEAVE A TRACE. Rich but breathable. One large thematic motif maximum, 4–7 medium marks, 10–18 micro marks, strongly irregular and asymmetric spacing, with visible negative space.",
    `Palette: ${colors.join(", ")}. Use source-derived colors as the main family, neutrals as structure, and one restrained surprise accent. Avoid equal rainbow distribution.`,
    `Motif vocabulary: ${motifLanguage}.`,
    `Mood: ${analysis.mood.join(", ")}.`,
    `Mode: ${modeInstruction}`,
    "Output: Transparent background. Paint marks only.",
    "Hard constraints: No photo, portrait, reproduced source image, vinyl mockup, sleeve, final record, words, letters, numbers, labels, logos, signatures, or watermark. No chalk, wax-crayon look, smooth vector illustration, digital neon glow, cyberpunk HUD, generic sticker pack, or evenly spaced radial ring.",
  ].join("\n\n");
  const marginalPhrases = analysis.mood
    .map((word) => word.replace(/[-_]+/g, " ").trim())
    .filter((phrase) => betweenWords(phrase, 2, 5))
    .slice(0, 2);

  const plan: NativeGenerationPlan = {
    schemaVersion: GENERATION_PLAN_SCHEMA,
    sessionId: request.sessionId,
    assetRole: "outer_art_overlay",
    stylePack: "neon_scribble",
    density: "medium",
    compositionMode: request.compositionMode,
    materialContext: "deep glossy black classic vinyl",
    outputIntent: { background: "transparent", text: "none", finalUse: "overlay_on_vinyl" },
    palette: { sourceWeight: 0.65, neutralWeight: 0.25, surpriseWeight: 0.1, colors },
    motifs,
    mood: analysis.mood,
    marginalPhrases,
    layout: {
      protectedCenterDiameterRatio: 0.3,
      outerCircleDiameterRatio: 0.96,
      heroLetteringReserved: request.compositionMode === "text_led",
      heroLetteringCorridor: request.compositionMode === "text_led" ? "lower-right curved arc" : "none",
      heroMotifMaxCount: 1,
      asymmetry: "strong",
    },
    paint: {
      medium: "opaque acrylic paint marker",
      edge: "slightly irregular",
      stroke: "pressure variation, occasional repeated pass, slight hand wobble",
      glow: "none",
    },
    avoid: [
      "letters", "words", "numbers", "logos", "watermarks", "chalk", "wax crayon", "smooth vector",
      "cyberpunk HUD", "sticker-pack layout", "even radial spacing", ...analysis.avoidMotifs,
    ],
    compiledPrompt,
  };
  assertNativePromptPrivacy(plan, request);
  return plan;
}

export function parseNativeGenerationPlan(value: unknown, request: AftermarkStudioRequest): NativeGenerationPlan {
  const input = objectValue(value, "generation-plan.json");
  const analysisLike = input as unknown as NativeGenerationPlan;
  if (analysisLike.schemaVersion !== GENERATION_PLAN_SCHEMA || analysisLike.sessionId !== request.sessionId) {
    throw new StudioProtocolError("generation-plan.json does not match this session.");
  }
  if (analysisLike.assetRole !== "outer_art_overlay" || analysisLike.stylePack !== "neon_scribble" || analysisLike.density !== "medium") {
    throw new StudioProtocolError("generation-plan.json has an unsupported production scope.");
  }
  if (analysisLike.compositionMode !== request.compositionMode || analysisLike.outputIntent?.text !== "none" || typeof analysisLike.compiledPrompt !== "string") {
    throw new StudioProtocolError("generation-plan.json has an invalid output contract.");
  }
  assertNativePromptPrivacy(analysisLike, request);
  return analysisLike;
}

export function assertNativePromptPrivacy(plan: NativeGenerationPlan, request: AftermarkStudioRequest): void {
  const serialized = JSON.stringify(plan);
  for (const key of BLOCKED_PROMPT_TERMS) {
    if (serialized.includes(`\"${key}\"`)) throw new StudioProtocolError(`Native generation plan contains forbidden field: ${key}`);
  }
  const forbiddenValues = [request.userMessage, request.createdAt, request.sessionId]
    .map((value) => value.trim().normalize("NFKC").toLocaleLowerCase())
    .filter(Boolean);
  const prompt = plan.compiledPrompt.normalize("NFKC").toLocaleLowerCase();
  for (const value of forbiddenValues) {
    if (prompt.includes(value)) throw new StudioProtocolError("Native image-generation prompt contains application-owned text.");
  }
  if (!/no photo, portrait, reproduced source image/i.test(prompt) || !/no .*words, letters, numbers/i.test(prompt)) {
    throw new StudioProtocolError("Native image-generation prompt is missing required image/text prohibitions.");
  }
  if (plan.compositionMode === "text_led" && (!plan.layout.heroLetteringReserved || !/hero-lettering corridor/i.test(prompt))) {
    throw new StudioProtocolError("TEXT-LED plan must reserve an application-owned lettering corridor.");
  }
}

export function createCompositorRenderPlan(
  request: AftermarkStudioRequest,
  analysis: NativeSourceAnalysis,
  plan: NativeGenerationPlan,
): NeonScribbleRenderPlan {
  return {
    version: "neon-scribble-v2",
    palette: {
      primary: analysis.palette.primary[0],
      secondary: analysis.palette.primary[1] ?? analysis.palette.neutral[0],
      neutral: analysis.palette.neutral[0],
      surprise: analysis.palette.surprise[0],
    },
    density: "medium",
    material: "classic",
    compositionMode: request.compositionMode,
    motifs: plan.motifs.slice(0, 4),
    userMessage: request.userMessage,
    aiPhrases: plan.marginalPhrases,
    composition: {
      centerLabelRatio: 0.3,
      preserveGrooves: true,
      maxLargeMotifs: 1,
      centerProtection: "composite-source-last",
      heroLetteringZone: {
        reserved: request.compositionMode === "text_led",
        placement: "lower-right-arc",
        applicationOwnedText: true,
      },
    },
    prompt: plan.compiledPrompt,
    negativePrompt: plan.avoid.join(", "),
  };
}

export function sourceSha256(buffer: Buffer): string {
  return createHash("sha256").update(buffer).digest("hex");
}

function parseMotif(value: unknown, index: number): NativeSourceMotif {
  const input = objectValue(value, `analysis motif ${index + 1}`);
  assertExactKeys(input, ["name", "visualShorthand", "salience"], `analysis motif ${index + 1}`);
  if (typeof input.name !== "string" || !betweenWords(input.name, 1, 3)) throw new StudioProtocolError("Motif names must contain 1–3 words.");
  if (typeof input.visualShorthand !== "string" || !betweenWords(input.visualShorthand, 2, 12)) throw new StudioProtocolError("Motif visualShorthand must contain 2–12 words.");
  if (input.salience !== "high" && input.salience !== "medium" && input.salience !== "low") throw new StudioProtocolError("Motif salience is invalid.");
  return { name: input.name.trim(), visualShorthand: input.visualShorthand.trim(), salience: input.salience };
}

function parseStringArray(value: unknown, label: string, min: number, max: number, pattern?: RegExp): string[] {
  if (!Array.isArray(value) || value.length < min || value.length > max || value.some((item) => typeof item !== "string" || !item.trim() || (pattern && !pattern.test(item)))) {
    throw new StudioProtocolError(`${label} must contain ${min}–${max} valid strings.`);
  }
  return value.map((item) => (item as string).trim());
}

function betweenWords(value: string, min: number, max: number): boolean {
  const count = value.trim().split(/\s+/).filter(Boolean).length;
  return count >= min && count <= max;
}

function objectValue(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new StudioProtocolError(`${label} must be a JSON object.`);
  return value as Record<string, unknown>;
}

function assertExactKeys(input: Record<string, unknown>, expected: string[], label: string): void {
  const actual = Object.keys(input).sort();
  const wanted = [...expected].sort();
  if (actual.join("\0") !== wanted.join("\0")) throw new StudioProtocolError(`${label} has missing or unexpected fields.`);
}
