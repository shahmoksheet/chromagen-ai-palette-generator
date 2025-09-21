// Image color extraction utilities
export interface ExtractedColor {
  hex: string;
  rgb: { r: number; g: number; b: number };
  hsl: { h: number; s: number; l: number };
  frequency: number;
}

export interface ColorExtractionResult {
  dominantColors: ExtractedColor[];
  palette: ExtractedColor[];
  averageColor: ExtractedColor;
}

// Convert RGB to HEX
export function rgbToHex(r: number, g: number, b: number): string {
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

// Convert RGB to HSL
export function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
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

// Calculate color distance (Delta E)
function colorDistance(color1: { r: number; g: number; b: number }, color2: { r: number; g: number; b: number }): number {
  const rMean = (color1.r + color2.r) / 2;
  const deltaR = color1.r - color2.r;
  const deltaG = color1.g - color2.g;
  const deltaB = color1.b - color2.b;
  
  const weightR = 2 + rMean / 256;
  const weightG = 4;
  const weightB = 2 + (255 - rMean) / 256;
  
  return Math.sqrt(weightR * deltaR * deltaR + weightG * deltaG * deltaG + weightB * deltaB * deltaB);
}

// Quantize colors to reduce similar colors
function quantizeColors(colors: ExtractedColor[], threshold: number = 30): ExtractedColor[] {
  const quantized: ExtractedColor[] = [];
  
  for (const color of colors) {
    let merged = false;
    
    for (const existing of quantized) {
      if (colorDistance(color.rgb, existing.rgb) < threshold) {
        // Merge colors by averaging and combining frequency
        const totalFreq = color.frequency + existing.frequency;
        existing.rgb.r = Math.round((color.rgb.r * color.frequency + existing.rgb.r * existing.frequency) / totalFreq);
        existing.rgb.g = Math.round((color.rgb.g * color.frequency + existing.rgb.g * existing.frequency) / totalFreq);
        existing.rgb.b = Math.round((color.rgb.b * color.frequency + existing.rgb.b * existing.frequency) / totalFreq);
        existing.hex = rgbToHex(existing.rgb.r, existing.rgb.g, existing.rgb.b);
        existing.hsl = rgbToHsl(existing.rgb.r, existing.rgb.g, existing.rgb.b);
        existing.frequency = totalFreq;
        merged = true;
        break;
      }
    }
    
    if (!merged) {
      quantized.push({ ...color });
    }
  }
  
  return quantized.sort((a, b) => b.frequency - a.frequency);
}

// Extract colors from image
export async function extractColorsFromImage(imageFile: File, options: {
  maxColors?: number;
  quality?: number;
  excludeWhite?: boolean;
  excludeBlack?: boolean;
} = {}): Promise<ColorExtractionResult> {
  const {
    maxColors = 8,
    quality = 4,
    excludeWhite = true,
    excludeBlack = true
  } = options;

  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      try {
        // Resize image for faster processing
        const maxSize = 200;
        const scale = Math.min(maxSize / img.width, maxSize / img.height);
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        
        ctx!.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        // Get image data
        const imageData = ctx!.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        // Extract colors with frequency
        const colorMap = new Map<string, number>();
        
        for (let i = 0; i < data.length; i += 4 * quality) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const a = data[i + 3];
          
          // Skip transparent pixels
          if (a < 128) continue;
          
          // Skip very light colors (white-ish) if excludeWhite
          if (excludeWhite && r > 240 && g > 240 && b > 240) continue;
          
          // Skip very dark colors (black-ish) if excludeBlack
          if (excludeBlack && r < 15 && g < 15 && b < 15) continue;
          
          const hex = rgbToHex(r, g, b);
          colorMap.set(hex, (colorMap.get(hex) || 0) + 1);
        }
        
        // Convert to ExtractedColor array
        const extractedColors: ExtractedColor[] = Array.from(colorMap.entries()).map(([hex, frequency]) => {
          const r = parseInt(hex.slice(1, 3), 16);
          const g = parseInt(hex.slice(3, 5), 16);
          const b = parseInt(hex.slice(5, 7), 16);
          const rgb = { r, g, b };
          const hsl = rgbToHsl(r, g, b);
          
          return { hex, rgb, hsl, frequency };
        });
        
        // Quantize similar colors
        const quantizedColors = quantizeColors(extractedColors, 25);
        
        // Get dominant colors
        const dominantColors = quantizedColors.slice(0, maxColors);
        
        // Calculate average color
        let totalR = 0, totalG = 0, totalB = 0, totalFreq = 0;
        for (const color of dominantColors) {
          totalR += color.rgb.r * color.frequency;
          totalG += color.rgb.g * color.frequency;
          totalB += color.rgb.b * color.frequency;
          totalFreq += color.frequency;
        }
        
        const avgR = Math.round(totalR / totalFreq);
        const avgG = Math.round(totalG / totalFreq);
        const avgB = Math.round(totalB / totalFreq);
        const averageColor: ExtractedColor = {
          hex: rgbToHex(avgR, avgG, avgB),
          rgb: { r: avgR, g: avgG, b: avgB },
          hsl: rgbToHsl(avgR, avgG, avgB),
          frequency: totalFreq
        };
        
        // Generate harmonious palette based on dominant colors
        const palette = generateHarmoniousPalette(dominantColors.slice(0, 3));
        
        resolve({
          dominantColors,
          palette,
          averageColor
        });
        
      } catch (error) {
        reject(error);
      }
    };
    
    img.onerror = () => reject(new Error('Failed to load image'));
    
    // Create object URL for the image
    const url = URL.createObjectURL(imageFile);
    img.src = url;
  });
}

