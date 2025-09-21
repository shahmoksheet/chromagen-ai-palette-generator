// UI-specific type definitions

import { ColorPalette, Color, ColorBlindnessType } from './color';

// Component prop types
export interface LoadingState {
  isLoading: boolean;
  message?: string;
  progress?: number;
}

export interface ErrorState {
  hasError: boolean;
  message: string;
  code?: string;
  retry?: () => void;
}

// UI State types
export interface AppState {
  currentPalette: ColorPalette | null;
  paletteHistory: ColorPalette[];
  isGenerating: boolean;
  error: ErrorState;
  user: {
    id?: string;
    sessionId: string;
  };
}

export interface PaletteDisplayOptions {
  showAccessibilityInfo: boolean;
  colorBlindnessSimulation: ColorBlindnessType | null;
  colorFormat: 'hex' | 'rgb' | 'hsl';
  showUsageRecommendations: boolean;
  showColorNames: boolean;
}

export interface InputValidation {
  isValid: boolean;
  message?: string;
  suggestions?: string[];
}

// Event handler types
export type ColorCopyHandler = (color: Color, format: 'hex' | 'rgb' | 'hsl') => void;
export type PaletteSelectHandler = (palette: ColorPalette) => void;
export type GenerationHandler = (prompt: string) => void;
export type ImageUploadHandler = (file: File) => void;

// Toast notification types
export interface ToastNotification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    handler: () => void;
  };
}

// Modal types
export interface ModalState {
  isOpen: boolean;
  type: 'export' | 'delete' | 'settings' | 'help' | null;
  data?: Record<string, unknown>;
}

// Animation types
export interface AnimationConfig {
  duration: number;
  easing: string;
  delay?: number;
}

// Responsive breakpoints
export type Breakpoint = 'sm' | 'md' | 'lg' | 'xl' | '2xl';

export interface ResponsiveConfig {
  breakpoint: Breakpoint;
  columns: number;
  spacing: string;
}