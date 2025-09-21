import React, { useState, useMemo } from 'react';
import toast from 'react-hot-toast';

interface ColorData {
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

interface WCAGAlternativesProps {
  originalPalette: ColorData[];
  onSelectAlternative: (palette: ColorData[]) => void;
}

const WCAGAlternatives: React.FC<WCAGAlternativesProps> = ({ originalPalette, onSelectAlternative }) => {
  const [selectedLevel, setSelectedLevel] = useState<'AA' | 'AAA'>('AA');
  const [showColorBlindness, setShowColorBlindness] = useState(false);

  // Utility functions (moved to top to avoid hoisting issues)
  const hslToRgb = (h: number, s: number, l: number): { r: number; g: number; b: number } => {
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
      r = g = b = l;
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
  };

  const rgbToHex = (r: number, g: number, b: number): string => {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  };

  const calculateContrast = (color1: { r: number; g: number; b: number }, color2: { r: number; g: number; b: number }): number => {
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
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`Copied ${text} to clipboard!`);
    } catch (error) {
      toast.error('Failed to copy to clipboard');
    }
  };

  // Generate WCAG compliant alternatives
  const wcagAlternatives = useMemo(() => {
    const generateCompliantColor = (originalColor: ColorData, targetLevel: 'AA' | 'AAA'): ColorData => {
      const targetContrast = targetLevel === 'AAA' ? 7.0 : 4.5;
      const { h, s } = originalColor.hsl;
      
      // Try different lightness values to achieve target contrast
      let bestL = originalColor.hsl.l;
      let bestContrast = originalColor.accessibility.contrastWithWhite;
      
      // Test lighter versions
      for (let l = originalColor.hsl.l; l <= 95; l += 5) {
        const testColor = hslToRgb(h, s, l);
        const contrast = calculateContrast(testColor, { r: 255, g: 255, b: 255 });
        if (contrast >= targetContrast && contrast > bestContrast) {
          bestL = l;
          bestContrast = contrast;
          break;
        }
      }
      
      // Test darker versions if lighter didn't work
      if (bestContrast < targetContrast) {
        for (let l = originalColor.hsl.l; l >= 5; l -= 5) {
          const testColor = hslToRgb(h, s, l);
          const contrast = calculateContrast(testColor, { r: 255, g: 255, b: 255 });
          if (contrast >= targetContrast && contrast > bestContrast) {
            bestL = l;
            bestContrast = contrast;
            break;
          }
        }
      }
      
      const newRgb = hslToRgb(h, s, bestL);
      const newHex = rgbToHex(newRgb.r, newRgb.g, newRgb.b);
      
      return {
        ...originalColor,
        hex: newHex,
        rgb: newRgb,
        hsl: { h, s, l: bestL },
        name: `${originalColor.name} (${targetLevel})`,
        accessibility: {
          contrastWithWhite: calculateContrast(newRgb, { r: 255, g: 255, b: 255 }),
          contrastWithBlack: calculateContrast(newRgb, { r: 0, g: 0, b: 0 }),
          wcagLevel: targetLevel
        }
      };
    };

    return {
      AA: originalPalette.map(color => generateCompliantColor(color, 'AA')),
      AAA: originalPalette.map(color => generateCompliantColor(color, 'AAA'))
    };
  }, [originalPalette]);

  // Generate color blindness friendly alternatives
  const colorBlindnessAlternatives = useMemo(() => {
    const generateColorBlindFriendly = (palette: ColorData[]): ColorData[] => {
      return palette.map(color => {
        const { h, s, l } = color.hsl;
        
        // Adjust colors to be more distinguishable for color blind users
        let newH = h;
        let newS = s;
        
        // Convert problematic red-green combinations
        if (h >= 0 && h <= 60) { // Red-yellow range
          newH = h < 30 ? 15 : 45; // Make more orange or yellow
          newS = Math.max(s, 70); // Increase saturation
        } else if (h >= 60 && h <= 180) { // Yellow-green range
          newH = h < 120 ? 75 : 150; // Make more yellow or cyan
          newS = Math.max(s, 60);
        }
        
        const newRgb = hslToRgb(newH, newS, l);
        const newHex = rgbToHex(newRgb.r, newRgb.g, newRgb.b);
        
        return {
          ...color,
          hex: newHex,
          rgb: newRgb,
          hsl: { h: newH, s: newS, l },
          name: `${color.name} (CB-Friendly)`,
          accessibility: {
            contrastWithWhite: calculateContrast(newRgb, { r: 255, g: 255, b: 255 }),
            contrastWithBlack: calculateContrast(newRgb, { r: 0, g: 0, b: 0 }),
            wcagLevel: color.accessibility.wcagLevel
          }
        };
      });
    };

    return generateColorBlindFriendly(originalPalette);
  }, [originalPalette]);



  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          🎯 WCAG Accessibility Alternatives
        </h3>
        <p className="text-gray-600">
          Automatically generated accessible versions of your color palette
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">WCAG Level:</label>
          <select
            value={selectedLevel}
            onChange={(e) => setSelectedLevel(e.target.value as 'AA' | 'AAA')}
            className="border border-gray-300 rounded-lg px-3 py-1 text-sm"
          >
            <option value="AA">AA (4.5:1)</option>
            <option value="AAA">AAA (7:1)</option>
          </select>
        </div>
        
        <button
          onClick={() => setShowColorBlindness(!showColorBlindness)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            showColorBlindness
              ? 'bg-purple-100 text-purple-700'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {showColorBlindness ? '👁️ Hide' : '👁️ Show'} Color Blind Friendly
        </button>
      </div>

      {/* Original Palette */}
      <div className="mb-8">
        <h4 className="font-medium text-gray-900 mb-3">Original Palette</h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {originalPalette.map((color, index) => (
            <div key={index} className="text-center">
              <div
                className="w-full h-16 rounded-lg cursor-pointer border-2 border-gray-200 hover:border-gray-300 transition-colors"
                style={{ backgroundColor: color.hex }}
                onClick={() => copyToClipboard(color.hex)}
                title={`${color.name}: ${color.hex}`}
              />
              <p className="text-xs text-gray-600 mt-1">{color.name}</p>
              <p className="text-xs font-mono text-gray-500">{color.hex}</p>
              <span className={`inline-block px-2 py-1 rounded text-xs font-medium mt-1 ${
                color.accessibility.wcagLevel === 'AAA' 
                  ? 'bg-green-100 text-green-800'
                  : color.accessibility.wcagLevel === 'AA'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                {color.accessibility.wcagLevel}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* WCAG Compliant Alternative */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-medium text-gray-900">
            WCAG {selectedLevel} Compliant Version
          </h4>
          <button
            onClick={() => onSelectAlternative(wcagAlternatives[selectedLevel])}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Use This Palette
          </button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {wcagAlternatives[selectedLevel].map((color, index) => (
            <div key={index} className="text-center">
              <div
                className="w-full h-16 rounded-lg cursor-pointer border-2 border-green-200 hover:border-green-300 transition-colors"
                style={{ backgroundColor: color.hex }}
                onClick={() => copyToClipboard(color.hex)}
                title={`${color.name}: ${color.hex}`}
              />
              <p className="text-xs text-gray-600 mt-1">{color.name}</p>
              <p className="text-xs font-mono text-gray-500">{color.hex}</p>
              <span className="inline-block px-2 py-1 rounded text-xs font-medium mt-1 bg-green-100 text-green-800">
                {color.accessibility.wcagLevel}
              </span>
              <p className="text-xs text-gray-500">
                {color.accessibility.contrastWithWhite.toFixed(1)}:1
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Color Blindness Friendly Alternative */}
      {showColorBlindness && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-gray-900">
              Color Blindness Friendly Version
            </h4>
            <button
              onClick={() => onSelectAlternative(colorBlindnessAlternatives)}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Use This Palette
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {colorBlindnessAlternatives.map((color, index) => (
              <div key={index} className="text-center">
                <div
                  className="w-full h-16 rounded-lg cursor-pointer border-2 border-purple-200 hover:border-purple-300 transition-colors"
                  style={{ backgroundColor: color.hex }}
                  onClick={() => copyToClipboard(color.hex)}
                  title={`${color.name}: ${color.hex}`}
                />
                <p className="text-xs text-gray-600 mt-1">{color.name}</p>
                <p className="text-xs font-mono text-gray-500">{color.hex}</p>
                <span className="inline-block px-2 py-1 rounded text-xs font-medium mt-1 bg-purple-100 text-purple-800">
                  CB-Friendly
                </span>
              </div>
            ))}
          </div>
          
          <div className="mt-4 p-4 bg-purple-50 rounded-lg">
            <h5 className="font-medium text-purple-900 mb-2">About Color Blindness Accessibility:</h5>
            <ul className="text-sm text-purple-800 space-y-1">
              <li>• Adjusted red-green combinations for deuteranopia/protanopia</li>
              <li>• Increased color saturation for better distinction</li>
              <li>• Maintained overall color harmony and brand feel</li>
              <li>• ~8% of men and ~0.5% of women have color vision deficiency</li>
            </ul>
          </div>
        </div>
      )}

      {/* Information Panel */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h5 className="font-medium text-blue-900 mb-2">📚 WCAG Contrast Requirements:</h5>
        <div className="text-sm text-blue-800 space-y-1">
          <p><strong>AA Level (4.5:1):</strong> Minimum for normal text, good for most use cases</p>
          <p><strong>AAA Level (7:1):</strong> Enhanced contrast, recommended for critical interfaces</p>
          <p><strong>Large Text:</strong> 18pt+ or 14pt+ bold requires 3:1 (AA) or 4.5:1 (AAA)</p>
        </div>
      </div>
    </div>
  );
};

export default WCAGAlternatives;