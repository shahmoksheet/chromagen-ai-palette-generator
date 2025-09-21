// Frontend accessibility utilities

import { 
  Color, 
  AccessibilityScore, 
  ContrastRatio, 
  ColorBlindnessType 
} from '../types/color';
import { 
  hexToRgb, 
  getRelativeLuminance, 
  getContrastRatio, 
  getWCAGLevel 
} from './colorConversion';

/**
 * Calculate accessibility score for a color palette (frontend version)
 */
export function calculateAccessibilityScore(colors: Color[]): AccessibilityScore {
  const contrastRatios = calculateAllContrastRatios(colors);
  const colorBlindnessCompatible = checkColorBlindnessCompatibility(colors);
  const recommendations = generateAccessibilityRecommendations(colors, contrastRatios);
  
  // Calculate overall score based on worst performing contrast ratio
  const worstLevel = getWorstWCAGLevel(contrastRatios);
  const passedChecks = contrastRatios.filter(ratio => ratio.level !== 'FAIL').length;
  const totalChecks = contrastRatios.length;
  
  return {
    overallScore: worstLevel,
    contrastRatios,
    colorBlindnessCompatible,
    recommendations,
    passedChecks,
    totalChecks,
  };
}

/**
 * Calculate contrast ratios between all color combinations
 */
function calculateAllContrastRatios(colors: Color[]): ContrastRatio[] {
  const ratios: ContrastRatio[] = [];
  
  // Test each color against white and black backgrounds
  colors.forEach(color => {
    const whiteRatio = getContrastRatio(color.hex, '#FFFFFF');
    const blackRatio = getContrastRatio(color.hex, '#000000');
    
    ratios.push({
      color1: color.hex,
      color2: '#FFFFFF',
      ratio: whiteRatio,
      level: getWCAGLevel(whiteRatio),
      isTextReadable: whiteRatio >= 4.5,
    });
    
    ratios.push({
      color1: color.hex,
      color2: '#000000',
      ratio: blackRatio,
      level: getWCAGLevel(blackRatio),
      isTextReadable: blackRatio >= 4.5,
    });
  });
  
  // Test color combinations within the palette
  for (let i = 0; i < colors.length; i++) {
    for (let j = i + 1; j < colors.length; j++) {
      const ratio = getContrastRatio(colors[i].hex, colors[j].hex);
      ratios.push({
        color1: colors[i].hex,
        color2: colors[j].hex,
        ratio,
        level: getWCAGLevel(ratio),
        isTextReadable: ratio >= 4.5,
      });
    }
  }
  
  return ratios;
}

/**
 * Check if the palette is compatible with color blindness
 */
function checkColorBlindnessCompatibility(colors: Color[]): boolean {
  const colorBlindnessTypes: ColorBlindnessType[] = ['protanopia', 'deuteranopia', 'tritanopia'];
  
  for (const type of colorBlindnessTypes) {
    const simulatedColors = colors.map(color => simulateColorBlindness(color.hex, type));
    
    // Check if any colors become too similar after simulation
    for (let i = 0; i < simulatedColors.length; i++) {
      for (let j = i + 1; j < simulatedColors.length; j++) {
        const distance = calculateColorDistance(simulatedColors[i], simulatedColors[j]);
        
        // If colors are too similar (distance < threshold), palette is not compatible
        if (distance < 30) {
          return false;
        }
      }
    }
  }
  
  return true;
}

/**
 * Simulate color blindness for a given color
 */
