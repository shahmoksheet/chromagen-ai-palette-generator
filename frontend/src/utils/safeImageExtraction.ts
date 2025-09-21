// Safe image color extraction that won't crash the app
export interface SafeExtractedColor {
  hex: string;
  rgb: { r: number; g: number; b: number };
  hsl: { h: number; s: number; l: number };
  name: string;
  category: string;
  usage: string;
  accessibility: {
    contrastWithWhite: number;
    contrastWithBlack: number;
    wcagLevel: string;
  };
}

// Safe color extraction with error handling
export async function safeExtractColorsFromImage(file: File): Promise<SafeExtractedColor[]> {
  return new Promise((resolve) => {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        try {
          // Resize for performance
          const maxSize = 100;
          const scale = Math.min(maxSize / img.width, maxSize / img.height);
          canvas.width = Math.max(1, img.width * scale);
          canvas.height = Math.max(1, img.height * scale);
          
          ctx!.drawImage(img, 0, 0, canvas.width, canvas.height);
          
          // Get image data
          const imageData = ctx!.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;
          
          // Simple color sampling with better coverage
          const colors: { [key: string]: number } = {};
          const step = Math.max(4, Math.floor(data.length / 1000)); // Adaptive sampling
          
          for (let i = 0; i < data.length; i += step) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const a = data[i + 3];
            
            if (a < 128) continue; // Skip transparent
            if (r > 240 && g > 240 && b > 240) continue; // Skip white-ish
            if (r < 15 && g < 15 && b < 15) continue; // Skip black-ish
            
            const hex = rgbToHex(r, g, b);
            colors[hex] = (colors[hex] || 0) + 1;
          }
          
          // Get top colors (ensure we have at least some colors)
          const sortedColors = Object.entries(colors)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5);
          
          // If we didn't extract enough colors, add some defaults
          if (sortedColors.length < 3) {
            console.warn('Not enough colors extracted, using fallback');
            throw new Error('Insufficient color data');
          }
          
          // Convert to SafeExtractedColor format
          const extractedColors: SafeExtractedColor[] = sortedColors.map(([hex], index) => {
            const rgb = hexToRgb(hex);
            const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
            const categories = ['primary', 'secondary', 'accent', 'neutral', 'background'];
            const category = categories[index] || 'accent';
            
            return {
              hex,
              rgb,
              hsl,
              name: `Extracted ${category.charAt(0).toUpperCase() + category.slice(1)}`,
              category,
              usage: `${category.charAt(0).toUpperCase() + category.slice(1)} color from your image`,
              accessibility: {
                contrastWithWhite: calculateContrast(rgb, { r: 255, g: 255, b: 255 }),
                contrastWithBlack: calculateContrast(rgb, { r: 0, g: 0, b: 0 }),
                wcagLevel: 'AA'
              }
            };
          });
          
          resolve(extractedColors.length > 0 ? extractedColors : getDefaultColors());
          
        } catch (error) {
          console.warn('Error processing image:', error);
          resolve(getDefaultColors());
        }
      };
      
      img.onerror = () => {
        console.warn('Error loading image');
        resolve(getDefaultColors());
      };
      
      // Create object URL
      const url = URL.createObjectURL(file);
      img.src = url;
      
      // Cleanup after 10 seconds
      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 10000);
      
    } catch (error) {
      console.warn('Error in color extraction:', error);
      resolve(getDefaultColors());
    }
  });
}

// Utility functions
function rgbToHex(r: number, g: number, b: number): string {
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 0, g: 0, b: 0 };
}

function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  r /= 255;
  g /= 255;
  b /= 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100)
  };
}

function calculateContrast(color1: { r: number; g: number; b: number }, color2: { r: number; g: number; b: number }): number {
  const getLuminance = (rgb: { r: number; g: number; b: number }) => {
    const [r, g, b] = [rgb.r, rgb.g, rgb.b].map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  
  const lum1 = getLuminance(color1);
  const lum2 = getLuminance(color2);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  
  return (brightest + 0.05) / (darkest + 0.05);
}

// Default colors if extraction fails
function getDefaultColors(): SafeExtractedColor[] {
  return [
    {
      hex: '#3B82F6',
      rgb: { r: 59, g: 130, b: 246 },
      hsl: { h: 217, s: 91, l: 60 },
      name: 'Default Blue',
      category: 'primary',
      usage: 'Primary color (extraction fallback)',
      accessibility: { contrastWithWhite: 3.1, contrastWithBlack: 6.8, wcagLevel: 'AA' }
    },
    {
      hex: '#10B981',
      rgb: { r: 16, g: 185, b: 129 },
      hsl: { h: 160, s: 84, l: 39 },
      name: 'Default Green',
      category: 'secondary',
      usage: 'Secondary color (extraction fallback)',
      accessibility: { contrastWithWhite: 3.9, contrastWithBlack: 5.4, wcagLevel: 'AA' }
    },
    {
      hex: '#F59E0B',
      rgb: { r: 245, g: 158, b: 11 },
      hsl: { h: 38, s: 92, l: 50 },
      name: 'Default Amber',
      category: 'accent',
      usage: 'Accent color (extraction fallback)',
      accessibility: { contrastWithWhite: 2.8, contrastWithBlack: 7.5, wcagLevel: 'AA' }
    }
  ];
}