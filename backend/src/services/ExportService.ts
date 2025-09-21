import { ColorPaletteData, ExportFormat, ExportData } from '../types/color';
import { logger } from '../utils/logger';

export class ExportService {
  /**
   * Export a color palette to the specified format
   */
  async exportPalette(palette: ColorPaletteData, format: ExportFormat): Promise<ExportData> {
    try {
      logger.info('Exporting palette', { 
        paletteId: palette.id, 
        format,
        colorCount: palette.colors.length 
      });

      let content: string;
      let filename: string;
      let mimeType: string;

      switch (format) {
        case 'css':
          content = this.generateCSS(palette);
          filename = `${this.sanitizeFilename(palette.name)}.css`;
          mimeType = 'text/css';
          break;

        case 'scss':
          content = this.generateSCSS(palette);
          filename = `${this.sanitizeFilename(palette.name)}.scss`;
          mimeType = 'text/scss';
          break;

        case 'json':
          content = this.generateJSON(palette);
          filename = `${this.sanitizeFilename(palette.name)}.json`;
          mimeType = 'application/json';
          break;

        case 'tailwind':
          content = this.generateTailwind(palette);
          filename = `${this.sanitizeFilename(palette.name)}-tailwind.js`;
          mimeType = 'application/javascript';
          break;

        case 'ase':
          // Adobe Swatch Exchange format (binary)
          content = this.generateASE(palette);
          filename = `${this.sanitizeFilename(palette.name)}.ase`;
          mimeType = 'application/octet-stream';
          break;

        case 'sketch':
          content = this.generateSketch(palette);
          filename = `${this.sanitizeFilename(palette.name)}-sketch.json`;
          mimeType = 'application/json';
          break;

        case 'figma':
          content = this.generateFigma(palette);
          filename = `${this.sanitizeFilename(palette.name)}-figma.json`;
          mimeType = 'application/json';
          break;

        default:
          throw new Error(`Unsupported export format: ${format}`);
      }

      const exportData: ExportData = {
        format,
        content,
        filename,
        mimeType,
      };

      logger.info('Palette exported successfully', { 
        paletteId: palette.id, 
        format,
        filename,
        contentLength: content.length 
      });

      return exportData;

    } catch (error) {
      logger.error('Failed to export palette', { 
        paletteId: palette.id, 
        format, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      throw error;
    }
  }

  /**
   * Generate CSS format
   */
  private generateCSS(palette: ColorPaletteData): string {
    const timestamp = new Date().toISOString();
    let css = `/* ${palette.name} Color Palette */\n`;
    css += `/* Generated on ${timestamp} */\n`;
    css += `/* Prompt: ${palette.prompt || 'N/A'} */\n\n`;

    css += `:root {\n`;
    
    // Add CSS custom properties
    palette.colors.forEach((color, index) => {
      const varName = this.toCSSVariableName(color.name);
      css += `  --color-${varName}: ${color.hex};\n`;
      css += `  --color-${varName}-rgb: ${color.rgb.r}, ${color.rgb.g}, ${color.rgb.b};\n`;
    });

    css += `}\n\n`;

    // Add utility classes
    palette.colors.forEach((color) => {
      const className = this.toCSSClassName(color.name);
      css += `/* ${color.name} - ${color.usage} */\n`;
      css += `.bg-${className} { background-color: ${color.hex}; }\n`;
      css += `.text-${className} { color: ${color.hex}; }\n`;
      css += `.border-${className} { border-color: ${color.hex}; }\n\n`;
    });

    return css;
  }

  /**
   * Generate SCSS format
   */
  private generateSCSS(palette: ColorPaletteData): string {
    const timestamp = new Date().toISOString();
    let scss = `// ${palette.name} Color Palette\n`;
    scss += `// Generated on ${timestamp}\n`;
    scss += `// Prompt: ${palette.prompt || 'N/A'}\n\n`;

    // SCSS variables
    palette.colors.forEach((color) => {
      const varName = this.toSCSSVariableName(color.name);
      scss += `$${varName}: ${color.hex}; // ${color.usage}\n`;
      scss += `$${varName}-rgb: ${color.rgb.r}, ${color.rgb.g}, ${color.rgb.b};\n`;
    });

    scss += `\n// Color map for easy iteration\n`;
    scss += `$colors: (\n`;
    palette.colors.forEach((color, index) => {
      const varName = this.toSCSSVariableName(color.name);
      scss += `  '${color.name.toLowerCase().replace(/\s+/g, '-')}': $${varName}`;
      scss += index < palette.colors.length - 1 ? ',\n' : '\n';
    });
    scss += `);\n\n`;

    // Mixins
    scss += `// Utility mixins\n`;
    scss += `@mixin bg-color($color-name) {\n`;
    scss += `  background-color: map-get($colors, $color-name);\n`;
    scss += `}\n\n`;
    scss += `@mixin text-color($color-name) {\n`;
    scss += `  color: map-get($colors, $color-name);\n`;
    scss += `}\n`;

    return scss;
  }

  /**
   * Generate JSON format
   */
  private generateJSON(palette: ColorPaletteData): string {
    const exportObject = {
      name: palette.name,
      prompt: palette.prompt,
      generatedAt: new Date().toISOString(),
      colors: palette.colors.map(color => ({
        name: color.name,
        hex: color.hex,
        rgb: color.rgb,
        hsl: color.hsl,
        category: color.category,
        usage: color.usage,
        accessibility: color.accessibility,
      })),
      accessibilityScore: palette.accessibilityScore,
      metadata: {
        totalColors: palette.colors.length,
        categories: [...new Set(palette.colors.map(c => c.category))],
        wcagCompliance: palette.accessibilityScore?.overallScore || 'Unknown',
      },
    };

    return JSON.stringify(exportObject, null, 2);
  }

  /**
   * Generate Tailwind CSS config format
   */
  private generateTailwind(palette: ColorPaletteData): string {
    const timestamp = new Date().toISOString();
    let tailwind = `// ${palette.name} - Tailwind CSS Configuration\n`;
    tailwind += `// Generated on ${timestamp}\n`;
    tailwind += `// Add this to your tailwind.config.js theme.extend.colors\n\n`;

    tailwind += `module.exports = {\n`;
    tailwind += `  theme: {\n`;
    tailwind += `    extend: {\n`;
    tailwind += `      colors: {\n`;
    tailwind += `        // ${palette.name}\n`;

    palette.colors.forEach((color) => {
      const colorName = this.toTailwindColorName(color.name);
      tailwind += `        '${colorName}': {\n`;
      tailwind += `          DEFAULT: '${color.hex}',\n`;
      tailwind += `          50: '${this.lightenColor(color.hex, 0.9)}',\n`;
      tailwind += `          100: '${this.lightenColor(color.hex, 0.8)}',\n`;
      tailwind += `          200: '${this.lightenColor(color.hex, 0.6)}',\n`;
      tailwind += `          300: '${this.lightenColor(color.hex, 0.4)}',\n`;
      tailwind += `          400: '${this.lightenColor(color.hex, 0.2)}',\n`;
      tailwind += `          500: '${color.hex}',\n`;
      tailwind += `          600: '${this.darkenColor(color.hex, 0.1)}',\n`;
      tailwind += `          700: '${this.darkenColor(color.hex, 0.2)}',\n`;
      tailwind += `          800: '${this.darkenColor(color.hex, 0.3)}',\n`;
      tailwind += `          900: '${this.darkenColor(color.hex, 0.4)}',\n`;
      tailwind += `        },\n`;
    });

    tailwind += `      }\n`;
    tailwind += `    }\n`;
    tailwind += `  }\n`;
    tailwind += `};\n`;

    return tailwind;
  }

  /**
   * Generate Adobe Swatch Exchange (ASE) format
   * Note: This is a simplified text representation, not binary ASE
   */
  private generateASE(palette: ColorPaletteData): string {
    let ase = `Adobe Swatch Exchange Format\n`;
    ase += `Palette: ${palette.name}\n`;
    ase += `Colors: ${palette.colors.length}\n\n`;

    palette.colors.forEach((color, index) => {
      ase += `Color ${index + 1}:\n`;
      ase += `  Name: ${color.name}\n`;
      ase += `  Type: RGB\n`;
      ase += `  R: ${(color.rgb.r / 255).toFixed(6)}\n`;
      ase += `  G: ${(color.rgb.g / 255).toFixed(6)}\n`;
      ase += `  B: ${(color.rgb.b / 255).toFixed(6)}\n`;
      ase += `  Usage: ${color.usage}\n\n`;
    });

    return ase;
  }

  /**
   * Generate Sketch format
   */
  private generateSketch(palette: ColorPaletteData): string {
    const sketchPalette = {
      compatibleVersion: '3',
      pluginVersion: '1.0',
      colors: palette.colors.map(color => ({
        name: color.name,
        red: color.rgb.r / 255,
        green: color.rgb.g / 255,
        blue: color.rgb.b / 255,
        alpha: 1,
      })),
    };

    return JSON.stringify(sketchPalette, null, 2);
  }

  /**
   * Generate Figma format
   */
  private generateFigma(palette: ColorPaletteData): string {
    const figmaPalette = {
      name: palette.name,
      description: palette.prompt || '',
      colors: palette.colors.map(color => ({
        name: color.name,
        description: color.usage,
        color: {
          r: color.rgb.r / 255,
          g: color.rgb.g / 255,
          b: color.rgb.b / 255,
          a: 1,
        },
        scopes: ['ALL_SCOPES'],
        codeSyntax: {},
      })),
    };

    return JSON.stringify(figmaPalette, null, 2);
  }

  /**
   * Utility functions
   */
  private sanitizeFilename(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '') // Remove leading/trailing dashes
      .trim();
  }

  private toCSSVariableName(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-');
  }

  private toCSSClassName(name: string): string {
    return this.toCSSVariableName(name);
  }

  private toSCSSVariableName(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-');
  }

  private toTailwindColorName(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-');
  }

  private lightenColor(hex: string, amount: number): string {
    // Simple color lightening - convert to RGB, increase values, convert back
    const rgb = this.hexToRgb(hex);
    if (!rgb) return hex;

    const r = Math.min(255, Math.round(rgb.r + (255 - rgb.r) * amount));
    const g = Math.min(255, Math.round(rgb.g + (255 - rgb.g) * amount));
    const b = Math.min(255, Math.round(rgb.b + (255 - rgb.b) * amount));

    return this.rgbToHex(r, g, b);
  }

  private darkenColor(hex: string, amount: number): string {
    // Simple color darkening - convert to RGB, decrease values, convert back
    const rgb = this.hexToRgb(hex);
    if (!rgb) return hex;

    const r = Math.max(0, Math.round(rgb.r * (1 - amount)));
    const g = Math.max(0, Math.round(rgb.g * (1 - amount)));
    const b = Math.max(0, Math.round(rgb.b * (1 - amount)));

    return this.rgbToHex(r, g, b);
  }

  private hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16),
    } : null;
  }

  private rgbToHex(r: number, g: number, b: number): string {
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
  }
}

// Export singleton instance
export const exportService = new ExportService();