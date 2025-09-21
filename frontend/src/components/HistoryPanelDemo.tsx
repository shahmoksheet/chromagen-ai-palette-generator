import React, { useState, useCallback } from 'react';
import HistoryPanel from './HistoryPanel';
import { ColorPalette, GenerationOptions } from '../types/color';
import { Palette, Lightbulb } from 'lucide-react';

// Demo palettes with various characteristics for testing
const demoPalettes: ColorPalette[] = [
  {
    id: 'palette-1',
    name: 'Ocean Depths',
    prompt: 'Deep ocean colors with excellent accessibility',
    colors: [
      {
        hex: '#0F172A',
        rgb: { r: 15, g: 23, b: 42 },
        hsl: { h: 222, s: 47, l: 11 },
        name: 'Deep Navy',
        category: 'primary',
        usage: 'Primary text and headers',
        accessibility: { contrastWithWhite: 16.78, contrastWithBlack: 1.25, wcagLevel: 'AAA' },
      },
      {
        hex: '#1E40AF',
        rgb: { r: 30, g: 64, b: 175 },
        hsl: { h: 226, s: 71, l: 40 },
        name: 'Ocean Blue',
        category: 'primary',
        usage: 'Primary buttons and links',
        accessibility: { contrastWithWhite: 7.26, contrastWithBlack: 2.89, wcagLevel: 'AAA' },
      },
      {
        hex: '#0EA5E9',
        rgb: { r: 14, g: 165, b: 233 },
        hsl: { h: 199, s: 89, l: 48 },
        name: 'Sky Blue',
        category: 'secondary',
        usage: 'Secondary elements and highlights',
        accessibility: { contrastWithWhite: 4.56, contrastWithBlack: 4.61, wcagLevel: 'AA' },
      },
      {
        hex: '#06B6D4',
        rgb: { r: 6, g: 182, b: 212 },
        hsl: { h: 189, s: 94, l: 43 },
        name: 'Cyan',
        category: 'accent',
        usage: 'Accent colors and notifications',
        accessibility: { contrastWithWhite: 3.82, contrastWithBlack: 5.50, wcagLevel: 'AA' },
      },
    ],
    accessibilityScore: {
      overallScore: 'AAA',
      contrastRatios: [],
      colorBlindnessCompatible: true,
      recommendations: ['Excellent accessibility - all colors meet AAA standards'],
      passedChecks: 4,
      totalChecks: 4,
    },
    createdAt: new Date('2024-01-20T10:30:00Z'),
    updatedAt: new Date('2024-01-20T10:30:00Z'),
  },
  {
    id: 'palette-2',
    name: 'Sunset Vibes',
    prompt: 'Warm sunset colors for creative projects',
    colors: [
      {
        hex: '#F97316',
        rgb: { r: 249, g: 115, b: 22 },
        hsl: { h: 25, s: 95, l: 53 },
        name: 'Sunset Orange',
        category: 'primary',
        usage: 'Primary accent color',
        accessibility: { contrastWithWhite: 3.21, contrastWithBlack: 6.54, wcagLevel: 'FAIL' },
      },
      {
        hex: '#EF4444',
        rgb: { r: 239, g: 68, b: 68 },
        hsl: { h: 0, s: 84, l: 60 },
        name: 'Coral Red',
        category: 'accent',
        usage: 'Error states and warnings',
        accessibility: { contrastWithWhite: 3.58, contrastWithBlack: 5.87, wcagLevel: 'FAIL' },
      },
      {
        hex: '#FBBF24',
        rgb: { r: 251, g: 191, b: 36 },
        hsl: { h: 43, s: 96, l: 56 },
        name: 'Golden Yellow',
        category: 'secondary',
        usage: 'Highlights and attention',
        accessibility: { contrastWithWhite: 1.95, contrastWithBlack: 10.78, wcagLevel: 'FAIL' },
      },
    ],
    accessibilityScore: {
      overallScore: 'FAIL',
      contrastRatios: [],
      colorBlindnessCompatible: false,
      recommendations: [
        'All colors fail WCAG contrast requirements with white backgrounds',
        'Consider darkening colors or using them only on dark backgrounds',
        'Add neutral colors for better text readability',
      ],
      passedChecks: 0,
      totalChecks: 3,
    },
    createdAt: new Date('2024-01-18T15:45:00Z'),
    updatedAt: new Date('2024-01-18T15:45:00Z'),
  },
  {
    id: 'palette-3',
    name: 'Forest Harmony',
    prompt: 'Natural forest greens with earth tones',
    colors: [
      {
        hex: '#059669',
        rgb: { r: 5, g: 150, b: 105 },
        hsl: { h: 160, s: 94, l: 30 },
        name: 'Forest Green',
        category: 'primary',
        usage: 'Primary brand color',
        accessibility: { contrastWithWhite: 7.15, contrastWithBlack: 2.94, wcagLevel: 'AAA' },
      },
      {
        hex: '#10B981',
        rgb: { r: 16, g: 185, b: 129 },
        hsl: { h: 160, s: 84, l: 39 },
        name: 'Emerald',
        category: 'secondary',
        usage: 'Success states',
        accessibility: { contrastWithWhite: 3.92, contrastWithBlack: 5.36, wcagLevel: 'AA' },
      },
      {
        hex: '#84CC16',
        rgb: { r: 132, g: 204, b: 22 },
        hsl: { h: 84, s: 81, l: 44 },
        name: 'Lime Green',
        category: 'accent',
        usage: 'Call-to-action elements',
        accessibility: { contrastWithWhite: 2.89, contrastWithBlack: 7.27, wcagLevel: 'FAIL' },
      },
      {
        hex: '#A3A3A3',
        rgb: { r: 163, g: 163, b: 163 },
        hsl: { h: 0, s: 0, l: 64 },
        name: 'Stone Gray',
        category: 'secondary',
        usage: 'Secondary text and borders',
        accessibility: { contrastWithWhite: 2.85, contrastWithBlack: 7.37, wcagLevel: 'FAIL' },
      },
      {
        hex: '#78716C',
        rgb: { r: 120, g: 113, b: 108 },
        hsl: { h: 25, s: 5, l: 45 },
        name: 'Warm Gray',
        category: 'secondary',
        usage: 'Subtle backgrounds',
        accessibility: { contrastWithWhite: 5.89, contrastWithBlack: 3.57, wcagLevel: 'AA' },
      },
    ],
    accessibilityScore: {
      overallScore: 'AA',
      contrastRatios: [],
      colorBlindnessCompatible: true,
      recommendations: [
        'Most colors meet AA standards',
        'Consider darkening lime green and stone gray for better contrast',
        'Good color blindness compatibility',
      ],
      passedChecks: 3,
      totalChecks: 5,
    },
    createdAt: new Date('2024-01-15T09:20:00Z'),
    updatedAt: new Date('2024-01-19T14:10:00Z'),
  },
  {
    id: 'palette-4',
    name: 'Minimalist Mono',
    colors: [
      {
        hex: '#000000',
        rgb: { r: 0, g: 0, b: 0 },
        hsl: { h: 0, s: 0, l: 0 },
        name: 'Pure Black',
        category: 'primary',
        usage: 'Text and strong contrast',
        accessibility: { contrastWithWhite: 21, contrastWithBlack: 1, wcagLevel: 'AAA' },
      },
      {
        hex: '#FFFFFF',
        rgb: { r: 255, g: 255, b: 255 },
        hsl: { h: 0, s: 0, l: 100 },
        name: 'Pure White',
        category: 'primary',
        usage: 'Backgrounds and negative space',
        accessibility: { contrastWithWhite: 1, contrastWithBlack: 21, wcagLevel: 'AAA' },
      },
      {
        hex: '#6B7280',
        rgb: { r: 107, g: 114, b: 128 },
        hsl: { h: 220, s: 9, l: 46 },
        name: 'Cool Gray',
        category: 'secondary',
        usage: 'Secondary text and subtle elements',
        accessibility: { contrastWithWhite: 5.74, contrastWithBlack: 3.66, wcagLevel: 'AA' },
      },
    ],
    accessibilityScore: {
      overallScore: 'AAA',
      contrastRatios: [],
      colorBlindnessCompatible: true,
      recommendations: ['Perfect accessibility with maximum contrast ratios'],
      passedChecks: 3,
      totalChecks: 3,
    },
    createdAt: new Date('2024-01-22T11:15:00Z'),
    updatedAt: new Date('2024-01-22T11:15:00Z'),
  },
  {
    id: 'palette-5',
    name: 'Retro Gaming',
    prompt: 'Nostalgic 8-bit inspired color palette',
    colors: [
      {
        hex: '#8B5CF6',
        rgb: { r: 139, g: 92, b: 246 },
        hsl: { h: 258, s: 90, l: 66 },
        name: 'Pixel Purple',
        category: 'primary',
        usage: 'Primary UI elements',
        accessibility: { contrastWithWhite: 4.89, contrastWithBlack: 4.29, wcagLevel: 'AA' },
      },
      {
        hex: '#EC4899',
        rgb: { r: 236, g: 72, b: 153 },
        hsl: { h: 330, s: 81, l: 60 },
        name: 'Neon Pink',
        category: 'accent',
        usage: 'Highlights and special effects',
        accessibility: { contrastWithWhite: 3.47, contrastWithBlack: 6.05, wcagLevel: 'FAIL' },
      },
      {
        hex: '#06FFA5',
        rgb: { r: 6, g: 255, b: 165 },
        hsl: { h: 158, s: 100, l: 51 },
        name: 'Cyber Green',
        category: 'accent',
        usage: 'Success indicators',
        accessibility: { contrastWithWhite: 1.89, contrastWithBlack: 11.12, wcagLevel: 'FAIL' },
      },
      {
        hex: '#FFD700',
        rgb: { r: 255, g: 215, b: 0 },
        hsl: { h: 51, s: 100, l: 50 },
        name: 'Gold Coin',
        category: 'secondary',
        usage: 'Rewards and achievements',
        accessibility: { contrastWithWhite: 1.73, contrastWithBlack: 12.14, wcagLevel: 'FAIL' },
      },
    ],
    accessibilityScore: {
      overallScore: 'AA',
      contrastRatios: [],
      colorBlindnessCompatible: false,
      recommendations: [
        'Only purple meets accessibility standards',
        'Bright colors may cause issues for users with photosensitivity',
        'Consider adding darker variants for text use',
      ],
      passedChecks: 1,
      totalChecks: 4,
    },
    createdAt: new Date('2024-01-12T16:30:00Z'),
    updatedAt: new Date('2024-01-12T16:30:00Z'),
  },
];

