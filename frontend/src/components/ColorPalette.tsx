import React, { useState, useCallback, useMemo, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Check, Eye, EyeOff, Info, Palette } from 'lucide-react';
import { ColorPalette as ColorPaletteType, Color } from '../types/color';
import { formatColorValue } from '../utils/colorConversion';

interface ColorPaletteProps {
  palette: ColorPaletteType;
  showAccessibilityInfo?: boolean;
  onColorCopy?: (color: Color, format: 'hex' | 'rgb' | 'hsl') => void;
  className?: string;
}

type ColorFormat = 'hex' | 'rgb' | 'hsl';

const ColorPalette: React.FC<ColorPaletteProps> = memo(({
  palette,
  showAccessibilityInfo = true,
  onColorCopy,
  className = '',
}) => {
  const [colorFormat, setColorFormat] = useState<ColorFormat>('hex');
  const [copiedColor, setCopiedColor] = useState<string | null>(null);
  const [showUsageRecommendations, setShowUsageRecommendations] = useState(true);
  const [hoveredColor, setHoveredColor] = useState<string | null>(null);

  // Group colors by category - memoized for performance
  const groupedColors = useMemo(() => {
    return palette.colors.reduce((acc, color) => {
      if (!acc[color.category]) {
        acc[color.category] = [];
      }
      acc[color.category].push(color);
      return acc;
    }, {} as Record<string, Color[]>);
  }, [palette.colors]);

  // Category order and display names
  const categoryOrder = ['primary', 'secondary', 'accent'] as const;
  const categoryNames = {
    primary: 'Primary Colors',
    secondary: 'Secondary Colors',
    accent: 'Accent Colors',
  };

  const handleColorCopy = useCallback(async (color: Color) => {
    const colorValue = formatColorValue(color.hex, colorFormat);
    
    try {
      await navigator.clipboard.writeText(colorValue);
      setCopiedColor(color.hex);
      onColorCopy?.(color, colorFormat);
      
      // Reset copied state after 2 seconds
      setTimeout(() => setCopiedColor(null), 2000);
    } catch (error) {
      console.error('Failed to copy color:', error);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = colorValue;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      
      setCopiedColor(color.hex);
      setTimeout(() => setCopiedColor(null), 2000);
    }
  }, [colorFormat, onColorCopy]);

  const getAccessibilityBadge = useCallback((color: Color) => {
    const level = color.accessibility.wcagLevel;
    const badgeColors = {
      'AAA': 'bg-green-100 text-green-800 border-green-200',
      'AA': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'FAIL': 'bg-red-100 text-red-800 border-red-200',
    };

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${badgeColors[level]}`}>
        {level}
      </span>
    );
  }, []);

  const getContrastInfo = useCallback((color: Color) => {
    const { contrastWithWhite, contrastWithBlack } = color.accessibility;
    const bestContrast = contrastWithWhite > contrastWithBlack ? 'white' : 'black';
    const bestRatio = Math.max(contrastWithWhite, contrastWithBlack);
    
    return {
      bestContrast,
      bestRatio: bestRatio.toFixed(2),
    };
  }, []);

  return (
    <div className={`w-full ${className}`}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Palette className="w-6 h-6 text-purple-600" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{palette.name}</h2>
              {palette.prompt && (
                <p className="text-sm text-gray-600 mt-1">"{palette.prompt}"</p>
              )}
            </div>
          </div>
          
          {/* Controls */}
          <div className="flex items-center space-x-4">
            {/* Usage Recommendations Toggle */}
            <button
              onClick={() => setShowUsageRecommendations(!showUsageRecommendations)}
              className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
              title={showUsageRecommendations ? 'Hide usage recommendations' : 'Show usage recommendations'}
            >
              {showUsageRecommendations ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
              <span>Usage Tips</span>
            </button>

            {/* Color Format Selector */}
            <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
              {(['hex', 'rgb', 'hsl'] as ColorFormat[]).map((format) => (
                <button
                  key={format}
                  onClick={() => setColorFormat(format)}
                  className={`px-3 py-1 text-sm font-medium rounded-md transition-all ${
                    colorFormat === format
                      ? 'bg-white text-purple-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {format.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Accessibility Overview */}
        {showAccessibilityInfo && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="bg-gray-50 rounded-lg p-4 border border-gray-200"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Info className="w-5 h-5 text-blue-600" />
                <div>
                  <h3 className="font-semibold text-gray-900">Accessibility Score</h3>
                  <p className="text-sm text-gray-600">
                    {palette.accessibilityScore.passedChecks} of {palette.accessibilityScore.totalChecks} checks passed
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${
                  palette.accessibilityScore.overallScore === 'AAA' 
                    ? 'bg-green-100 text-green-800 border-green-200'
                    : palette.accessibilityScore.overallScore === 'AA'
                    ? 'bg-yellow-100 text-yellow-800 border-yellow-200'
                    : 'bg-red-100 text-red-800 border-red-200'
                }`}>
                  {palette.accessibilityScore.overallScore}
                </span>
                {palette.accessibilityScore.colorBlindnessCompatible && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                    Color-blind friendly
                  </span>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Color Categories */}
      <div className="space-y-8">
        {categoryOrder.map((category) => {
          const colors = groupedColors[category];
          if (!colors || colors.length === 0) return null;

          return (
            <motion.div
              key={category}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="space-y-4"
            >
              <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                {categoryNames[category]}
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {colors.map((color, index) => {
                  const colorValue = formatColorValue(color.hex, colorFormat);
                  const isCopied = copiedColor === color.hex;
                  const isHovered = hoveredColor === color.hex;
                  const contrastInfo = getContrastInfo(color);

                  return (
                    <motion.div
                      key={`${color.hex}-${index}`}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ scale: 1.02 }}
                      className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-200"
                      onMouseEnter={() => setHoveredColor(color.hex)}
                      onMouseLeave={() => setHoveredColor(null)}
                    >
                      {/* Color Swatch */}
                      <div
                        className="h-24 w-full relative cursor-pointer group"
                        style={{ backgroundColor: color.hex }}
                        onClick={() => handleColorCopy(color)}
                      >
                        {/* Copy Overlay */}
                        <AnimatePresence>
                          {(isHovered || isCopied) && (
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              className={`absolute inset-0 flex items-center justify-center ${
                                contrastInfo.bestContrast === 'white' ? 'text-white' : 'text-black'
                              }`}
                              style={{
                                backgroundColor: `${color.hex}${isCopied ? 'CC' : '80'}`,
                              }}
                            >
                              {isCopied ? (
                                <motion.div
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  className="flex items-center space-x-2"
                                >
                                  <Check className="w-5 h-5" />
                                  <span className="font-medium">Copied!</span>
                                </motion.div>
                              ) : (
                                <motion.div
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  className="flex items-center space-x-2"
                                >
                                  <Copy className="w-4 h-4" />
                                  <span className="text-sm">Click to copy</span>
                                </motion.div>
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* Color Info */}
                      <div className="p-4 space-y-3">
                        {/* Color Name and Value */}
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-1">{color.name}</h4>
                          <button
                            onClick={() => handleColorCopy(color)}
                            className="text-sm font-mono text-gray-600 hover:text-purple-600 transition-colors"
                          >
                            {colorValue}
                          </button>
                        </div>

                        {/* Usage Recommendations */}
                        <AnimatePresence>
                          {showUsageRecommendations && color.usage && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="text-xs text-gray-600 bg-gray-50 rounded-md p-2"
                            >
                              <strong>Usage:</strong> {color.usage}
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {/* Accessibility Info */}
                        {showAccessibilityInfo && (
                          <div className="flex items-center justify-between">
                            {getAccessibilityBadge(color)}
                            <span className="text-xs text-gray-500">
                              Best with {contrastInfo.bestContrast} ({contrastInfo.bestRatio}:1)
                            </span>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Accessibility Recommendations */}
      {showAccessibilityInfo && palette.accessibilityScore.recommendations.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8 bg-amber-50 border border-amber-200 rounded-lg p-4"
        >
          <h4 className="font-semibold text-amber-900 mb-2 flex items-center">
            <Info className="w-4 h-4 mr-2" />
            Accessibility Recommendations
          </h4>
          <ul className="space-y-1">
            {palette.accessibilityScore.recommendations.map((recommendation, index) => (
              <li key={index} className="text-sm text-amber-800">
                • {recommendation}
              </li>
            ))}
          </ul>
        </motion.div>
      )}
    </div>
  );
});

ColorPalette.displayName = 'ColorPalette';

export default ColorPalette;