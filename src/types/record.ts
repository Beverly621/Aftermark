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
}

export interface RecordRenderer {
  render(input: RecordArtDirection): Promise<RecordRenderResult>;
}