interface ActionLog {
  id: string;
  action: string;
  palette: string;
  timestamp: Date;
  details?: string;
}

const HistoryPanelDemo: React.FC = () => {
  const [palettes, setPalettes] = useState<ColorPalette[]>(demoPalettes);
  const [currentPalette, setCurrentPalette] = useState<ColorPalette | null>(null);
  const [actionLog, setActionLog] = useState<ActionLog[]>([]);

  const addToLog = useCallback((action: string, palette: string, details?: string) => {
    const logEntry: ActionLog = {
      id: `${Date.now()}-${Math.random()}`,
      action,
      palette,
      timestamp: new Date(),
      details,
    };
    setActionLog(prev => [logEntry, ...prev].slice(0, 10));
  }, []);

  const handlePaletteSelect = useCallback((palette: ColorPalette) => {
    setCurrentPalette(palette);
    addToLog('Selected', palette.name);
  }, [addToLog]);

  const handlePaletteDelete = useCallback((paletteId: string) => {
    const palette = palettes.find(p => p.id === paletteId);
    if (palette) {
      setPalettes(prev => prev.filter(p => p.id !== paletteId));
      if (currentPalette?.id === paletteId) {
        setCurrentPalette(null);
      }
      addToLog('Deleted', palette.name);
    }
  }, [palettes, currentPalette, addToLog]);

  const handlePaletteRegenerate = useCallback((palette: ColorPalette, _options?: Partial<GenerationOptions>) => {
    // Simulate regeneration by creating a variation
    const newPalette: ColorPalette = {
      ...palette,
      id: `${palette.id}-regen-${Date.now()}`,
      name: `${palette.name} (Regenerated)`,
      createdAt: new Date(),
      updatedAt: new Date(),
      colors: palette.colors.map(color => ({
        ...color,
        // Slightly modify colors to simulate regeneration
        hex: adjustColorBrightness(color.hex, Math.random() * 0.2 - 0.1),
      })),
    };
    
    setPalettes(prev => [newPalette, ...prev]);
    addToLog('Regenerated', palette.name, `Created "${newPalette.name}"`);
  }, [addToLog]);

  const handlePaletteVariation = useCallback((palette: ColorPalette, variationType: 'lighter' | 'darker' | 'complementary') => {
    const adjustment = variationType === 'lighter' ? 0.2 : variationType === 'darker' ? -0.2 : 0;
    const newPalette: ColorPalette = {
      ...palette,
      id: `${palette.id}-${variationType}-${Date.now()}`,
      name: `${palette.name} (${variationType.charAt(0).toUpperCase() + variationType.slice(1)})`,
      createdAt: new Date(),
      updatedAt: new Date(),
      colors: palette.colors.map(color => ({
        ...color,
        hex: variationType === 'complementary' 
          ? getComplementaryColor(color.hex)
          : adjustColorBrightness(color.hex, adjustment),
      })),
    };
    
    setPalettes(prev => [newPalette, ...prev]);
    addToLog('Created Variation', palette.name, `${variationType} variation`);
  }, [addToLog]);

  const handlePaletteDuplicate = useCallback((palette: ColorPalette) => {
    const newPalette: ColorPalette = {
      ...palette,
      id: `${palette.id}-copy-${Date.now()}`,
      name: `${palette.name} (Copy)`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    setPalettes(prev => [newPalette, ...prev]);
    addToLog('Duplicated', palette.name);
  }, [addToLog]);

  // Helper function to adjust color brightness
  const adjustColorBrightness = (hex: string, adjustment: number): string => {
    const num = parseInt(hex.replace('#', ''), 16);
    const r = Math.max(0, Math.min(255, (num >> 16) + Math.round(adjustment * 255)));
    const g = Math.max(0, Math.min(255, ((num >> 8) & 0x00FF) + Math.round(adjustment * 255)));
    const b = Math.max(0, Math.min(255, (num & 0x0000FF) + Math.round(adjustment * 255)));
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
  };

  // Helper function to get complementary color
  const getComplementaryColor = (hex: string): string => {
    const num = parseInt(hex.replace('#', ''), 16);
    const r = 255 - (num >> 16);
    const g = 255 - ((num >> 8) & 0x00FF);
    const b = 255 - (num & 0x0000FF);
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
  };

  const formatTimestamp = (timestamp: Date) => {
    return timestamp.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            History Panel Demo
          </h1>
          <p className="text-lg text-gray-600 max-w-4xl">
            This demo showcases the HistoryPanel component with a collection of sample palettes. 
            Test search, filtering, sorting, pagination, favorites, and all palette management features.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* History Panel */}
          <div className="lg:col-span-3">
            <HistoryPanel
              palettes={palettes}
              currentPalette={currentPalette}
              onPaletteSelect={handlePaletteSelect}
              onPaletteDelete={handlePaletteDelete}
              onPaletteRegenerate={handlePaletteRegenerate}
              onPaletteVariation={handlePaletteVariation}
              onPaletteDuplicate={handlePaletteDuplicate}
            />
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Current Palette */}
            {currentPalette && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Palette className="w-5 h-5 mr-2 text-purple-600" />
                  Current Palette
                </h3>
                
                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium text-gray-900">{currentPalette.name}</h4>
                    {currentPalette.prompt && (
                      <p className="text-sm text-gray-600 mt-1">"{currentPalette.prompt}"</p>
                    )}
                  </div>
                  
                  <div className="flex h-8 rounded overflow-hidden">
                    {currentPalette.colors.map((color, index) => (
                      <div
                        key={index}
                        className="flex-1"
                        style={{ backgroundColor: color.hex }}
                        title={`${color.name}: ${color.hex}`}
                      />
                    ))}
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">{currentPalette.colors.length} colors</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      currentPalette.accessibilityScore.overallScore === 'AAA'
                        ? 'bg-green-100 text-green-800'
                        : currentPalette.accessibilityScore.overallScore === 'AA'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {currentPalette.accessibilityScore.overallScore}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Action Log */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Lightbulb className="w-5 h-5 mr-2 text-yellow-600" />
                Action Log
              </h3>
              
              {actionLog.length === 0 ? (
                <p className="text-gray-500 text-sm">No actions yet. Try interacting with the palettes!</p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {actionLog.map((log) => (
                    <div key={log.id} className="text-sm border-l-2 border-purple-200 pl-3 py-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-900">{log.action}</span>
                        <span className="text-xs text-gray-500">{formatTimestamp(log.timestamp)}</span>
                      </div>
                      <div className="text-gray-600">{log.palette}</div>
                      {log.details && (
                        <div className="text-xs text-gray-500 mt-1">{log.details}</div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Demo Features */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Demo Features
              </h3>
              
              <div className="space-y-3 text-sm">
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-purple-600 rounded-full mt-2 flex-shrink-0" />
                  <div>
                    <strong>Search & Filter:</strong> Search by name, prompt, or colors. Filter by accessibility, color count, date, and favorites.
                  </div>
                </div>
                
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-purple-600 rounded-full mt-2 flex-shrink-0" />
                  <div>
                    <strong>Sorting:</strong> Sort by name, creation date, update date, or accessibility score.
                  </div>
                </div>
                
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-purple-600 rounded-full mt-2 flex-shrink-0" />
                  <div>
                    <strong>View Modes:</strong> Switch between grid and list views for different browsing experiences.
                  </div>
                </div>
                
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-purple-600 rounded-full mt-2 flex-shrink-0" />
                  <div>
                    <strong>Favorites:</strong> Star palettes to mark as favorites and filter by them.
                  </div>
                </div>
                
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-purple-600 rounded-full mt-2 flex-shrink-0" />
                  <div>
                    <strong>Actions:</strong> View, duplicate, regenerate, create variations, and delete palettes.
                  </div>
                </div>
                
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-purple-600 rounded-full mt-2 flex-shrink-0" />
                  <div>
                    <strong>Pagination:</strong> Handles large collections with configurable items per page.
                  </div>
                </div>
              </div>
            </div>

            {/* Statistics */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Collection Stats
              </h3>
              
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Palettes:</span>
                  <span className="font-medium">{palettes.length}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">AAA Accessible:</span>
                  <span className="font-medium text-green-600">
                    {palettes.filter(p => p.accessibilityScore.overallScore === 'AAA').length}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">AA Accessible:</span>
                  <span className="font-medium text-yellow-600">
                    {palettes.filter(p => p.accessibilityScore.overallScore === 'AA').length}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Need Improvement:</span>
                  <span className="font-medium text-red-600">
                    {palettes.filter(p => p.accessibilityScore.overallScore === 'FAIL').length}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Avg Colors per Palette:</span>
                  <span className="font-medium">
                    {Math.round(palettes.reduce((sum, p) => sum + p.colors.length, 0) / palettes.length)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HistoryPanelDemo;