// Generate harmonious palette from extracted colors
function generateHarmoniousPalette(dominantColors: ExtractedColor[]): ExtractedColor[] {
  const palette: ExtractedColor[] = [];
  
  // Add the most dominant color as primary
  if (dominantColors.length > 0) {
    palette.push(dominantColors[0]);
  }
  
  // Generate complementary and analogous colors
  for (const color of dominantColors.slice(0, 2)) {
    const hsl = color.hsl;
    
    // Complementary color
    const compHue = (hsl.h + 180) % 360;
    const compColor = hslToRgb(compHue, hsl.s, hsl.l);
    palette.push({
      hex: rgbToHex(compColor.r, compColor.g, compColor.b),
      rgb: compColor,
      hsl: { h: compHue, s: hsl.s, l: hsl.l },
      frequency: color.frequency * 0.7
    });
    
    // Analogous colors
    const analogous1 = (hsl.h + 30) % 360;
    const analogous2 = (hsl.h - 30 + 360) % 360;
    
    const analog1Color = hslToRgb(analogous1, hsl.s * 0.8, hsl.l);
    const analog2Color = hslToRgb(analogous2, hsl.s * 0.8, hsl.l);
    
    palette.push({
      hex: rgbToHex(analog1Color.r, analog1Color.g, analog1Color.b),
      rgb: analog1Color,
      hsl: { h: analogous1, s: Math.round(hsl.s * 0.8), l: hsl.l },
      frequency: color.frequency * 0.5
    });
    
    palette.push({
      hex: rgbToHex(analog2Color.r, analog2Color.g, analog2Color.b),
      rgb: analog2Color,
      hsl: { h: analogous2, s: Math.round(hsl.s * 0.8), l: hsl.l },
      frequency: color.frequency * 0.5
    });
  }
  
  return palette.slice(0, 5); // Return top 5 colors
}

// Convert HSL to RGB
function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  h /= 360;
  s /= 100;
  l /= 100;
  
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1/6) return p + (q - p) * 6 * t;
    if (t < 1/2) return q;
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
  };
  
  let r, g, b;
  
  if (s === 0) {
    r = g = b = l; // achromatic
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }
  
  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255)
  };
}