// Unit tests for color conversion utilities

import { describe, it, expect } from 'vitest';
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
  formatColorValue,
  isValidHexColor,
  generateRandomHexColor,
} from '../colorConversion';

describe('Color Conversion Utilities', () => {
  describe('hexToRgb', () => {
    it('should convert 6-digit hex to RGB', () => {
      expect(hexToRgb('#FF0000')).toEqual({ r: 255, g: 0, b: 0 });
      expect(hexToRgb('#00FF00')).toEqual({ r: 0, g: 255, b: 0 });
      expect(hexToRgb('#0000FF')).toEqual({ r: 0, g: 0, b: 255 });
      expect(hexToRgb('#FFFFFF')).toEqual({ r: 255, g: 255, b: 255 });
      expect(hexToRgb('#000000')).toEqual({ r: 0, g: 0, b: 0 });
    });

    it('should convert 3-digit hex to RGB', () => {
      expect(hexToRgb('#F00')).toEqual({ r: 255, g: 0, b: 0 });
      expect(hexToRgb('#0F0')).toEqual({ r: 0, g: 255, b: 0 });
      expect(hexToRgb('#00F')).toEqual({ r: 0, g: 0, b: 255 });
    });

    it('should handle hex without # prefix', () => {
      expect(hexToRgb('FF0000')).toEqual({ r: 255, g: 0, b: 0 });
      expect(hexToRgb('F00')).toEqual({ r: 255, g: 0, b: 0 });
    });
  });

  describe('rgbToHex', () => {
    it('should convert RGB to hex', () => {
      expect(rgbToHex({ r: 255, g: 0, b: 0 })).toBe('#ff0000');
      expect(rgbToHex({ r: 0, g: 255, b: 0 })).toBe('#00ff00');
      expect(rgbToHex({ r: 0, g: 0, b: 255 })).toBe('#0000ff');
      expect(rgbToHex({ r: 255, g: 255, b: 255 })).toBe('#ffffff');
      expect(rgbToHex({ r: 0, g: 0, b: 0 })).toBe('#000000');
    });

    it('should handle edge cases', () => {
      expect(rgbToHex({ r: -10, g: 0, b: 0 })).toBe('#000000');
      expect(rgbToHex({ r: 300, g: 0, b: 0 })).toBe('#ff0000');
    });
  });

  describe('rgbToHsl', () => {
    it('should convert RGB to HSL', () => {
      expect(rgbToHsl({ r: 255, g: 0, b: 0 })).toEqual({ h: 0, s: 100, l: 50 });
      expect(rgbToHsl({ r: 0, g: 255, b: 0 })).toEqual({ h: 120, s: 100, l: 50 });
      expect(rgbToHsl({ r: 0, g: 0, b: 255 })).toEqual({ h: 240, s: 100, l: 50 });
      expect(rgbToHsl({ r: 255, g: 255, b: 255 })).toEqual({ h: 0, s: 0, l: 100 });
      expect(rgbToHsl({ r: 0, g: 0, b: 0 })).toEqual({ h: 0, s: 0, l: 0 });
    });
  });

  describe('hslToRgb', () => {
    it('should convert HSL to RGB', () => {
      expect(hslToRgb({ h: 0, s: 100, l: 50 })).toEqual({ r: 255, g: 0, b: 0 });
      expect(hslToRgb({ h: 120, s: 100, l: 50 })).toEqual({ r: 0, g: 255, b: 0 });
      expect(hslToRgb({ h: 240, s: 100, l: 50 })).toEqual({ r: 0, g: 0, b: 255 });
      expect(hslToRgb({ h: 0, s: 0, l: 100 })).toEqual({ r: 255, g: 255, b: 255 });
      expect(hslToRgb({ h: 0, s: 0, l: 0 })).toEqual({ r: 0, g: 0, b: 0 });
    });
  });

  describe('getRelativeLuminance', () => {
    it('should calculate relative luminance correctly', () => {
      expect(getRelativeLuminance({ r: 255, g: 255, b: 255 })).toBeCloseTo(1, 2);
      expect(getRelativeLuminance({ r: 0, g: 0, b: 0 })).toBeCloseTo(0, 2);
      expect(getRelativeLuminance({ r: 255, g: 0, b: 0 })).toBeCloseTo(0.2126, 2);
    });
  });

  describe('getContrastRatio', () => {
    it('should calculate contrast ratio correctly', () => {
      expect(getContrastRatio('#FFFFFF', '#000000')).toBeCloseTo(21, 0);
      expect(getContrastRatio('#FFFFFF', '#FFFFFF')).toBeCloseTo(1, 0);
      expect(getContrastRatio('#000000', '#000000')).toBeCloseTo(1, 0);
    });

    it('should handle order independence', () => {
      const ratio1 = getContrastRatio('#FFFFFF', '#808080');
      const ratio2 = getContrastRatio('#808080', '#FFFFFF');
      expect(ratio1).toBeCloseTo(ratio2, 2);
    });
  });

  describe('getWCAGLevel', () => {
    it('should determine WCAG levels correctly', () => {
      expect(getWCAGLevel(7.5)).toBe('AAA');
      expect(getWCAGLevel(4.5)).toBe('AA');
      expect(getWCAGLevel(3.0)).toBe('FAIL');
    });

    it('should handle large text thresholds', () => {
      expect(getWCAGLevel(4.5, true)).toBe('AAA');
      expect(getWCAGLevel(3.0, true)).toBe('AA');
      expect(getWCAGLevel(2.5, true)).toBe('FAIL');
    });
  });

  describe('formatColorValue', () => {
    it('should format hex colors', () => {
      expect(formatColorValue('#ff0000', 'hex')).toBe('#FF0000');
      expect(formatColorValue('#ff0000', 'rgb')).toBe('rgb(255, 0, 0)');
      expect(formatColorValue('#ff0000', 'hsl')).toBe('hsl(0, 100%, 50%)');
    });

    it('should format RGB colors', () => {
      const rgb = { r: 255, g: 0, b: 0 };
      expect(formatColorValue(rgb, 'hex')).toBe('#ff0000');
      expect(formatColorValue(rgb, 'rgb')).toBe('rgb(255, 0, 0)');
      expect(formatColorValue(rgb, 'hsl')).toBe('hsl(0, 100%, 50%)');
    });

    it('should format HSL colors', () => {
      const hsl = { h: 0, s: 100, l: 50 };
      expect(formatColorValue(hsl, 'hex')).toBe('#ff0000');
      expect(formatColorValue(hsl, 'rgb')).toBe('rgb(255, 0, 0)');
      expect(formatColorValue(hsl, 'hsl')).toBe('hsl(0, 100%, 50%)');
    });
  });

  describe('isValidHexColor', () => {
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
    });
  });

  describe('generateRandomHexColor', () => {
    it('should generate valid hex colors', () => {
      for (let i = 0; i < 10; i++) {
        const color = generateRandomHexColor();
        expect(isValidHexColor(color)).toBe(true);
        expect(color).toMatch(/^#[A-F0-9]{6}$/);
      }
    });
  });

  describe('round-trip conversions', () => {
    it('should maintain color integrity through conversions', () => {
      const originalHex = '#FF5733';
      const rgb = hexToRgb(originalHex);
      const backToHex = rgbToHex(rgb);
      expect(backToHex.toLowerCase()).toBe(originalHex.toLowerCase());
    });

    it('should maintain HSL integrity through conversions', () => {
      const originalHsl = { h: 180, s: 50, l: 75 };
      const rgb = hslToRgb(originalHsl);
      const backToHsl = rgbToHsl(rgb);
      
      // Allow for small rounding differences
      expect(Math.abs(backToHsl.h - originalHsl.h)).toBeLessThan(2);
      expect(Math.abs(backToHsl.s - originalHsl.s)).toBeLessThan(2);
      expect(Math.abs(backToHsl.l - originalHsl.l)).toBeLessThan(2);
    });
  });
});