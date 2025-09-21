// Unit tests for backend color conversion utilities

import {
  hexToRgb,
  rgbToHex,
  rgbToHsl,
  hslToRgb,
  hexToHsl,
  hslToHex,
  getRelativeLuminance,
  getContrastRatio,
  getWCAGLevel,
  isValidHexColor,
  extractDominantColors,
  generateColorHarmony,
} from '../colorConversion';

describe('Backend Color Conversion Utilities', () => {
  describe('extractDominantColors', () => {
    it('should extract dominant colors from pixel array', () => {
      const pixels = [
        { r: 255, g: 0, b: 0 },
        { r: 255, g: 0, b: 0 },
        { r: 0, g: 255, b: 0 },
        { r: 0, g: 255, b: 0 },
        { r: 0, g: 0, b: 255 },
        { r: 0, g: 0, b: 255 },
      ];
      
      const dominantColors = extractDominantColors(pixels, 3);
      expect(dominantColors).toHaveLength(3);
      expect(dominantColors.every(color => 
        typeof color.r === 'number' && 
        typeof color.g === 'number' && 
        typeof color.b === 'number'
      )).toBe(true);
    });

    it('should handle empty pixel array', () => {
      const dominantColors = extractDominantColors([], 3);
      expect(dominantColors).toHaveLength(3);
    });
  });

  describe('generateColorHarmony', () => {
    const baseColor = '#FF0000'; // Red

    it('should generate complementary colors', () => {
      const harmony = generateColorHarmony(baseColor, 'complementary');
      expect(harmony).toHaveLength(2);
      expect(harmony[0]).toBe(baseColor);
      
      // Complementary of red should be cyan-ish
      const complementary = hexToHsl(harmony[1]);
      expect(complementary.h).toBeCloseTo(180, 10);
    });

    it('should generate triadic colors', () => {
      const harmony = generateColorHarmony(baseColor, 'triadic');
      expect(harmony).toHaveLength(3);
      expect(harmony[0]).toBe(baseColor);
      
      const color2Hsl = hexToHsl(harmony[1]);
      const color3Hsl = hexToHsl(harmony[2]);
      
      expect(color2Hsl.h).toBeCloseTo(120, 10);
      expect(color3Hsl.h).toBeCloseTo(240, 10);
    });

    it('should generate analogous colors', () => {
      const harmony = generateColorHarmony(baseColor, 'analogous');
      expect(harmony).toHaveLength(3);
      expect(harmony[0]).toBe(baseColor);
      
      const color2Hsl = hexToHsl(harmony[1]);
      const color3Hsl = hexToHsl(harmony[2]);
      
      expect(color2Hsl.h).toBeCloseTo(30, 10);
      expect(color3Hsl.h).toBeCloseTo(330, 10);
    });

    it('should generate monochromatic colors', () => {
      const harmony = generateColorHarmony(baseColor, 'monochromatic');
      expect(harmony).toHaveLength(4);
      expect(harmony[0]).toBe(baseColor);
      
      // All colors should have the same hue
      const baseHsl = hexToHsl(baseColor);
      harmony.slice(1).forEach(color => {
        const colorHsl = hexToHsl(color);
        expect(colorHsl.h).toBeCloseTo(baseHsl.h, 5);
      });
    });

    it('should generate tetradic colors', () => {
      const harmony = generateColorHarmony(baseColor, 'tetradic');
      expect(harmony).toHaveLength(4);
      expect(harmony[0]).toBe(baseColor);
      
      const color2Hsl = hexToHsl(harmony[1]);
      const color3Hsl = hexToHsl(harmony[2]);
      const color4Hsl = hexToHsl(harmony[3]);
      
      expect(color2Hsl.h).toBeCloseTo(90, 10);
      expect(color3Hsl.h).toBeCloseTo(180, 10);
      expect(color4Hsl.h).toBeCloseTo(270, 10);
    });
  });

  describe('color conversion accuracy', () => {
    it('should maintain precision in conversions', () => {
      const testColors = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF'];
      
      testColors.forEach(hex => {
        const rgb = hexToRgb(hex);
        const hsl = rgbToHsl(rgb);
        const backToRgb = hslToRgb(hsl);
        const backToHex = rgbToHex(backToRgb);
        
        expect(backToHex.toLowerCase()).toBe(hex.toLowerCase());
      });
    });
  });

  describe('accessibility calculations', () => {
    it('should calculate correct contrast ratios for known color pairs', () => {
      // White on black should be 21:1
      expect(getContrastRatio('#FFFFFF', '#000000')).toBeCloseTo(21, 0);
      
      // Same colors should be 1:1
      expect(getContrastRatio('#FF0000', '#FF0000')).toBeCloseTo(1, 1);
      
      // Gray combinations
      expect(getContrastRatio('#FFFFFF', '#808080')).toBeGreaterThan(3);
    });

    it('should determine WCAG compliance correctly', () => {
      expect(getWCAGLevel(21)).toBe('AAA');
      expect(getWCAGLevel(7)).toBe('AAA');
      expect(getWCAGLevel(4.5)).toBe('AA');
      expect(getWCAGLevel(3)).toBe('FAIL');
      
      // Large text has different thresholds
      expect(getWCAGLevel(4.5, true)).toBe('AAA');
      expect(getWCAGLevel(3, true)).toBe('AA');
      expect(getWCAGLevel(2.5, true)).toBe('FAIL');
    });
  });

  describe('validation', () => {
    it('should validate hex colors correctly', () => {
      expect(isValidHexColor('#FF0000')).toBe(true);
      expect(isValidHexColor('#F00')).toBe(true);
      expect(isValidHexColor('#ff0000')).toBe(true);
      expect(isValidHexColor('#f00')).toBe(true);
      
      expect(isValidHexColor('FF0000')).toBe(false);
      expect(isValidHexColor('#GG0000')).toBe(false);
      expect(isValidHexColor('#FF00')).toBe(false);
      expect(isValidHexColor('#FF00000')).toBe(false);
      expect(isValidHexColor('')).toBe(false);
      expect(isValidHexColor('#')).toBe(false);
    });
  });
});