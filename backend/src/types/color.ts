// Backend color type definitions

export interface RGB {
  r: number;
  g: number;
  b: number;
}

export interface HSL {
  h: number;
  s: number;
  l: number;
}

export interface ColorData {
  hex: string;
  rgb: RGB;
  hsl: HSL;
  name: string;
  category: 'primary' | 'secondary' | 'accent' | 'neutral';
  usage: string;
  accessibility: {
    contrastWithWhite: number;
    contrastWithBlack: number;
    wcagLevel: 'AA' | 'AAA' | 'FAIL';
  };
}

export interface ContrastRatio {
  color1: string;
  color2: string;
  ratio: number;
  level: 'AA' | 'AAA' | 'FAIL';
  isTextReadable: boolean;
}

export interface AccessibilityScore {
  overallScore: 'AA' | 'AAA' | 'FAIL';
  contrastRatios: ContrastRatio[];
  colorBlindnessCompatible: boolean;
  recommendations: string[];
  passedChecks: number;
  totalChecks: number;
}

export interface ColorPaletteData {
  id?: string;
  name: string;
  prompt?: string;
  colors: ColorData[];
  accessibilityScore: AccessibilityScore;
  userId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface GenerationOptions {
  colorCount: number;
  harmonyType: 'complementary' | 'triadic' | 'analogous' | 'monochromatic' | 'tetradic';
  accessibilityLevel: 'AA' | 'AAA';
  includeNeutrals: boolean;
}

export type ColorBlindnessType = 'protanopia' | 'deuteranopia' | 'tritanopia' | 'achromatopsia';

export type ExportFormat = 'css' | 'scss' | 'json' | 'ase' | 'sketch' | 'figma' | 'tailwind';

export interface ExportData {
  format: ExportFormat;
  content: string;
  filename: string;
  mimeType: string;
}

// Color harmony definitions
export interface ColorHarmonyRule {
  type: GenerationOptions['harmonyType'];
  angles: number[];
  description: string;
  minColors: number;
  maxColors: number;
}

// AI generation context
export interface GenerationContext {
  prompt: string;
  dominantColors?: ColorData[];
  mood?: string;
  industry?: string;
  targetAudience?: string;
  brandPersonality?: string[];
}

export interface AIGenerationResult {
  colors: ColorData[];
  explanation: string;
  confidence: number;
  processingTime: number;
  model: string;
}