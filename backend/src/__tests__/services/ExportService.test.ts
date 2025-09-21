import { ExportService } from '../../services/ExportService';
import { ColorPaletteData } from '../../types/color';

// Mock logger
jest.mock('../../utils/logger');

describe('ExportService', () => {
  let exportService: ExportService;
  
  const mockPalette: ColorPaletteData = {
    id: 'test-palette-id',
    name: 'Sunset Vibes',
    prompt: 'A warm sunset palette with orange and pink tones',
    colors: [
      {
        hex: '#FF6B35',
        rgb: { r: 255, g: 107, b: 53 },
        hsl: { h: 16, s: 100, l: 60 },
        name: 'Sunset Orange',
        category: 'primary',
        usage: 'Primary brand color for headers and CTAs',
        accessibility: {
          contrastWithWhite: 3.2,
          contrastWithBlack: 6.5,
          wcagLevel: 'AA',
        },
      },
      {
        hex: '#F7931E',
        rgb: { r: 247, g: 147, b: 30 },
        hsl: { h: 32, s: 93, l: 54 },
        name: 'Golden Hour',
        category: 'secondary',
        usage: 'Secondary accents and highlights',
        accessibility: {
          contrastWithWhite: 2.8,
          contrastWithBlack: 7.5,
          wcagLevel: 'AA',
        },
      },
      {
        hex: '#2C3E50',
        rgb: { r: 44, g: 62, b: 80 },
        hsl: { h: 210, s: 29, l: 24 },
        name: 'Deep Navy',
        category: 'neutral',
        usage: 'Text and dark backgrounds',
        accessibility: {
          contrastWithWhite: 15.3,
          contrastWithBlack: 1.4,
          wcagLevel: 'AAA',
        },
      },
    ],
    accessibilityScore: {
      overallScore: 'AA',
      contrastRatios: [
        {
          color1: '#FF6B35',
          color2: '#2C3E50',
          ratio: 4.2,
          level: 'AA',
          isTextReadable: true,
        },
      ],
      colorBlindnessCompatible: true,
      recommendations: ['Consider using darker shades for better contrast'],
      passedChecks: 8,
      totalChecks: 10,
    },
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
  };

  beforeEach(() => {
    exportService = new ExportService();
  });

  describe('CSS Export', () => {
    it('should generate valid CSS with custom properties and utility classes', async () => {
      const result = await exportService.exportPalette(mockPalette, 'css');

      expect(result.format).toBe('css');
      expect(result.filename).toBe('sunset-vibes.css');
      expect(result.mimeType).toBe('text/css');
      
      // Check CSS content
      expect(result.content).toContain(':root {');
      expect(result.content).toContain('--color-sunset-orange: #FF6B35;');
      expect(result.content).toContain('--color-sunset-orange-rgb: 255, 107, 53;');
      expect(result.content).toContain('.bg-sunset-orange { background-color: #FF6B35; }');
      expect(result.content).toContain('.text-sunset-orange { color: #FF6B35; }');
      expect(result.content).toContain('/* Sunset Vibes Color Palette */');
    });
  });

  describe('SCSS Export', () => {
    it('should generate valid SCSS with variables and mixins', async () => {
      const result = await exportService.exportPalette(mockPalette, 'scss');

      expect(result.format).toBe('scss');
      expect(result.filename).toBe('sunset-vibes.scss');
      expect(result.mimeType).toBe('text/scss');
      
      // Check SCSS content
      expect(result.content).toContain('$sunset-orange: #FF6B35;');
      expect(result.content).toContain('$sunset-orange-rgb: 255, 107, 53;');
      expect(result.content).toContain('$colors: (');
      expect(result.content).toContain('@mixin bg-color($color-name)');
      expect(result.content).toContain('// Sunset Vibes Color Palette');
    });
  });

  describe('JSON Export', () => {
    it('should generate valid JSON with complete palette data', async () => {
      const result = await exportService.exportPalette(mockPalette, 'json');

      expect(result.format).toBe('json');
      expect(result.filename).toBe('sunset-vibes.json');
      expect(result.mimeType).toBe('application/json');
      
      // Parse and validate JSON
      const jsonData = JSON.parse(result.content);
      expect(jsonData.name).toBe('Sunset Vibes');
      expect(jsonData.prompt).toBe('A warm sunset palette with orange and pink tones');
      expect(jsonData.colors).toHaveLength(3);
      expect(jsonData.colors[0].name).toBe('Sunset Orange');
      expect(jsonData.colors[0].hex).toBe('#FF6B35');
      expect(jsonData.accessibilityScore).toBeDefined();
      expect(jsonData.metadata.totalColors).toBe(3);
    });
  });

  describe('Tailwind Export', () => {
    it('should generate valid Tailwind CSS configuration', async () => {
      const result = await exportService.exportPalette(mockPalette, 'tailwind');

      expect(result.format).toBe('tailwind');
      expect(result.filename).toBe('sunset-vibes-tailwind.js');
      expect(result.mimeType).toBe('application/javascript');
      
      // Check Tailwind content
      expect(result.content).toContain('module.exports = {');
      expect(result.content).toContain('theme: {');
      expect(result.content).toContain('extend: {');
      expect(result.content).toContain('colors: {');
      expect(result.content).toContain("'sunset-orange': {");
      expect(result.content).toContain("DEFAULT: '#FF6B35'");
      expect(result.content).toContain("50: '#"); // Light shade
      expect(result.content).toContain("900: '#"); // Dark shade
    });
  });

  describe('Sketch Export', () => {
    it('should generate valid Sketch palette format', async () => {
      const result = await exportService.exportPalette(mockPalette, 'sketch');

      expect(result.format).toBe('sketch');
      expect(result.filename).toBe('sunset-vibes-sketch.json');
      expect(result.mimeType).toBe('application/json');
      
      // Parse and validate Sketch JSON
      const sketchData = JSON.parse(result.content);
      expect(sketchData.compatibleVersion).toBe('3');
      expect(sketchData.colors).toHaveLength(3);
      expect(sketchData.colors[0].name).toBe('Sunset Orange');
      expect(sketchData.colors[0].red).toBeCloseTo(1, 2); // 255/255
      expect(sketchData.colors[0].green).toBeCloseTo(0.42, 2); // 107/255
      expect(sketchData.colors[0].alpha).toBe(1);
    });
  });

  describe('Figma Export', () => {
    it('should generate valid Figma tokens format', async () => {
      const result = await exportService.exportPalette(mockPalette, 'figma');

      expect(result.format).toBe('figma');
      expect(result.filename).toBe('sunset-vibes-figma.json');
      expect(result.mimeType).toBe('application/json');
      
      // Parse and validate Figma JSON
      const figmaData = JSON.parse(result.content);
      expect(figmaData.name).toBe('Sunset Vibes');
      expect(figmaData.colors).toHaveLength(3);
      expect(figmaData.colors[0].name).toBe('Sunset Orange');
      expect(figmaData.colors[0].description).toBe('Primary brand color for headers and CTAs');
      expect(figmaData.colors[0].color.r).toBeCloseTo(1, 2);
      expect(figmaData.colors[0].scopes).toContain('ALL_SCOPES');
    });
  });

  describe('ASE Export', () => {
    it('should generate Adobe Swatch Exchange format', async () => {
      const result = await exportService.exportPalette(mockPalette, 'ase');

      expect(result.format).toBe('ase');
      expect(result.filename).toBe('sunset-vibes.ase');
      expect(result.mimeType).toBe('application/octet-stream');
      
      // Check ASE content (text representation)
      expect(result.content).toContain('Adobe Swatch Exchange Format');
      expect(result.content).toContain('Palette: Sunset Vibes');
      expect(result.content).toContain('Colors: 3');
      expect(result.content).toContain('Name: Sunset Orange');
      expect(result.content).toContain('Type: RGB');
      expect(result.content).toContain('R: 1.000000'); // 255/255
    });
  });

  describe('Error Handling', () => {
    it('should throw error for unsupported format', async () => {
      await expect(
        exportService.exportPalette(mockPalette, 'unsupported' as any)
      ).rejects.toThrow('Unsupported export format: unsupported');
    });

    it('should handle empty palette gracefully', async () => {
      const emptyPalette = { ...mockPalette, colors: [] };
      
      const result = await exportService.exportPalette(emptyPalette, 'json');
      const jsonData = JSON.parse(result.content);
      
      expect(jsonData.colors).toHaveLength(0);
      expect(jsonData.metadata.totalColors).toBe(0);
    });
  });

  describe('Filename Sanitization', () => {
    it('should sanitize special characters in filenames', async () => {
      const specialPalette = {
        ...mockPalette,
        name: 'My Awesome Palette! @#$%^&*()',
      };

      const result = await exportService.exportPalette(specialPalette, 'css');
      expect(result.filename).toBe('my-awesome-palette.css');
    });

    it('should handle very long palette names', async () => {
      const longNamePalette = {
        ...mockPalette,
        name: 'This is a very long palette name that should be truncated or handled appropriately',
      };

      const result = await exportService.exportPalette(longNamePalette, 'css');
      expect(result.filename).toMatch(/^this-is-a-very-long-palette-name.*\.css$/);
    });
  });

  describe('Color Utility Functions', () => {
    it('should correctly lighten colors', async () => {
      const result = await exportService.exportPalette(mockPalette, 'tailwind');
      
      // Check that lighter shades are generated
      expect(result.content).toContain("50: '#"); // Lightest shade
      expect(result.content).toContain("100: '#");
      
      // Verify the content is valid JavaScript
      expect(() => {
        // This would throw if the JavaScript is malformed
        new Function(result.content.replace('module.exports = ', 'return '));
      }).not.toThrow();
    });
  });
});