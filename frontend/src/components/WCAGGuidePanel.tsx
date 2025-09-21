import React, { useState } from 'react';
import AccessibilityTooltip from './AccessibilityTooltip';

export interface WCAGGuideSection {
  id: string;
  title: string;
  level: 'AA' | 'AAA';
  description: string;
  requirements: string[];
  examples: {
    good: string[];
    bad: string[];
  };
  tips: string[];
}

export interface WCAGGuidePanelProps {
  className?: string;
  compact?: boolean;
}

const wcagSections: WCAGGuideSection[] = [
  {
    id: 'contrast-minimum',
    title: 'Color Contrast (Minimum)',
    level: 'AA',
    description: 'Text and images of text must have a contrast ratio of at least 4.5:1, except for large text which must have a contrast ratio of at least 3:1.',
    requirements: [
      'Normal text: 4.5:1 contrast ratio minimum',
      'Large text (18pt+ or 14pt+ bold): 3:1 contrast ratio minimum',
      'Applies to text and images of text',
      'Does not apply to logos or decorative text'
    ],
    examples: {
      good: [
        'Black text on white background (21:1)',
        'Dark blue (#003366) on white (12.6:1)',
        'White text on dark gray (#333333) (12.6:1)'
      ],
      bad: [
        'Light gray text on white background (1.5:1)',
        'Yellow text on white background (1.1:1)',
        'Medium gray on light gray (2.3:1)'
      ]
    },
    tips: [
      'Use online contrast checkers to verify ratios',
      'Test with actual text sizes, not just color swatches',
      'Consider users with visual impairments',
      'Higher contrast is generally better for readability'
    ]
  },
  {
    id: 'contrast-enhanced',
    title: 'Color Contrast (Enhanced)',
    level: 'AAA',
    description: 'Text and images of text must have a contrast ratio of at least 7:1, except for large text which must have a contrast ratio of at least 4.5:1.',
    requirements: [
      'Normal text: 7:1 contrast ratio minimum',
      'Large text (18pt+ or 14pt+ bold): 4.5:1 contrast ratio minimum',
      'Provides better accessibility for users with vision impairments',
      'Recommended for critical interfaces and content'
    ],
    examples: {
      good: [
        'Black text on white background (21:1)',
        'White text on dark blue (#000080) (8.6:1)',
        'Dark text on light yellow (#FFFACD) (16.8:1)'
      ],
      bad: [
        'Dark gray (#666666) on white (5.7:1) - fails AAA',
        'White text on medium blue (#4169E1) (5.9:1) - fails AAA',
        'Dark blue on light blue (3.2:1) - fails both AA and AAA'
      ]
    },
    tips: [
      'Aim for AAA compliance on important content',
      'Consider users with low vision or color blindness',
      'Test in different lighting conditions',
      'Use tools like WebAIM Contrast Checker'
    ]
  },
  {
    id: 'use-of-color',
    title: 'Use of Color',
    level: 'AA',
    description: 'Color is not used as the only visual means of conveying information, indicating an action, prompting a response, or distinguishing a visual element.',
    requirements: [
      'Don\'t rely solely on color to convey information',
      'Use additional visual cues like icons, patterns, or text',
      'Ensure information is available to users who cannot see color',
      'Apply to links, form validation, charts, and status indicators'
    ],
    examples: {
      good: [
        'Error messages with red color AND an error icon',
        'Required form fields with red asterisk AND "required" text',
        'Chart data with different colors AND patterns/shapes',
        'Links that are underlined AND a different color'
      ],
      bad: [
        'Error messages shown only in red text',
        'Required fields indicated only by red color',
        'Chart data distinguished only by color',
        'Links shown only with color difference'
      ]
    },
    tips: [
      'Always provide a non-color alternative',
      'Use icons, text labels, or patterns alongside color',
      'Test your interface in grayscale',
      'Consider users with color blindness (8% of men, 0.5% of women)'
    ]
  }
];