export function simulateColorBlindness(hex: string, type: ColorBlindnessType): string {
  const rgb = hexToRgb(hex);
  let r = rgb.r / 255;
  let g = rgb.g / 255;
  let b = rgb.b / 255;
  
  // Apply color blindness transformation matrices
  switch (type) {
    case 'protanopia': // Red-blind
      r = 0.567 * r + 0.433 * g;
      g = 0.558 * r + 0.442 * g;
      b = 0.242 * g + 0.758 * b;
      break;
      
    case 'deuteranopia': // Green-blind
      r = 0.625 * r + 0.375 * g;
      g = 0.7 * r + 0.3 * g;
      b = 0.3 * g + 0.7 * b;
      break;
      
    case 'tritanopia': // Blue-blind
      r = 0.95 * r + 0.05 * g;
      g = 0.433 * g + 0.567 * b;
      b = 0.475 * g + 0.525 * b;
      break;
      
    case 'achromatopsia': // Complete color blindness (grayscale)
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;
      r = g = b = gray;
      break;
  }
  
  // Convert back to hex
  const newRgb = {
    r: Math.round(Math.max(0, Math.min(255, r * 255))),
    g: Math.round(Math.max(0, Math.min(255, g * 255))),
    b: Math.round(Math.max(0, Math.min(255, b * 255))),
  };
  
  return `#${newRgb.r.toString(16).padStart(2, '0')}${newRgb.g.toString(16).padStart(2, '0')}${newRgb.b.toString(16).padStart(2, '0')}`;
}

/**
 * Calculate color distance in RGB space
 */
function calculateColorDistance(hex1: string, hex2: string): number {
  const rgb1 = hexToRgb(hex1);
  const rgb2 = hexToRgb(hex2);
  
  return Math.sqrt(
    Math.pow(rgb1.r - rgb2.r, 2) +
    Math.pow(rgb1.g - rgb2.g, 2) +
    Math.pow(rgb1.b - rgb2.b, 2)
  );
}

/**
 * Get the worst WCAG level from contrast ratios
 */
function getWorstWCAGLevel(contrastRatios: ContrastRatio[]): 'AA' | 'AAA' | 'FAIL' {
  const levels = contrastRatios.map(ratio => ratio.level);
  
  if (levels.includes('FAIL')) return 'FAIL';
  if (levels.includes('AA') && !levels.includes('AAA')) return 'AA';
  return 'AAA';
}

/**
 * Generate accessibility recommendations
 */
function generateAccessibilityRecommendations(
  colors: Color[], 
  contrastRatios: ContrastRatio[]
): string[] {
  const recommendations: string[] = [];
  
  // Check for low contrast issues
  const failedRatios = contrastRatios.filter(ratio => ratio.level === 'FAIL');
  if (failedRatios.length > 0) {
    recommendations.push(
      `${failedRatios.length} color combinations have insufficient contrast. Consider adjusting lightness values.`
    );
  }
  
  // Check for AA vs AAA compliance
  const aaRatios = contrastRatios.filter(ratio => ratio.level === 'AA');
  if (aaRatios.length > 0) {
    recommendations.push(
      `${aaRatios.length} combinations meet AA standards but could be improved for AAA compliance.`
    );
  }
  
  // Check color blindness compatibility
  if (!checkColorBlindnessCompatibility(colors)) {
    recommendations.push(
      'Some colors may be difficult to distinguish for users with color blindness. Consider increasing color differences.'
    );
  }
  
  // Check for sufficient color variety
  if (colors.length < 3) {
    recommendations.push(
      'Consider adding more colors to provide sufficient design flexibility while maintaining accessibility.'
    );
  }
  
  // Check for overly bright or dark colors
  const brightColors = colors.filter(color => {
    const rgb = hexToRgb(color.hex);
    const luminance = getRelativeLuminance(rgb);
    return luminance > 0.9;
  });
  
  const darkColors = colors.filter(color => {
    const rgb = hexToRgb(color.hex);
    const luminance = getRelativeLuminance(rgb);
    return luminance < 0.1;
  });
  
  if (brightColors.length > colors.length * 0.6) {
    recommendations.push(
      'Palette contains many very bright colors. Consider adding some darker colors for better contrast options.'
    );
  }
  
  if (darkColors.length > colors.length * 0.6) {
    recommendations.push(
      'Palette contains many very dark colors. Consider adding some lighter colors for better contrast options.'
    );
  }
  
  // If no issues found, provide positive feedback
  if (recommendations.length === 0) {
    recommendations.push(
      'Excellent! This palette meets high accessibility standards and should work well for all users.'
    );
  }
  
  return recommendations;
}

