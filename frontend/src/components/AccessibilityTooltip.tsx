import React from 'react';
import Tooltip from './Tooltip';

export interface AccessibilityContent {
  title: string;
  description: string;
  standards?: {
    AA: string;
    AAA: string;
  };
  tips?: string[];
  learnMoreUrl?: string;
}

export interface AccessibilityTooltipProps {
  concept: 'wcag-aa' | 'wcag-aaa' | 'contrast-ratio' | 'color-blindness' | 'large-text' | 'normal-text' | 'protanopia' | 'deuteranopia' | 'tritanopia';
  children: React.ReactNode;
  className?: string;
}

const accessibilityContent: Record<string, AccessibilityContent> = {
  'wcag-aa': {
    title: 'WCAG AA Standard',
    description: 'The minimum level of accessibility compliance for most websites. Requires a contrast ratio of at least 4.5:1 for normal text.',
    standards: {
      AA: '4.5:1 for normal text, 3:1 for large text',
      AAA: '7:1 for normal text, 4.5:1 for large text'
    },
    tips: [
      'Meets legal requirements in many countries',
      'Good baseline for most web content',
      'Helps users with mild vision impairments'
    ],
    learnMoreUrl: 'https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html'
  },
  'wcag-aaa': {
    title: 'WCAG AAA Standard',
    description: 'The highest level of accessibility compliance. Requires a contrast ratio of at least 7:1 for normal text.',
    standards: {
      AA: '4.5:1 for normal text, 3:1 for large text',
      AAA: '7:1 for normal text, 4.5:1 for large text'
    },
    tips: [
      'Exceeds most legal requirements',
      'Best for critical interfaces',
      'Helps users with severe vision impairments'
    ],
    learnMoreUrl: 'https://www.w3.org/WAI/WCAG21/Understanding/contrast-enhanced.html'
  },
  'contrast-ratio': {
    title: 'Contrast Ratio',
    description: 'A measure of the difference in luminance between two colors. Higher ratios mean better readability.',
    tips: [
      'Calculated as (L1 + 0.05) / (L2 + 0.05)',
      'Ranges from 1:1 (no contrast) to 21:1 (maximum)',
      'White on black has the highest ratio (21:1)',
      'Consider both foreground and background colors'
    ],
    learnMoreUrl: 'https://webaim.org/articles/contrast/'
  },
  'color-blindness': {
    title: 'Color Blindness',
    description: 'A condition affecting about 8% of men and 0.5% of women, making it difficult to distinguish certain colors.',
    tips: [
      'Don\'t rely solely on color to convey information',
      'Use patterns, shapes, or text labels as alternatives',
      'Test your designs with color blindness simulators',
      'Consider high contrast alternatives'
    ],
    learnMoreUrl: 'https://webaim.org/articles/visual/colorblind'
  },
  'large-text': {
    title: 'Large Text',
    description: 'Text that is 18pt (24px) or larger, or 14pt (18.66px) or larger if bold. Has lower contrast requirements.',
    standards: {
      AA: '3:1 contrast ratio minimum',
      AAA: '4.5:1 contrast ratio minimum'
    },
    tips: [
      'Easier to read with lower contrast',
      'Good for headings and emphasis',
      'Still should be tested for readability'
    ],
    learnMoreUrl: 'https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html'
  },
  'normal-text': {
    title: 'Normal Text',
    description: 'Text smaller than 18pt (24px) regular or 14pt (18.66px) bold. Requires higher contrast ratios.',
    standards: {
      AA: '4.5:1 contrast ratio minimum',
      AAA: '7:1 contrast ratio minimum'
    },
    tips: [
      'Most body text falls into this category',
      'Higher contrast requirements for readability',
      'Critical for accessibility compliance'
    ],
    learnMoreUrl: 'https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html'
  },
  'protanopia': {
    title: 'Protanopia',
    description: 'A type of red-green color blindness where red cones are missing. Affects about 1% of men.',
    tips: [
      'Difficulty distinguishing red from green',
      'Red appears darker or brownish',
      'Use blue and yellow for important distinctions',
      'Avoid red-green combinations for critical info'
    ],
    learnMoreUrl: 'https://www.color-blindness.com/protanopia-red-green-color-blindness/'
  },
  'deuteranopia': {
    title: 'Deuteranopia',
    description: 'The most common type of red-green color blindness where green cones are missing. Affects about 1% of men.',
    tips: [
      'Difficulty distinguishing red from green',
      'Green appears more reddish',
      'Use blue and yellow for important distinctions',
      'Most common form of color blindness'
    ],
    learnMoreUrl: 'https://www.color-blindness.com/deuteranopia-red-green-color-blindness/'
  },
  'tritanopia': {
    title: 'Tritanopia',
    description: 'A rare type of blue-yellow color blindness where blue cones are missing. Affects less than 1% of people.',
    tips: [
      'Difficulty distinguishing blue from yellow',
      'Blue appears greenish, yellow appears pinkish',
      'Use red and green for important distinctions',
      'Very rare but still important to consider'
    ],
    learnMoreUrl: 'https://www.color-blindness.com/tritanopia-blue-yellow-color-blindness/'
  }
};

const AccessibilityTooltip: React.FC<AccessibilityTooltipProps> = ({
  concept,
  children,
  className = ''
}) => {
  const content = accessibilityContent[concept];
  
  if (!content) {
    return <>{children}</>;
  }

  const tooltipContent = (
    <div className="text-left">
      <h4 className="font-semibold text-white mb-2">{content.title}</h4>
      <p className="text-gray-200 text-sm mb-3 leading-relaxed">
        {content.description}
      </p>
      
      {content.standards && (
        <div className="mb-3">
          <p className="text-gray-300 text-xs font-medium mb-2">Standards:</p>
          <div className="space-y-1">
            <div className="flex justify-between items-center text-xs">
              <span className="text-yellow-300 font-medium">AA:</span>
              <span className="text-gray-200">{content.standards.AA}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-green-300 font-medium">AAA:</span>
              <span className="text-gray-200">{content.standards.AAA}</span>
            </div>
          </div>
        </div>
      )}
      
      {content.tips && (
        <div className="mb-3">
          <p className="text-gray-300 text-xs font-medium mb-1">Tips:</p>
          <ul className="text-gray-200 text-xs space-y-1">
            {content.tips.map((tip, index) => (
              <li key={index} className="flex items-start">
                <span className="w-1 h-1 bg-gray-400 rounded-full mr-2 mt-1.5 flex-shrink-0" />
                <span className="leading-relaxed">{tip}</span>
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
      maxWidth="350px"
      className={className}
    >
      <div className="inline-flex items-center cursor-help">
        {children}
        <svg className="w-4 h-4 ml-1 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
    </Tooltip>
  );
};

export default AccessibilityTooltip;