const WCAGGuidePanel: React.FC<WCAGGuidePanelProps> = ({
  className = '',
  compact = false
}) => {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'guidelines'>('overview');

  const toggleSection = (sectionId: string) => {
    setExpandedSection(expandedSection === sectionId ? null : sectionId);
  };

  const getLevelBadge = (level: 'AA' | 'AAA') => (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
      level === 'AAA' 
        ? 'bg-green-100 text-green-800' 
        : 'bg-yellow-100 text-yellow-800'
    }`}>
      WCAG {level}
    </span>
  );

  if (compact) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
        <div className="p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
            <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            WCAG Quick Guide
          </h3>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
              <div>
                <AccessibilityTooltip concept="wcag-aa">
                  <div className="font-medium text-gray-900">AA Standard</div>
                </AccessibilityTooltip>
                <div className="text-sm text-gray-600">4.5:1 contrast minimum</div>
              </div>
              {getLevelBadge('AA')}
            </div>
            
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div>
                <AccessibilityTooltip concept="wcag-aaa">
                  <div className="font-medium text-gray-900">AAA Standard</div>
                </AccessibilityTooltip>
                <div className="text-sm text-gray-600">7:1 contrast minimum</div>
              </div>
              {getLevelBadge('AAA')}
            </div>
            
            <div className="p-3 bg-blue-50 rounded-lg">
              <AccessibilityTooltip concept="color-blindness">
                <div className="font-medium text-gray-900 mb-1">Color Blindness</div>
              </AccessibilityTooltip>
              <div className="text-sm text-gray-600">
                Don't rely solely on color to convey information
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          WCAG Accessibility Guidelines
        </h3>
        
        {/* Tabs */}
        <div className="mt-3 flex space-x-1 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'overview'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('guidelines')}
            className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'guidelines'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Guidelines
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {activeTab === 'overview' && (
          <div className="space-y-4">
            <div className="prose prose-sm max-w-none">
              <p className="text-gray-700 leading-relaxed">
                The Web Content Accessibility Guidelines (WCAG) provide standards for making web content 
                accessible to people with disabilities. Here are the key color-related requirements:
              </p>
            </div>
            
            <div className="grid gap-4">
              <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-gray-900">Level AA (Minimum)</h4>
                  {getLevelBadge('AA')}
                </div>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• Normal text: 4.5:1 contrast ratio</li>
                  <li>• Large text: 3:1 contrast ratio</li>
                  <li>• Don't rely solely on color</li>
                </ul>
              </div>
              
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-gray-900">Level AAA (Enhanced)</h4>
                  {getLevelBadge('AAA')}
                </div>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• Normal text: 7:1 contrast ratio</li>
                  <li>• Large text: 4.5:1 contrast ratio</li>
                  <li>• Better for users with vision impairments</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'guidelines' && (
          <div className="space-y-4">
            {wcagSections.map((section) => (
              <div key={section.id} className="border border-gray-200 rounded-lg">
                <button
                  onClick={() => toggleSection(section.id)}
                  className="w-full p-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <h4 className="font-medium text-gray-900">{section.title}</h4>
                    {getLevelBadge(section.level)}
                  </div>
                  <svg
                    className={`w-5 h-5 text-gray-400 transform transition-transform ${
                      expandedSection === section.id ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {expandedSection === section.id && (
                  <div className="px-4 pb-4 border-t border-gray-200">
                    <p className="text-gray-700 mb-4 leading-relaxed">
                      {section.description}
                    </p>

                    <div className="space-y-4">
                      <div>
                        <h5 className="font-medium text-gray-900 mb-2">Requirements:</h5>
                        <ul className="text-sm text-gray-700 space-y-1">
                          {section.requirements.map((req, index) => (
                            <li key={index} className="flex items-start">
                              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mr-2 mt-2 flex-shrink-0" />
                              {req}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <h5 className="font-medium text-green-700 mb-2 flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                            </svg>
                            Good Examples:
                          </h5>
                          <ul className="text-sm text-gray-700 space-y-1">
                            {section.examples.good.map((example, index) => (
                              <li key={index} className="flex items-start">
                                <span className="w-1.5 h-1.5 bg-green-400 rounded-full mr-2 mt-2 flex-shrink-0" />
                                {example}
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div>
                          <h5 className="font-medium text-red-700 mb-2 flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                            </svg>
                            Bad Examples:
                          </h5>
                          <ul className="text-sm text-gray-700 space-y-1">
                            {section.examples.bad.map((example, index) => (
                              <li key={index} className="flex items-start">
                                <span className="w-1.5 h-1.5 bg-red-400 rounded-full mr-2 mt-2 flex-shrink-0" />
                                {example}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      <div>
                        <h5 className="font-medium text-gray-900 mb-2">Tips:</h5>
                        <ul className="text-sm text-gray-700 space-y-1">
                          {section.tips.map((tip, index) => (
                            <li key={index} className="flex items-start">
                              <span className="w-1.5 h-1.5 bg-blue-400 rounded-full mr-2 mt-2 flex-shrink-0" />
                              {tip}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 bg-gray-50 rounded-b-lg border-t border-gray-200">
        <div className="flex items-center justify-between text-sm">
          <div className="text-gray-600">
            Learn more about WCAG guidelines
          </div>
          <a
            href="https://www.w3.org/WAI/WCAG21/quickref/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-700 font-medium inline-flex items-center"
          >
            WCAG Quick Reference
            <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
      </div>
    </div>
  );
};

export default WCAGGuidePanel;