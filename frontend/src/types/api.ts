// Frontend API type definitions

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
  passes: {
    AA: boolean;
    AAA: boolean;
  };
}

export interface AccessibilityScore {
  overallScore: 'AA' | 'AAA' | 'FAIL';
  contrastRatios: ContrastRatio[];
  colorBlindnessCompatible: boolean;
  recommendations: string[];
}

export interface ColorPalette {
  id: string;
  name: string;
  prompt: string;
  colors: ColorData[];
  accessibilityScore: AccessibilityScore;
  createdAt: Date;
  updatedAt: Date;
}

export interface GenerationOptions {
  colorCount?: number;
  harmonyType?: 'complementary' | 'triadic' | 'analogous' | 'monochromatic' | 'tetradic';
  accessibilityLevel?: 'AA' | 'AAA';
  includeNeutrals?: boolean;
}

export interface TextGenerationRequest {
  prompt: string;
  userId?: string;
  options?: GenerationOptions;
}

export interface GenerationResponse {
  id: string;
  name: string;
  prompt: string;
  colors: ColorData[];
  accessibilityScore: AccessibilityScore;
  processingTime: number;
  explanation: string;
  model: string;
  createdAt: string;
  updatedAt: string;
}

export interface APIError {
  error: string;
  code?: string;
  details?: Record<string, unknown>;
}

export interface ImageGenerationRequest {
  image: File;
  userId?: string;
  options?: GenerationOptions;
}

export interface ImageUploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface ImageValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  fileInfo?: {
    size: number;
    type: string;
    dimensions?: {
      width: number;
      height: number;
    };
  };
}

export interface APIResponse<T = any> {
  success?: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ConnectionStatus {
  isOnline: boolean;
  isLoading: boolean;
  lastCheck?: string;
}

export interface RetryConfig {
  retries: number;
  retryDelay: number;
  retryCondition: (error: any) => boolean;
}

// Extend AxiosRequestConfig to include metadata
declare module 'axios' {
  interface AxiosRequestConfig {
    metadata?: {
      startTime: number;
    };
  }
}