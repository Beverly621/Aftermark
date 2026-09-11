export type StylePack = "neon_scribble" | "analog_memory" | "dream_archive";
export type DoodleDensity = "low" | "medium" | "high";
export type RecordMaterial = "classic" | "clear" | "smoke" | "aurora" | "pearl";

export interface ImagePalette {
  primary: string;
  secondary: string;
  neutral: string;
  surprise: string;
}

export interface RecordArtDirection {
  image: string;
  stylePack: StylePack;
  doodleDensity: DoodleDensity;
  material: RecordMaterial;
  userMessage?: string;
  date: string;
  catalogNumber: string;
  recordType?: string;
  imagePalette?: ImagePalette;
}

export interface RecordRenderResult {
  artDirection: RecordArtDirection;
  recordType: string;
  catalogNumber: string;
  renderedAt: string;
  mainArtwork?: RenderedArtwork;
  renderPlan?: NeonScribbleRenderPlan;
  renderMode?: "mock" | "development" | "production";
  sourceImageSha256?: string;
}

export interface RecordRenderer {
  render(input: RecordArtDirection): Promise<RecordRenderResult>;
}

export interface RenderedArtwork {
  dataUrl: string;
  mimeType: "image/png";
  width: number;
  height: number;
}

export interface SourceImageInput {
  imageDataUrl: string;
  palette?: ImagePalette;
}

export interface SourceImageAnalysis {
  palette: ImagePalette;
  motifs: string[];
  sceneSummary?: string;
  sourceImageSha256: string;
  analysisMode: "development" | "production" | "palette-fallback";
}

export interface SourceImageAnalyzer {
  analyze(input: SourceImageInput): Promise<SourceImageAnalysis>;
}

export interface NeonScribbleRenderPlan {
  version: "neon-scribble-v1";
  palette: ImagePalette;
  density: "medium";
  material: "classic";
  motifs: string[];
  userMessage?: string;
  aiPhrases: string[];
  composition: {
    centerLabelRatio: 0.3;
    preserveGrooves: true;
    maxLargeMotifs: 1;
    centerProtection: "composite-source-last";
  };
  prompt: string;
  negativePrompt: string;
}