/**
 * Get detailed accessibility analysis for a specific color
 */
export function analyzeColorAccessibility(color: Color): {
  contrastWithWhite: number;
  contrastWithBlack: number;
  wcagLevelWhite: 'AA' | 'AAA' | 'FAIL';
  wcagLevelBlack: 'AA' | 'AAA' | 'FAIL';
  luminance: number;
  recommendations: string[];
} {
  const rgb = hexToRgb(color.hex);
  const luminance = getRelativeLuminance(rgb);
  const contrastWithWhite = getContrastRatio(color.hex, '#FFFFFF');
  const contrastWithBlack = getContrastRatio(color.hex, '#000000');
  
  const wcagLevelWhite = getWCAGLevel(contrastWithWhite);
  const wcagLevelBlack = getWCAGLevel(contrastWithBlack);
  
  const recommendations: string[] = [];
  
  if (wcagLevelWhite === 'FAIL' && wcagLevelBlack === 'FAIL') {
    recommendations.push('This color has poor contrast with both white and black. Consider adjusting its lightness.');
  } else if (wcagLevelWhite === 'FAIL') {
    recommendations.push('This color has poor contrast with white backgrounds. Use with dark backgrounds instead.');
  } else if (wcagLevelBlack === 'FAIL') {
    recommendations.push('This color has poor contrast with black backgrounds. Use with light backgrounds instead.');
  }
  
  if (luminance > 0.9) {
    recommendations.push('This is a very bright color. Ensure sufficient contrast when used with text.');
  } else if (luminance < 0.1) {
    recommendations.push('This is a very dark color. Ensure sufficient contrast when used with text.');
  }
  
  return {
    contrastWithWhite,
    contrastWithBlack,
    wcagLevelWhite,
    wcagLevelBlack,
    luminance,
    recommendations,
  };
}

/**
 * Get accessibility status icon and color
 */
export function getAccessibilityStatusIcon(level: 'AA' | 'AAA' | 'FAIL'): {
  icon: string;
  color: string;
  label: string;
} {
  switch (level) {
    case 'AAA':
      return {
        icon: '✓✓',
        color: '#22c55e', // Green
        label: 'Excellent (AAA)',
      };
    case 'AA':
      return {
        icon: '✓',
        color: '#f59e0b', // Amber
        label: 'Good (AA)',
      };
    case 'FAIL':
      return {
        icon: '✗',
        color: '#ef4444', // Red
        label: 'Poor (Fail)',
      };
  }
}

/**
 * Format contrast ratio for display
 */
export function formatContrastRatio(ratio: number): string {
  return `${ratio.toFixed(2)}:1`;
}

/**
 * Get readable description of color blindness type
 */
export function getColorBlindnessDescription(type: ColorBlindnessType): string {
  switch (type) {
    case 'protanopia':
      return 'Red-blind (Protanopia)';
    case 'deuteranopia':
      return 'Green-blind (Deuteranopia)';
    case 'tritanopia':
      return 'Blue-blind (Tritanopia)';
    case 'achromatopsia':
      return 'Complete color blindness (Achromatopsia)';
  }
}

/**
 * Check if a color is suitable for text on a given background
 */
export function isTextReadable(textColor: string, backgroundColor: string, level: 'AA' | 'AAA' = 'AA'): boolean {
  const ratio = getContrastRatio(textColor, backgroundColor);
  const threshold = level === 'AAA' ? 7 : 4.5;
  return ratio >= threshold;
}

/**
 * Get the best text color (black or white) for a given background
 */
export function getBestTextColor(backgroundColor: string): string {
  const whiteRatio = getContrastRatio('#FFFFFF', backgroundColor);
  const blackRatio = getContrastRatio('#000000', backgroundColor);
  
  return whiteRatio > blackRatio ? '#FFFFFF' : '#000000';
}