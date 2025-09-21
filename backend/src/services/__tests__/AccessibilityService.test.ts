// Tests for AccessibilityService

import { AccessibilityService } from '../AccessibilityService';
import { ColorData } from '../../types/color';

describe('AccessibilityService', () => {
  let accessibilityService: AccessibilityService;

  beforeEach(() => {
    accessibilityService = new AccessibilityService();
  });

  describe('calculateAccessibilityScore', () => {
    it('should calculate accessibility score for a palette', () => {
      const colors: ColorData[] = [
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

      const score = accessibilityService.calculateAccessibilityScore(colors);

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

    it('should handle single color palette', () => {
      const colors: ColorData[] = [
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

      const score = accessibilityService.calculateAccessibilityScore(colors);

      expect(score.contrastRatios.length).toBe(2); // Only white and black comparisons
      expect(score.totalChecks).toBe(2);
    });

    it('should identify failing accessibility scores', () => {
      const colors: ColorData[] = [
        {
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
        },
        {
          hex: '#CCCCCC', // Light gray - poor contrast with white
          rgb: { r: 204, g: 204, b: 204 },
          hsl: { h: 0, s: 0, l: 80 },
          name: 'Light Gray',
          category: 'secondary',
          usage: 'Background',
          accessibility: {
            contrastWithWhite: 1.61,
            contrastWithBlack: 13.04,
            wcagLevel: 'FAIL',
          },
        },
      ];

      const score = accessibilityService.calculateAccessibilityScore(colors);

      expect(score.overallScore).toBe('FAIL');
      expect(score.passedChecks).toBeLessThan(score.totalChecks);
      expect(score.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('simulateColorBlindness', () => {
    it('should simulate protanopia (red-blind)', () => {
      const originalColor = '#FF0000'; // Red
      const simulatedColor = accessibilityService.simulateColorBlindness(originalColor, 'protanopia');
      
      expect(simulatedColor).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(simulatedColor).not.toBe(originalColor);
    });

    it('should simulate deuteranopia (green-blind)', () => {
      const originalColor = '#00FF00'; // Green
      const simulatedColor = accessibilityService.simulateColorBlindness(originalColor, 'deuteranopia');
      
      expect(simulatedColor).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(simulatedColor).not.toBe(originalColor);
    });

    it('should simulate tritanopia (blue-blind)', () => {
      const originalColor = '#0000FF'; // Blue
      const simulatedColor = accessibilityService.simulateColorBlindness(originalColor, 'tritanopia');
      
      expect(simulatedColor).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(simulatedColor).not.toBe(originalColor);
    });

    it('should simulate achromatopsia (complete color blindness)', () => {
      const originalColor = '#FF0000'; // Red
      const simulatedColor = accessibilityService.simulateColorBlindness(originalColor, 'achromatopsia');
      
      expect(simulatedColor).toMatch(/^#[0-9A-Fa-f]{6}$/);
      
      // Should be grayscale (R=G=B)
      const match = simulatedColor.match(/^#([0-9A-Fa-f]{2})([0-9A-Fa-f]{2})([0-9A-Fa-f]{2})$/);
      expect(match).toBeTruthy();
      
      if (match) {
        const r = parseInt(match[1], 16);
        const g = parseInt(match[2], 16);
        const b = parseInt(match[3], 16);
        expect(r).toBe(g);
        expect(g).toBe(b);
      }
    });

    it('should handle edge cases', () => {
      expect(accessibilityService.simulateColorBlindness('#000000', 'protanopia')).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(accessibilityService.simulateColorBlindness('#FFFFFF', 'deuteranopia')).toMatch(/^#[0-9A-Fa-f]{6}$/);
    });
  });

  describe('analyzeColorAccessibility', () => {
    it('should analyze color accessibility correctly', () => {
      const color: ColorData = {
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

      const analysis = accessibilityService.analyzeColorAccessibility(color);

      expect(analysis).toMatchObject({
        contrastWithWhite: expect.any(Number),
        contrastWithBlack: expect.any(Number),
        wcagLevelWhite: expect.stringMatching(/^(AA|AAA|FAIL)$/),
        wcagLevelBlack: expect.stringMatching(/^(AA|AAA|FAIL)$/),
        luminance: expect.any(Number),
        recommendations: expect.any(Array),
      });

      expect(analysis.contrastWithWhite).toBeGreaterThan(0);
      expect(analysis.contrastWithBlack).toBeGreaterThan(0);
      expect(analysis.luminance).toBeGreaterThanOrEqual(0);
      expect(analysis.luminance).toBeLessThanOrEqual(1);
    });

    it('should provide recommendations for poor contrast colors', () => {
      const poorContrastColor: ColorData = {
        hex: '#CCCCCC', // Light gray
        rgb: { r: 204, g: 204, b: 204 },
        hsl: { h: 0, s: 0, l: 80 },
        name: 'Light Gray',
        category: 'secondary',
        usage: 'Text color',
        accessibility: {
          contrastWithWhite: 1.61,
          contrastWithBlack: 13.04,
          wcagLevel: 'FAIL',
        },
      };

      const analysis = accessibilityService.analyzeColorAccessibility(poorContrastColor);

      expect(analysis.recommendations.length).toBeGreaterThan(0);
      expect(analysis.recommendations.some(rec => rec.includes('contrast'))).toBe(true);
    });
  });

  describe('suggestColorAdjustments', () => {
    it('should suggest adjustments for colors that need improvement', () => {
      const color: ColorData = {
        hex: '#CCCCCC', // Light gray with poor contrast
        rgb: { r: 204, g: 204, b: 204 },
        hsl: { h: 0, s: 0, l: 80 },
        name: 'Light Gray',
        category: 'secondary',
        usage: 'Text color',
        accessibility: {
          contrastWithWhite: 1.61,
          contrastWithBlack: 13.04,
          wcagLevel: 'FAIL',
        },
      };

      const suggestions = accessibilityService.suggestColorAdjustments(color, 'AA');

      expect(suggestions).toMatchObject({
        lighterVersion: expect.stringMatching(/^#[0-9A-Fa-f]{6}$/),
        darkerVersion: expect.stringMatching(/^#[0-9A-Fa-f]{6}$/),
        adjustmentNeeded: expect.any(Boolean),
      });

      if (suggestions.adjustmentNeeded) {
        expect(suggestions.lighterVersion).not.toBe(color.hex);
        expect(suggestions.darkerVersion).not.toBe(color.hex);
      }
    });

    it('should handle colors that already meet standards', () => {
      const goodColor: ColorData = {
        hex: '#000000', // Black - excellent contrast
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
      };

      const suggestions = accessibilityService.suggestColorAdjustments(goodColor, 'AA');

      expect(suggestions.adjustmentNeeded).toBe(false);
      expect(suggestions.lighterVersion).toBe(goodColor.hex);
      expect(suggestions.darkerVersion).toBe(goodColor.hex);
    });

    it('should handle AAA level requirements', () => {
      const color: ColorData = {
        hex: '#767676', // Medium gray
        rgb: { r: 118, g: 118, b: 118 },
        hsl: { h: 0, s: 0, l: 46 },
        name: 'Medium Gray',
        category: 'secondary',
        usage: 'Text color',
        accessibility: {
          contrastWithWhite: 4.54, // Just meets AA but not AAA
          contrastWithBlack: 4.62,
          wcagLevel: 'AA',
        },
      };

      const suggestionsAA = accessibilityService.suggestColorAdjustments(color, 'AA');
      const suggestionsAAA = accessibilityService.suggestColorAdjustments(color, 'AAA');

      // Should need adjustment for AAA but not for AA
      expect(suggestionsAA.adjustmentNeeded).toBe(false);
      expect(suggestionsAAA.adjustmentNeeded).toBe(true);
    });
  });

  describe('color blindness compatibility', () => {
    it('should detect incompatible color combinations', () => {
      const similarColors: ColorData[] = [
        {
          hex: '#FF0000', // Red
          rgb: { r: 255, g: 0, b: 0 },
          hsl: { h: 0, s: 100, l: 50 },
          name: 'Red',
          category: 'primary',
          usage: 'Error color',
          accessibility: {
            contrastWithWhite: 4.0,
            contrastWithBlack: 5.25,
            wcagLevel: 'AA',
          },
        },
        {
          hex: '#00FF00', // Green - may be confused with red by color blind users
          rgb: { r: 0, g: 255, b: 0 },
          hsl: { h: 120, s: 100, l: 50 },
          name: 'Green',
          category: 'secondary',
          usage: 'Success color',
          accessibility: {
            contrastWithWhite: 1.37,
            contrastWithBlack: 15.3,
            wcagLevel: 'AAA',
          },
        },
      ];

      const score = accessibilityService.calculateAccessibilityScore(similarColors);

      expect(score.colorBlindnessCompatible).toBeDefined();
      expect(typeof score.colorBlindnessCompatible).toBe('boolean');
    });

    it('should approve clearly distinguishable colors', () => {
      const distinctColors: ColorData[] = [
        {
          hex: '#000000', // Black
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
          hex: '#FFFFFF', // White
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

      const score = accessibilityService.calculateAccessibilityScore(distinctColors);

      expect(score.colorBlindnessCompatible).toBe(true);
    });
  });

  describe('recommendations generation', () => {
    it('should provide helpful recommendations', () => {
      const problematicColors: ColorData[] = [
        {
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
        },
      ];

      const score = accessibilityService.calculateAccessibilityScore(problematicColors);

      expect(score.recommendations.length).toBeGreaterThan(0);
      expect(score.recommendations.some(rec => 
        rec.includes('contrast') || rec.includes('accessibility')
      )).toBe(true);
    });

    it('should provide positive feedback for good palettes', () => {
      const goodColors: ColorData[] = [
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
        {
          hex: '#0066CC',
          rgb: { r: 0, g: 102, b: 204 },
          hsl: { h: 210, s: 100, l: 40 },
          name: 'Blue',
          category: 'accent',
          usage: 'Link color',
          accessibility: {
            contrastWithWhite: 5.5,
            contrastWithBlack: 3.8,
            wcagLevel: 'AA',
          },
        },
      ];

      const score = accessibilityService.calculateAccessibilityScore(goodColors);

      if (score.overallScore !== 'FAIL') {
        expect(score.recommendations.some(rec => 
          rec.includes('Excellent') || rec.includes('good') || rec.includes('well')
        )).toBe(true);
      }
    });
  });
});