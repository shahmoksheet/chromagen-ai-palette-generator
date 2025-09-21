import React from 'react';
import { motion } from 'framer-motion';
import { Copy, Check } from 'lucide-react';
import { Color } from '../types/color';
import { useScreenSize, useMobileInteractions, getResponsiveGridClasses } from '../utils/responsive';
import { useState } from 'react';

interface ResponsiveColorGridProps {
  colors: Color[];
  onColorClick?: (color: Color) => void;
  showCopyFeedback?: boolean;
  className?: string;
}

const ResponsiveColorGrid: React.FC<ResponsiveColorGridProps> = ({
  colors,
  onColorClick,
  showCopyFeedback = true,
  className = '',
}) => {
  const { isMobile, isTablet } = useScreenSize();
  const { getTouchProps } = useMobileInteractions();
  const [copiedColor, setCopiedColor] = useState<string | null>(null);

  const handleColorClick = async (color: Color) => {
    onColorClick?.(color);

    if (showCopyFeedback) {
      try {
        await navigator.clipboard.writeText(color.hex);
        setCopiedColor(color.hex);
        setTimeout(() => setCopiedColor(null), 2000);
      } catch (error) {
        console.error('Failed to copy color:', error);
      }
    }
  };

  // Responsive grid configuration
  const gridClasses = getResponsiveGridClasses(
    2,  // Mobile: 2 columns
    3,  // Tablet: 3 columns  
    6,  // Desktop: 6 columns
    8   // XL: 8 columns
  );

  // Responsive color card height
  const getColorCardHeight = () => {
    if (isMobile) return 'h-20 sm:h-24';
    if (isTablet) return 'h-24 md:h-28';
    return 'h-24 lg:h-32';
  };

  // Responsive text sizes
  const getTextSizes = () => ({
    name: isMobile ? 'text-sm' : 'text-base',
    hex: isMobile ? 'text-xs' : 'text-sm',
    category: isMobile ? 'text-xs' : 'text-xs',
  });

  const textSizes = getTextSizes();
  const colorCardHeight = getColorCardHeight();

  return (
    <div className={`grid ${gridClasses} gap-3 sm:gap-4 lg:gap-6 ${className}`}>
      {colors.map((color, index) => (
        <motion.div
          key={`${color.hex}-${index}`}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.05, duration: 0.2 }}
          className="text-center"
        >
          {/* Color Swatch */}
          <div className="relative">
            <motion.div
              {...getTouchProps(() => handleColorClick(color))}
              className={`${colorCardHeight} w-full rounded-lg cursor-pointer transition-all duration-200 border border-gray-200 shadow-sm hover:shadow-md active:scale-95`}
              style={{ backgroundColor: color.hex }}
              whileHover={{ scale: isMobile ? 1 : 1.05 }}
              whileTap={{ scale: 0.95 }}
              title={`${color.name} - ${color.hex} - Click to copy`}
            />

            {/* Copy Feedback */}
            {copiedColor === color.hex && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center"
              >
                <div className="bg-white rounded-full p-2">
                  <Check className="w-4 h-4 text-green-600" />
                </div>
              </motion.div>
            )}

            {/* Mobile Copy Icon */}
            {isMobile && (
              <div className="absolute top-2 right-2 bg-white bg-opacity-90 rounded-full p-1">
                <Copy className="w-3 h-3 text-gray-600" />
              </div>
            )}
          </div>

          {/* Color Information */}
          <div className="mt-2 space-y-1">
            <div className={`font-medium text-gray-900 truncate ${textSizes.name}`}>
              {color.name}
            </div>
            <div className={`text-gray-600 font-mono ${textSizes.hex}`}>
              {color.hex}
            </div>
            <div className={`text-gray-500 capitalize ${textSizes.category}`}>
              {color.category}
            </div>
            
            {/* Mobile-specific accessibility indicator */}
            {isMobile && color.accessibility && (
              <div className="flex items-center justify-center mt-1">
                <div className={`w-2 h-2 rounded-full ${
                  color.accessibility.wcagLevel === 'AAA' ? 'bg-green-500' :
                  color.accessibility.wcagLevel === 'AA' ? 'bg-yellow-500' :
                  'bg-red-500'
                }`} />
              </div>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default ResponsiveColorGrid;