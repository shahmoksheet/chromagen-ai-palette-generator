import React from 'react';
import ColorPalette from './ColorPalette';
import { ColorPalette as ColorPaletteType } from '../types/color';

const ColorPaletteDemo: React.FC = () => {
  const mockPalette: ColorPaletteType = {
    id: 'demo-palette',
    name: 'Vibrant Sunset',
    prompt: 'A warm and energetic palette inspired by tropical sunsets',
    colors: [
      {
        hex: '#FF6B6B',
        rgb: { r: 255, g: 107, b: 107 },
        hsl: { h: 0, s: 100, l: 71 },
        name: 'Coral Red',
        category: 'primary',
        usage: 'Use for primary buttons and call-to-action elements',
        accessibility: {
          contrastWithWhite: 2.1,
          contrastWithBlack: 10.0,
          wcagLevel: 'AA',
        },
      },
      {
        hex: '#4ECDC4',
        rgb: { r: 78, g: 205, b: 196 },
        hsl: { h: 176, s: 57, l: 55 },
        name: 'Turquoise',
        category: 'secondary',
        usage: 'Perfect for secondary actions and highlights',
        accessibility: {
          contrastWithWhite: 1.8,
          contrastWithBlack: 11.7,
          wcagLevel: 'AAA',
        },
      },
      {
        hex: '#FFE66D',
        rgb: { r: 255, g: 230, b: 109 },
        hsl: { h: 50, s: 100, l: 71 },
        name: 'Sunny Yellow',
        category: 'accent',
        usage: 'Use sparingly for emphasis and warnings',
        accessibility: {
          contrastWithWhite: 1.2,
          contrastWithBlack: 17.5,
          wcagLevel: 'FAIL',
        },
      },
    ],
    accessibilityScore: {
      overallScore: 'AA',
      contrastRatios: [
        {
          color1: '#FF6B6B',
          color2: '#FFFFFF',
          ratio: 2.1,
          level: 'AA',
          isTextReadable: true,
        },
      ],
      colorBlindnessCompatible: true,
      recommendations: [
        'Consider using darker shades for better contrast',
        'Test with color blindness simulators',
      ],
      passedChecks: 2,
      totalChecks: 3,
    },
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  const handleColorCopy = (color: any, format: string) => {
    console.log(`Copied ${color.name} in ${format} format`);
  };

  return (
    <div className="p-8 bg-gray-100 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Color Palette Demo</h1>
        <ColorPalette 
          palette={mockPalette} 
          onColorCopy={handleColorCopy}
          showAccessibilityInfo={true}
        />
      </div>
    </div>
  );
};

export default ColorPaletteDemo;