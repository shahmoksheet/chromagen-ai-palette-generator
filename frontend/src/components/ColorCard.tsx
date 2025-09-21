import React, { useState } from 'react';
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

interface ColorCardProps {
  color: ColorData;
  showDetails?: boolean;
}

const ColorCard: React.FC<ColorCardProps> = ({ color, showDetails = true }) => {
  const [activeFormat, setActiveFormat] = useState<'hex' | 'rgb' | 'hsl' | 'css'>('hex');
  const [showTooltip, setShowTooltip] = useState(false);

  const formatColor = (format: string) => {
    switch (format) {
      case 'hex':
        return color.hex;
      case 'rgb':
        return `rgb(${color.rgb.r}, ${color.rgb.g}, ${color.rgb.b})`;
      case 'hsl':
        return `hsl(${Math.round(color.hsl.h)}, ${Math.round(color.hsl.s)}%, ${Math.round(color.hsl.l)}%)`;
      case 'css':
        return `--color-${color.category}: ${color.hex};`;
      default:
        return color.hex;
    }
  };

  const copyToClipboard = async (text: string, format: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`Copied ${format.toUpperCase()} to clipboard!`);
    } catch (error) {
      toast.error('Failed to copy to clipboard');
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'primary':
        return '🎯';
      case 'secondary':
        return '🔄';
      case 'accent':
        return '✨';
      case 'neutral':
        return '⚪';
      case 'background':
        return '🖼️';
      default:
        return '🎨';
    }
  };

  const getContrastBadge = (wcagLevel: string) => {
    const badgeClass = wcagLevel === 'AAA' 
      ? 'bg-green-100 text-green-800' 
      : wcagLevel === 'AA' 
      ? 'bg-yellow-100 text-yellow-800' 
      : 'bg-red-100 text-red-800';
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${badgeClass}`}>
        WCAG {wcagLevel}
      </span>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
      {/* Color Preview */}
      <div 
        className="h-24 sm:h-32 cursor-pointer relative group"
        style={{ backgroundColor: color.hex }}
        onClick={() => copyToClipboard(formatColor(activeFormat), activeFormat)}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        {showTooltip && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <span className="text-white text-sm font-medium">
              Click to copy {activeFormat.toUpperCase()}
            </span>
          </div>
        )}
        
        {/* Category Badge */}
        <div className="absolute top-2 left-2">
          <span className="bg-white bg-opacity-90 px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
            {getCategoryIcon(color.category)}
            {color.category}
          </span>
        </div>
      </div>

      {showDetails && (
        <div className="p-4">
          {/* Color Name */}
          <h3 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">
            {color.name}
          </h3>

          {/* Format Selector */}
          <div className="flex flex-wrap gap-1 mb-3">
            {['hex', 'rgb', 'hsl', 'css'].map((format) => (
              <button
                key={format}
                onClick={() => setActiveFormat(format as any)}
                className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                  activeFormat === format
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {format.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Color Value */}
          <div 
            className="bg-gray-50 rounded-lg p-2 mb-3 cursor-pointer hover:bg-gray-100 transition-colors"
            onClick={() => copyToClipboard(formatColor(activeFormat), activeFormat)}
          >
            <code className="text-sm font-mono text-gray-800 break-all">
              {formatColor(activeFormat)}
            </code>
          </div>

          {/* Usage Description */}
          <p className="text-sm text-gray-600 mb-3 leading-relaxed">
            {color.usage}
          </p>

          {/* Accessibility Info */}
          <div className="flex items-center justify-between">
            {getContrastBadge(color.accessibility.wcagLevel)}
            <div className="text-xs text-gray-500">
              Contrast: {color.accessibility.contrastWithWhite.toFixed(1)}:1
            </div>
          </div>

          {/* Quick Copy Buttons */}
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => copyToClipboard(color.hex, 'hex')}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs py-2 px-3 rounded-lg transition-colors"
            >
              Copy HEX
            </button>
            <button
              onClick={() => copyToClipboard(`rgb(${color.rgb.r}, ${color.rgb.g}, ${color.rgb.b})`, 'rgb')}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs py-2 px-3 rounded-lg transition-colors"
            >
              Copy RGB
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ColorCard;