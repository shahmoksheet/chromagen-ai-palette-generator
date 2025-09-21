import React, { useState } from 'react';
import ColorTheoryTooltip from './ColorTheoryTooltip';
import AccessibilityTooltip from './AccessibilityTooltip';

export interface ColorReasoning {
  colorName: string;
  hex: string;
  category: 'primary' | 'secondary' | 'accent' | 'neutral';
  reasoning: string;
  harmonyType?: 'complementary' | 'triadic' | 'analogous' | 'monochromatic' | 'tetradic';
  psychologicalEffect?: string;
  usageRecommendation?: string;
  accessibilityNotes?: string;
}

export interface ColorReasoningPanelProps {
  reasoning: ColorReasoning[];
  overallExplanation?: string;
  harmonyType?: string;
  className?: string;
}

const ColorReasoningPanel: React.FC<ColorReasoningPanelProps> = ({
  reasoning,
  overallExplanation,
  harmonyType,
  className = ''
}) => {
  const [expandedColor, setExpandedColor] = useState<string | null>(null);

  const toggleColorExpansion = (colorName: string) => {
    setExpandedColor(expandedColor === colorName ? null : colorName);
  };

  const getHarmonyIcon = (harmony?: string) => {
    switch (harmony) {
      case 'complementary':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h8m-4-4v8" />
          </svg>
        );
      case 'triadic':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        );
      case 'analogous':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        );
      case 'monochromatic':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
          </svg>
        );
      default:
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4 4 4 0 004-4V5z" />
          </svg>
        );
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'primary':
        return (
          <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="8" />
          </svg>
        );
      case 'secondary':
        return (
          <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 24 24">
            <rect x="4" y="4" width="16" height="16" rx="2" />
          </svg>
        );
      case 'accent':
        return (
          <svg className="w-4 h-4 text-purple-500" fill="currentColor" viewBox="0 0 24 24">
            <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
          </svg>
        );
      case 'neutral':
        return (
          <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2L2 7v10c0 5.55 3.84 9.74 9 11 5.16-1.26 9-5.45 9-11V7l-10-5z" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <svg className="w-5 h-5 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            AI Color Reasoning
          </h3>
          
          {harmonyType && (
            <ColorTheoryTooltip concept={harmonyType as any}>
              <div className="flex items-center text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded-full">
                {getHarmonyIcon(harmonyType)}
                <span className="ml-1 capitalize">{harmonyType}</span>
              </div>
            </ColorTheoryTooltip>
          )}
        </div>
        
        {overallExplanation && (
          <p className="mt-2 text-sm text-gray-600 leading-relaxed">
            {overallExplanation}
          </p>
        )}
      </div>

      <div className="divide-y divide-gray-100">
        {reasoning.map((color, index) => (
          <div key={index} className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div
                  className="w-8 h-8 rounded-lg shadow-sm border border-gray-200"
                  style={{ backgroundColor: color.hex }}
                />
                <div>
                  <div className="flex items-center space-x-2">
                    <h4 className="font-medium text-gray-900">{color.colorName}</h4>
                    {getCategoryIcon(color.category)}
                    <span className="text-xs text-gray-500 capitalize">
                      {color.category}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{color.hex}</p>
                </div>
              </div>
              
              <button
                onClick={() => toggleColorExpansion(color.colorName)}
                className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg
                  className={`w-5 h-5 transform transition-transform ${
                    expandedColor === color.colorName ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>

            <div className="mt-2">
              <p className="text-sm text-gray-700 leading-relaxed">
                {color.reasoning}
              </p>
            </div>

            {expandedColor === color.colorName && (
              <div className="mt-4 space-y-3 pl-4 border-l-2 border-gray-200">
                {color.harmonyType && (
                  <div>
                    <ColorTheoryTooltip concept={color.harmonyType}>
                      <h5 className="text-sm font-medium text-gray-900 mb-1">
                        Color Harmony
                      </h5>
                    </ColorTheoryTooltip>
                    <p className="text-sm text-gray-600 capitalize">
                      {color.harmonyType} relationship
                    </p>
                  </div>
                )}

                {color.psychologicalEffect && (
                  <div>
                    <h5 className="text-sm font-medium text-gray-900 mb-1">
                      Psychological Effect
                    </h5>
                    <p className="text-sm text-gray-600">
                      {color.psychologicalEffect}
                    </p>
                  </div>
                )}

                {color.usageRecommendation && (
                  <div>
                    <h5 className="text-sm font-medium text-gray-900 mb-1">
                      Usage Recommendation
                    </h5>
                    <p className="text-sm text-gray-600">
                      {color.usageRecommendation}
                    </p>
                  </div>
                )}

                {color.accessibilityNotes && (
                  <div>
                    <AccessibilityTooltip concept="contrast-ratio">
                      <h5 className="text-sm font-medium text-gray-900 mb-1">
                        Accessibility Notes
                      </h5>
                    </AccessibilityTooltip>
                    <p className="text-sm text-gray-600">
                      {color.accessibilityNotes}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="p-4 bg-gray-50 rounded-b-lg">
        <div className="flex items-center text-xs text-gray-500">
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Click on colors to expand detailed explanations and learn more about color theory
        </div>
      </div>
    </div>
  );
};

export default ColorReasoningPanel;