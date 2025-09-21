// Color conversion utilities for backend

import { RGB, HSL } from '../types/color';

/**
 * Convert HEX color to RGB
 */
export function hexToRgb(hex: string): RGB {
  const cleanHex = hex.replace('#', '');
  const fullHex = cleanHex.length === 3 
    ? cleanHex.split('').map(char => char + char).join('')
    : cleanHex;
  
  const r = parseInt(fullHex.substring(0, 2), 16);
  const g = parseInt(fullHex.substring(2, 4), 16);
  const b = parseInt(fullHex.substring(4, 6), 16);
  
  return { r, g, b };
}

/**
 * Convert RGB color to HEX
 */
export function rgbToHex(rgb: RGB): string {
  const toHex = (n: number) => {
    const hex = Math.round(Math.max(0, Math.min(255, n))).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  
  return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`;
}

/**
 * Convert RGB color to HSL
 */
export function rgbToHsl(rgb: RGB): HSL {
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const diff = max - min;
  
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  
  if (diff !== 0) {
    s = l > 0.5 ? diff / (2 - max - min) : diff / (max + min);
    
    switch (max) {
      case r:
        h = ((g - b) / diff + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / diff + 2) / 6;
        break;
      case b:
        h = ((r - g) / diff + 4) / 6;
        break;
    }
  }
  
  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

/**
 * Convert HSL color to RGB
 */
export function hslToRgb(hsl: HSL): RGB {
  const h = hsl.h / 360;
  const s = hsl.s / 100;
  const l = hsl.l / 100;
  
  if (s === 0) {
    const gray = Math.round(l * 255);
    return { r: gray, g: gray, b: gray };
  }
  
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1/6) return p + (q - p) * 6 * t;
    if (t < 1/2) return q;
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
  };
  
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  
  const r = hue2rgb(p, q, h + 1/3);
  const g = hue2rgb(p, q, h);
  const b = hue2rgb(p, q, h - 1/3);
  
  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  };
}

/**
 * Convert HEX color to HSL
 */
export function hexToHsl(hex: string): HSL {
  const rgb = hexToRgb(hex);
  return rgbToHsl(rgb);
}

/**
 * Convert HSL color to HEX
 */
export function hslToHex(hsl: HSL): string {
  const rgb = hslToRgb(hsl);
  return rgbToHex(rgb);
}

/**
 * Calculate relative luminance of a color (for contrast calculations)
 */
export function getRelativeLuminance(rgb: RGB): number {
  const rsRGB = rgb.r / 255;
  const gsRGB = rgb.g / 255;
  const bsRGB = rgb.b / 255;
  
  const r = rsRGB <= 0.03928 ? rsRGB / 12.92 : Math.pow((rsRGB + 0.055) / 1.055, 2.4);
  const g = gsRGB <= 0.03928 ? gsRGB / 12.92 : Math.pow((gsRGB + 0.055) / 1.055, 2.4);
  const b = bsRGB <= 0.03928 ? bsRGB / 12.92 : Math.pow((bsRGB + 0.055) / 1.055, 2.4);
  
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Calculate contrast ratio between two colors
 */
export function getContrastRatio(color1: string, color2: string): number {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);
  
  const lum1 = getRelativeLuminance(rgb1);
  const lum2 = getRelativeLuminance(rgb2);
  
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Determine WCAG compliance level for contrast ratio
 */
export function getWCAGLevel(contrastRatio: number, isLargeText: boolean = false): 'AA' | 'AAA' | 'FAIL' {
  const aaThreshold = isLargeText ? 3 : 4.5;
  const aaaThreshold = isLargeText ? 4.5 : 7;
  
  if (contrastRatio >= aaaThreshold) return 'AAA';
  if (contrastRatio >= aaThreshold) return 'AA';
  return 'FAIL';
}

/**
 * Validate hex color format
 */
export function isValidHexColor(hex: string): boolean {
  const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
  return hexRegex.test(hex);
}

/**
 * Extract dominant colors from RGB array (for image processing)
 */
export function extractDominantColors(pixels: RGB[], count: number = 5): RGB[] {
  // Simple k-means clustering for color extraction
  const maxIterations = 10;
  let centroids: RGB[] = [];
  
  // Initialize centroids randomly
  for (let i = 0; i < count; i++) {
    const randomPixel = pixels[Math.floor(Math.random() * pixels.length)];
    centroids.push({ ...randomPixel });
  }
  
  for (let iteration = 0; iteration < maxIterations; iteration++) {
    const clusters: RGB[][] = Array(count).fill(null).map(() => []);
    
    // Assign pixels to nearest centroid
    pixels.forEach(pixel => {
      let minDistance = Infinity;
      let closestCentroid = 0;
      
      centroids.forEach((centroid, index) => {
        const distance = Math.sqrt(
          Math.pow(pixel.r - centroid.r, 2) +
          Math.pow(pixel.g - centroid.g, 2) +
          Math.pow(pixel.b - centroid.b, 2)
        );
        
        if (distance < minDistance) {
          minDistance = distance;
          closestCentroid = index;
        }
      });
      
      clusters[closestCentroid].push(pixel);
    });
    
    // Update centroids
    centroids = clusters.map(cluster => {
      if (cluster.length === 0) return centroids[0]; // Fallback
      
      const sum = cluster.reduce(
        (acc, pixel) => ({
          r: acc.r + pixel.r,
          g: acc.g + pixel.g,
          b: acc.b + pixel.b,
        }),
        { r: 0, g: 0, b: 0 }
      );
      
      return {
        r: Math.round(sum.r / cluster.length),
        g: Math.round(sum.g / cluster.length),
        b: Math.round(sum.b / cluster.length),
      };
    });
  }
  
  return centroids;
}

/**
 * Generate color harmony based on base color and harmony type
 */
export function generateColorHarmony(
  baseColor: string,
  harmonyType: 'complementary' | 'triadic' | 'analogous' | 'monochromatic' | 'tetradic'
): string[] {
  const hsl = hexToHsl(baseColor);
  const colors: string[] = [baseColor];
  
  switch (harmonyType) {
    case 'complementary':
      colors.push(hslToHex({ ...hsl, h: (hsl.h + 180) % 360 }));
      break;
      
    case 'triadic':
      colors.push(hslToHex({ ...hsl, h: (hsl.h + 120) % 360 }));
      colors.push(hslToHex({ ...hsl, h: (hsl.h + 240) % 360 }));
      break;
      
    case 'analogous':
      colors.push(hslToHex({ ...hsl, h: (hsl.h + 30) % 360 }));
      colors.push(hslToHex({ ...hsl, h: (hsl.h - 30 + 360) % 360 }));
      break;
      
    case 'monochromatic':
      colors.push(hslToHex({ ...hsl, l: Math.max(10, hsl.l - 20) }));
      colors.push(hslToHex({ ...hsl, l: Math.min(90, hsl.l + 20) }));
      colors.push(hslToHex({ ...hsl, s: Math.max(10, hsl.s - 30) }));
      break;
      
    case 'tetradic':
      colors.push(hslToHex({ ...hsl, h: (hsl.h + 90) % 360 }));
      colors.push(hslToHex({ ...hsl, h: (hsl.h + 180) % 360 }));
      colors.push(hslToHex({ ...hsl, h: (hsl.h + 270) % 360 }));
      break;
  }
  
  return colors;
}