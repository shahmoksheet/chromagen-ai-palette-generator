// Core color type definitions for ChromaGen frontend

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

export interface Color {
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

export interface ColorPalette {
  id: string;
  name: string;
  prompt?: string;
  colors: Color[];
  accessibilityScore: AccessibilityScore;
  createdAt: Date;
  updatedAt: Date;
  userId?: string;
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

export interface ColorHarmony {
  type: GenerationOptions['harmonyType'];
  description: string;
  colors: Color[];
  explanation: string;
}