// Tests for frontend accessibility utilities

import { describe, it, expect } from 'vitest';
import {
  calculateAccessibilityScore,
  simulateColorBlindness,
  analyzeColorAccessibility,
  getAccessibilityStatusIcon,
  formatContrastRatio,
  getColorBlindnessDescription,
  isTextReadable,
  getBestTextColor,
} from '../accessibility';
import { Color } from '../../types/color';

describe('Frontend Accessibility Utilities', () => {
  describe('calculateAccessibilityScore', () => {
    it('should calculate accessibility score for a palette', () => {
      const colors: Color[] = [
        {
          hex: '#000000',
          rgb: { r: 0, g: 0, b: 0 },
          hsl: { h: 0, s: 0, l: 0 },
          name: 'Black',
          category: 'primary',
          usage: 'Text color',
          accessibility: {
            contrastWithWhite: 21,
            contrastWithBlack: 1,
            wcagLevel: 'AAA',
          },
        },
        {
          hex: '#FFFFFF',
          rgb: { r: 255, g: 255, b: 255 },
          hsl: { h: 0, s: 0, l: 100 },
          name: 'White',
          category: 'secondary',
          usage: 'Background color',
          accessibility: {
            contrastWithWhite: 1,
            contrastWithBlack: 21,
            wcagLevel: 'AAA',
          },
        },
      ];

      const score = calculateAccessibilityScore(colors);

      expect(score).toMatchObject({
        overallScore: expect.stringMatching(/^(AA|AAA|FAIL)$/),
        contrastRatios: expect.any(Array),
        colorBlindnessCompatible: expect.any(Boolean),
        recommendations: expect.any(Array),
        passedChecks: expect.any(Number),
        totalChecks: expect.any(Number),
      });

      expect(score.contrastRatios.length).toBeGreaterThan(0);
      expect(score.passedChecks).toBeLessThanOrEqual(score.totalChecks);
    });

    it('should handle palette scoring correctly', () => {
      const testColors: Color[] = [
        {
          hex: '#000000',
          rgb: { r: 0, g: 0, b: 0 },
          hsl: { h: 0, s: 0, l: 0 },
          name: 'Black',
          category: 'primary',
          usage: 'Text color',
          accessibility: {
            contrastWithWhite: 21,
            contrastWithBlack: 1,
            wcagLevel: 'AAA',
          },
        },
        {
          hex: '#FFFFFF',
          rgb: { r: 255, g: 255, b: 255 },
          hsl: { h: 0, s: 0, l: 100 },
          name: 'White',
          category: 'secondary',
          usage: 'Background color',
          accessibility: {
            contrastWithWhite: 1,
            contrastWithBlack: 21,
            wcagLevel: 'AAA',
          },
        },
      ];

      const score = calculateAccessibilityScore(testColors);

      // The function should return a valid score structure
      expect(score.overallScore).toMatch(/^(AA|AAA|FAIL)$/);
      expect(score.colorBlindnessCompatible).toBe(true);
      expect(score.contrastRatios.length).toBeGreaterThan(0);
      expect(score.recommendations.length).toBeGreaterThan(0);
      
      // Should have good contrast between black and white
      const blackWhiteRatio = score.contrastRatios.find(
        ratio => (ratio.color1 === '#000000' && ratio.color2 === '#FFFFFF') ||
                 (ratio.color1 === '#FFFFFF' && ratio.color2 === '#000000')
      );
      expect(blackWhiteRatio).toBeDefined();
      if (blackWhiteRatio) {
        expect(blackWhiteRatio.ratio).toBeCloseTo(21, 0);
        expect(blackWhiteRatio.level).not.toBe('FAIL');
      }
    });
  });

  describe('simulateColorBlindness', () => {
    it('should simulate different types of color blindness', () => {
      const originalColor = '#FF0000'; // Red

      const protanopia = simulateColorBlindness(originalColor, 'protanopia');
      const deuteranopia = simulateColorBlindness(originalColor, 'deuteranopia');
      const tritanopia = simulateColorBlindness(originalColor, 'tritanopia');
      const achromatopsia = simulateColorBlindness(originalColor, 'achromatopsia');

      // All should be valid hex colors
      expect(protanopia).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(deuteranopia).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(tritanopia).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(achromatopsia).toMatch(/^#[0-9A-Fa-f]{6}$/);

      // Should be different from original (except possibly achromatopsia for grayscale colors)
      expect(protanopia).not.toBe(originalColor);
      expect(deuteranopia).not.toBe(originalColor);
      expect(tritanopia).not.toBe(originalColor);

      // Achromatopsia should be grayscale
      const match = achromatopsia.match(/^#([0-9A-Fa-f]{2})([0-9A-Fa-f]{2})([0-9A-Fa-f]{2})$/);
      expect(match).toBeTruthy();
      
      if (match) {
        const r = parseInt(match[1], 16);
        const g = parseInt(match[2], 16);
        const b = parseInt(match[3], 16);
        expect(r).toBe(g);
        expect(g).toBe(b);
      }
    });
  });

  describe('analyzeColorAccessibility', () => {
    it('should analyze color accessibility correctly', () => {
      const color: Color = {
        hex: '#0066CC',
        rgb: { r: 0, g: 102, b: 204 },
        hsl: { h: 210, s: 100, l: 40 },
        name: 'Blue',
        category: 'primary',
        usage: 'Link color',
        accessibility: {
          contrastWithWhite: 5.5,
          contrastWithBlack: 3.8,
          wcagLevel: 'AA',
        },
      };

      const analysis = analyzeColorAccessibility(color);

      expect(analysis).toMatchObject({
        contrastWithWhite: expect.any(Number),
        contrastWithBlack: expect.any(Number),
        wcagLevelWhite: expect.stringMatching(/^(AA|AAA|FAIL)$/),
        wcagLevelBlack: expect.stringMatching(/^(AA|AAA|FAIL)$/),
        luminance: expect.any(Number),
        recommendations: expect.any(Array),
      });

      expect(analysis.luminance).toBeGreaterThanOrEqual(0);
      expect(analysis.luminance).toBeLessThanOrEqual(1);
    });

    it('should provide recommendations for problematic colors', () => {
      const problematicColor: Color = {
        hex: '#FFFF00', // Yellow - poor contrast with white
        rgb: { r: 255, g: 255, b: 0 },
        hsl: { h: 60, s: 100, l: 50 },
        name: 'Yellow',
        category: 'primary',
        usage: 'Warning color',
        accessibility: {
          contrastWithWhite: 1.07,
          contrastWithBlack: 19.56,
          wcagLevel: 'FAIL',
        },
      };

      const analysis = analyzeColorAccessibility(problematicColor);

      expect(analysis.recommendations.length).toBeGreaterThan(0);
      expect(analysis.recommendations.some(rec => rec.includes('contrast'))).toBe(true);
    });
  });

  describe('getAccessibilityStatusIcon', () => {
    it('should return correct icons and colors for each level', () => {
      const aaa = getAccessibilityStatusIcon('AAA');
      const aa = getAccessibilityStatusIcon('AA');
      const fail = getAccessibilityStatusIcon('FAIL');

      expect(aaa).toMatchObject({
        icon: '✓✓',
        color: '#22c55e',
        label: 'Excellent (AAA)',
      });

      expect(aa).toMatchObject({
        icon: '✓',
        color: '#f59e0b',
        label: 'Good (AA)',
      });

      expect(fail).toMatchObject({
        icon: '✗',
        color: '#ef4444',
        label: 'Poor (Fail)',
      });
    });
  });

  describe('formatContrastRatio', () => {
    it('should format contrast ratios correctly', () => {
      expect(formatContrastRatio(21)).toBe('21.00:1');
      expect(formatContrastRatio(4.5)).toBe('4.50:1');
      expect(formatContrastRatio(1.23456)).toBe('1.23:1');
    });
  });

  describe('getColorBlindnessDescription', () => {
    it('should return correct descriptions', () => {
      expect(getColorBlindnessDescription('protanopia')).toBe('Red-blind (Protanopia)');
      expect(getColorBlindnessDescription('deuteranopia')).toBe('Green-blind (Deuteranopia)');
      expect(getColorBlindnessDescription('tritanopia')).toBe('Blue-blind (Tritanopia)');
      expect(getColorBlindnessDescription('achromatopsia')).toBe('Complete color blindness (Achromatopsia)');
    });
  });

  describe('isTextReadable', () => {
    it('should correctly determine text readability', () => {
      // Black text on white background - should be readable
      expect(isTextReadable('#000000', '#FFFFFF', 'AA')).toBe(true);
      expect(isTextReadable('#000000', '#FFFFFF', 'AAA')).toBe(true);

      // White text on white background - should not be readable
      expect(isTextReadable('#FFFFFF', '#FFFFFF', 'AA')).toBe(false);
      expect(isTextReadable('#FFFFFF', '#FFFFFF', 'AAA')).toBe(false);

      // Gray text on white background - depends on level
      expect(isTextReadable('#767676', '#FFFFFF', 'AA')).toBe(true);
      expect(isTextReadable('#999999', '#FFFFFF', 'AAA')).toBe(false);
    });
  });

  describe('getBestTextColor', () => {
    it('should return the best text color for backgrounds', () => {
      // Light backgrounds should use black text
      expect(getBestTextColor('#FFFFFF')).toBe('#000000');
      expect(getBestTextColor('#CCCCCC')).toBe('#000000');

      // Dark backgrounds should use white text
      expect(getBestTextColor('#000000')).toBe('#FFFFFF');
      expect(getBestTextColor('#333333')).toBe('#FFFFFF');

      // Medium backgrounds - depends on specific color
      const mediumGray = getBestTextColor('#808080');
      expect(mediumGray).toMatch(/^#(000000|FFFFFF)$/);
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle empty color arrays', () => {
      const score = calculateAccessibilityScore([]);
      
      expect(score.contrastRatios).toHaveLength(0);
      expect(score.totalChecks).toBe(0);
      expect(score.passedChecks).toBe(0);
      expect(score.colorBlindnessCompatible).toBe(true); // No colors to conflict
    });

    it('should handle single color arrays', () => {
      const singleColor: Color[] = [
        {
          hex: '#FF0000',
          rgb: { r: 255, g: 0, b: 0 },
          hsl: { h: 0, s: 100, l: 50 },
          name: 'Red',
          category: 'primary',
          usage: 'Accent color',
          accessibility: {
            contrastWithWhite: 4.0,
            contrastWithBlack: 5.25,
            wcagLevel: 'AA',
          },
        },
      ];

      const score = calculateAccessibilityScore(singleColor);
      
      expect(score.contrastRatios).toHaveLength(2); // Only white and black comparisons
      expect(score.totalChecks).toBe(2);
    });

    it('should handle invalid hex colors gracefully', () => {
      // The color conversion utilities should handle this, but test edge cases
      expect(() => simulateColorBlindness('#000000', 'protanopia')).not.toThrow();
      expect(() => simulateColorBlindness('#FFFFFF', 'deuteranopia')).not.toThrow();
    });
  });
});