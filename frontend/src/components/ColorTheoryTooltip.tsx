import React from 'react';
import Tooltip from './Tooltip';

export interface ColorTheoryContent {
  title: string;
  description: string;
  examples?: string[];
  learnMoreUrl?: string;
}

export interface ColorTheoryTooltipProps {
  concept: 'complementary' | 'triadic' | 'analogous' | 'monochromatic' | 'tetradic' | 'contrast' | 'saturation' | 'hue' | 'lightness';
  children: React.ReactNode;
  className?: string;
}

const colorTheoryContent: Record<string, ColorTheoryContent> = {
  complementary: {
    title: 'Complementary Colors',
    description: 'Colors that are opposite each other on the color wheel. They create high contrast and vibrant looks when used together.',
    examples: ['Red & Green', 'Blue & Orange', 'Yellow & Purple'],
    learnMoreUrl: 'https://www.adobe.com/creativecloud/design/discover/complementary-colors.html'
  },
  triadic: {
    title: 'Triadic Color Scheme',
    description: 'Three colors evenly spaced around the color wheel. This creates vibrant palettes while maintaining harmony.',
    examples: ['Red, Yellow, Blue', 'Orange, Green, Purple'],
    learnMoreUrl: 'https://www.adobe.com/creativecloud/design/discover/triadic-colors.html'
  },
  analogous: {
    title: 'Analogous Colors',
    description: 'Colors that are next to each other on the color wheel. They create serene and comfortable designs.',
    examples: ['Blue, Blue-Green, Green', 'Red, Red-Orange, Orange'],
    learnMoreUrl: 'https://www.adobe.com/creativecloud/design/discover/analogous-colors.html'
  },
  monochromatic: {
    title: 'Monochromatic Colors',
    description: 'Different shades, tints, and tones of a single color. Creates a cohesive and elegant look.',
    examples: ['Light Blue, Blue, Dark Blue', 'Pink, Red, Maroon'],
    learnMoreUrl: 'https://www.adobe.com/creativecloud/design/discover/monochromatic-colors.html'
  },
  tetradic: {
    title: 'Tetradic (Square) Colors',
    description: 'Four colors evenly spaced around the color wheel. Offers the most variety while maintaining balance.',
    examples: ['Red, Yellow, Green, Blue', 'Orange, Yellow-Green, Blue, Red-Purple'],
    learnMoreUrl: 'https://www.adobe.com/creativecloud/design/discover/tetradic-colors.html'
  },
  contrast: {
    title: 'Color Contrast',
    description: 'The difference in luminance between colors. Higher contrast improves readability and accessibility.',
    examples: ['Black on White (21:1)', 'Dark Blue on Light Gray (7:1)'],
    learnMoreUrl: 'https://webaim.org/articles/contrast/'
  },
  saturation: {
    title: 'Color Saturation',
    description: 'The intensity or purity of a color. High saturation is vivid, low saturation is more muted.',
    examples: ['Bright Red (high)', 'Dusty Rose (low)', 'Gray (no saturation)'],
    learnMoreUrl: 'https://www.adobe.com/creativecloud/design/discover/color-saturation.html'
  },
  hue: {
    title: 'Hue',
    description: 'The pure color itself - what we typically think of as "color" (red, blue, green, etc.).',
    examples: ['Red', 'Blue', 'Yellow', 'Green'],
    learnMoreUrl: 'https://www.adobe.com/creativecloud/design/discover/hue-color.html'
  },
  lightness: {
    title: 'Lightness/Value',
    description: 'How light or dark a color appears. Also called brightness or value in color theory.',
    examples: ['Light Pink (high)', 'Medium Red (mid)', 'Dark Maroon (low)'],
    learnMoreUrl: 'https://www.adobe.com/creativecloud/design/discover/color-value.html'
  }
};

const ColorTheoryTooltip: React.FC<ColorTheoryTooltipProps> = ({
  concept,
  children,
  className = ''
}) => {
  const content = colorTheoryContent[concept];
  
  if (!content) {
    return <>{children}</>;
  }

  const tooltipContent = (
    <div className="text-left">
      <h4 className="font-semibold text-white mb-2">{content.title}</h4>
      <p className="text-gray-200 text-sm mb-3 leading-relaxed">
        {content.description}
      </p>
      
      {content.examples && (
        <div className="mb-3">
          <p className="text-gray-300 text-xs font-medium mb-1">Examples:</p>
          <ul className="text-gray-200 text-xs space-y-1">
            {content.examples.map((example, index) => (
              <li key={index} className="flex items-center">
                <span className="w-1 h-1 bg-gray-400 rounded-full mr-2 flex-shrink-0" />
                {example}
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {content.learnMoreUrl && (
        <div className="pt-2 border-t border-gray-700">
          <a
            href={content.learnMoreUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-300 hover:text-blue-200 text-xs font-medium inline-flex items-center"
          >
            Learn more
            <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
      )}
    </div>
  );

  return (
    <Tooltip
      content={tooltipContent}
      position="top"
      maxWidth="320px"
      className={className}
    >
      <div className="inline-flex items-center cursor-help">
        {children}
        <svg className="w-4 h-4 ml-1 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
    </Tooltip>
  );
};

export default ColorTheoryTooltip;