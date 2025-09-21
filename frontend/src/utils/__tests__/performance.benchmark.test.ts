import { describe, it, expect, vi, beforeEach } from 'vitest';
import { measureSync, measureAsync } from '../performance';

// Mock color palette data for benchmarking
const generateMockPalette = (colorCount: number) => ({
  id: `palette-${colorCount}`,
  name: `Test Palette ${colorCount}`,
  prompt: 'Test prompt',
  colors: Array.from({ length: colorCount }, (_, i) => ({
    hex: `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`,
    rgb: { r: i * 10, g: i * 15, b: i * 20 },
    hsl: { h: i * 30, s: 50, l: 50 },
    name: `Color ${i}`,
    category: i % 3 === 0 ? 'primary' : i % 3 === 1 ? 'secondary' : 'accent',
    usage: `Usage for color ${i}`,
    accessibility: {
      contrastWithWhite: 4.5,
      contrastWithBlack: 2.1,
      wcagLevel: 'AA' as const,
    },
  })),
  accessibilityScore: {
    overallScore: 'AA' as const,
    passedChecks: colorCount * 2,
    totalChecks: colorCount * 3,
    colorBlindnessCompatible: true,
    recommendations: [],
  },
  createdAt: new Date(),
  updatedAt: new Date(),
});

const generateMockPalettes = (count: number, colorsPerPalette: number = 6) => {
  return Array.from({ length: count }, (_, i) => generateMockPalette(colorsPerPalette));
};

describe('Performance Benchmarks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Color Palette Processing', () => {
    it('should process small palette lists efficiently', () => {
      const palettes = generateMockPalettes(10);
      
      const result = measureSync('process_small_palettes', () => {
        return palettes.map(palette => ({
          ...palette,
          colorCount: palette.colors.length,
          dominantColor: palette.colors[0],
        }));
      });
      
      expect(result).toHaveLength(10);
      expect(result[0].colorCount).toBe(6);
    });

    it('should process medium palette lists efficiently', () => {
      const palettes = generateMockPalettes(100);
      
      const result = measureSync('process_medium_palettes', () => {
        return palettes
          .filter(palette => palette.accessibilityScore.overallScore === 'AA')
          .map(palette => ({
            id: palette.id,
            name: palette.name,
            colorCount: palette.colors.length,
            accessibilityScore: palette.accessibilityScore.overallScore,
          }));
      });
      
      expect(result.length).toBeGreaterThan(0);
    });

    it('should process large palette lists efficiently', () => {
      const palettes = generateMockPalettes(1000);
      
      const result = measureSync('process_large_palettes', () => {
        // Simulate complex filtering and sorting
        return palettes
          .filter(palette => palette.colors.length >= 5)
          .sort((a, b) => a.name.localeCompare(b.name))
          .slice(0, 50)
          .map(palette => ({
            id: palette.id,
            name: palette.name,
            colors: palette.colors.map(color => color.hex),
          }));
      });
      
      expect(result).toHaveLength(50);
    });
  });

  describe('Color Conversion Performance', () => {
    it('should convert colors efficiently', () => {
      const colors = Array.from({ length: 1000 }, (_, i) => ({
        hex: `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`,
      }));
      
      const result = measureSync('color_conversion', () => {
        return colors.map(color => {
          // Simulate hex to RGB conversion
          const hex = color.hex.slice(1);
          const r = parseInt(hex.slice(0, 2), 16);
          const g = parseInt(hex.slice(2, 4), 16);
          const b = parseInt(hex.slice(4, 6), 16);
          
          // Simulate RGB to HSL conversion
          const rNorm = r / 255;
          const gNorm = g / 255;
          const bNorm = b / 255;
          
          const max = Math.max(rNorm, gNorm, bNorm);
          const min = Math.min(rNorm, gNorm, bNorm);
          const diff = max - min;
          
          const l = (max + min) / 2;
          const s = diff === 0 ? 0 : diff / (1 - Math.abs(2 * l - 1));
          
          let h = 0;
          if (diff !== 0) {
            if (max === rNorm) {
              h = ((gNorm - bNorm) / diff) % 6;
            } else if (max === gNorm) {
              h = (bNorm - rNorm) / diff + 2;
            } else {
              h = (rNorm - gNorm) / diff + 4;
            }
          }
          h = Math.round(h * 60);
          
          return {
            hex: color.hex,
            rgb: { r, g, b },
            hsl: { h, s: Math.round(s * 100), l: Math.round(l * 100) },
          };
        });
      });
      
      expect(result).toHaveLength(1000);
      expect(result[0]).toHaveProperty('rgb');
      expect(result[0]).toHaveProperty('hsl');
    });
  });

  describe('Accessibility Calculations', () => {
    it('should calculate contrast ratios efficiently', () => {
      const colorPairs = Array.from({ length: 500 }, (_, i) => ({
        color1: `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`,
        color2: `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`,
      }));
      
      const result = measureSync('contrast_calculations', () => {
        return colorPairs.map(({ color1, color2 }) => {
          // Simulate contrast ratio calculation
          const getLuminance = (hex: string) => {
            const rgb = [
              parseInt(hex.slice(1, 3), 16),
              parseInt(hex.slice(3, 5), 16),
              parseInt(hex.slice(5, 7), 16),
            ].map(c => {
              c = c / 255;
              return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
            });
            
            return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
          };
          
          const lum1 = getLuminance(color1);
          const lum2 = getLuminance(color2);
          const brightest = Math.max(lum1, lum2);
          const darkest = Math.min(lum1, lum2);
          
          const contrast = (brightest + 0.05) / (darkest + 0.05);
          
          return {
            color1,
            color2,
            contrast,
            wcagAA: contrast >= 4.5,
            wcagAAA: contrast >= 7,
          };
        });
      });
      
      expect(result).toHaveLength(500);
      expect(result[0]).toHaveProperty('contrast');
      expect(result[0]).toHaveProperty('wcagAA');
    });
  });

  describe('Async Operations', () => {
    it('should handle async palette generation efficiently', async () => {
      const mockApiCall = () => new Promise(resolve => {
        setTimeout(() => resolve(generateMockPalette(6)), 10);
      });
      
      const result = await measureAsync('async_palette_generation', async () => {
        const promises = Array.from({ length: 5 }, () => mockApiCall());
        return Promise.all(promises);
      });
      
      expect(result).toHaveLength(5);
      expect(result[0]).toHaveProperty('colors');
    });

    it('should handle concurrent operations efficiently', async () => {
      const mockOperations = Array.from({ length: 10 }, (_, i) => 
        () => new Promise(resolve => {
          setTimeout(() => resolve(`Operation ${i} complete`), Math.random() * 20);
        })
      );
      
      const result = await measureAsync('concurrent_operations', async () => {
        return Promise.all(mockOperations.map(op => op()));
      });
      
      expect(result).toHaveLength(10);
      expect(result[0]).toContain('Operation');
    });
  });

  describe('Memory Usage Simulation', () => {
    it('should handle large data structures efficiently', () => {
      const result = measureSync('large_data_structure', () => {
        // Create a large array of palettes
        const largePaletteSet = generateMockPalettes(2000, 10);
        
        // Perform operations that might cause memory pressure
        const processed = largePaletteSet.map(palette => ({
          ...palette,
          serialized: JSON.stringify(palette),
          hash: palette.id + palette.name + palette.colors.length,
        }));
        
        // Simulate cleanup
        return processed.slice(0, 100);
      });
      
      expect(result).toHaveLength(100);
      expect(result[0]).toHaveProperty('serialized');
    });
  });
});