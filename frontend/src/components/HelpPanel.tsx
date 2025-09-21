import React, { useState } from 'react';
import WCAGGuidePanel from './WCAGGuidePanel';
import ColorTheoryTooltip from './ColorTheoryTooltip';
import { getQuickTips } from '../config/onboardingSteps';

export interface HelpPanelProps {
  onStartOnboarding?: () => void;
  className?: string;
}

const HelpPanel: React.FC<HelpPanelProps> = ({
  onStartOnboarding,
  className = ''
}) => {
  const [activeTab, setActiveTab] = useState<'quick-tips' | 'color-theory' | 'accessibility' | 'faq'>('quick-tips');
  const quickTips = getQuickTips();

  const colorTheoryConcepts = [
    {
      concept: 'complementary' as const,
      title: 'Complementary Colors',
      description: 'Colors opposite on the color wheel that create high contrast'
    },
    {
      concept: 'triadic' as const,
      title: 'Triadic Colors',
      description: 'Three colors evenly spaced around the color wheel'
    },
    {
      concept: 'analogous' as const,
      title: 'Analogous Colors',
      description: 'Colors next to each other on the color wheel'
    },
    {
      concept: 'monochromatic' as const,
      title: 'Monochromatic Colors',
      description: 'Different shades and tints of a single color'
    },
    {
      concept: 'contrast' as const,
      title: 'Color Contrast',
      description: 'The difference in luminance between colors'
    },
    {
      concept: 'saturation' as const,
      title: 'Saturation',
      description: 'The intensity or purity of a color'
    }
  ];

  const faqItems = [
    {
      question: 'How does the AI generate color palettes?',
      answer: 'ChromaGen uses advanced AI models to understand your prompt and generate colors based on color theory principles, emotional associations, and design best practices. The AI considers factors like harmony, contrast, and accessibility.'
    },
    {
      question: 'What makes a color palette accessible?',
      answer: 'Accessible palettes meet WCAG contrast ratio requirements (4.5:1 for AA, 7:1 for AAA), work for users with color blindness, and don\'t rely solely on color to convey information.'
    },
    {
      question: 'Can I use these colors commercially?',
      answer: 'Yes! All generated color palettes are free to use for any purpose, including commercial projects. Colors themselves cannot be copyrighted.'
    },
    {
      question: 'How do I write better prompts?',
      answer: 'Be specific about mood, industry, and style. Include context like "energetic fitness brand" or "calm meditation app." Mention specific colors you like or want to avoid.'
    },
    {
      question: 'What export formats are available?',
      answer: 'You can export palettes as CSS variables, SCSS, JSON, Adobe ASE files, and Sketch palettes. Each format includes color values and usage information.'
    }
  ];

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Help & Learning
          </h3>
          
          {onStartOnboarding && (
            <button
              onClick={onStartOnboarding}
              className="px-3 py-1 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
            >
              Take Tour
            </button>
          )}
        </div>
        
        {/* Tabs */}
        <div className="mt-3 flex space-x-1 bg-gray-100 rounded-lg p-1">
          {[
            { id: 'quick-tips', label: 'Quick Tips' },
            { id: 'color-theory', label: 'Color Theory' },
            { id: 'accessibility', label: 'Accessibility' },
            { id: 'faq', label: 'FAQ' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === tab.id
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {activeTab === 'quick-tips' && (
          <div className="space-y-4">
            <p className="text-gray-700 leading-relaxed">
              Get the most out of ChromaGen with these helpful tips and tricks.
            </p>
            
            <div className="grid gap-4">
              {quickTips.map((tip) => (
                <div key={tip.id} className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">{tip.title}</h4>
                  <p className="text-sm text-gray-700">{tip.content}</p>
                  <span className={`inline-block mt-2 px-2 py-1 text-xs rounded-full ${
                    tip.category === 'theory' ? 'bg-purple-100 text-purple-700' :
                    tip.category === 'accessibility' ? 'bg-blue-100 text-blue-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {tip.category}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'color-theory' && (
          <div className="space-y-4">
            <p className="text-gray-700 leading-relaxed">
              Learn about color theory concepts used in palette generation. 
              Click on any concept to see detailed explanations and examples.
            </p>
            
            <div className="grid gap-3">
              {colorTheoryConcepts.map((concept) => (
                <div key={concept.concept} className="p-4 bg-gray-50 rounded-lg">
                  <ColorTheoryTooltip concept={concept.concept}>
                    <div className="cursor-help">
                      <h4 className="font-medium text-gray-900 mb-1">{concept.title}</h4>
                      <p className="text-sm text-gray-700">{concept.description}</p>
                    </div>
                  </ColorTheoryTooltip>
                </div>
              ))}
            </div>
            
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Color Wheel Basics</h4>
              <p className="text-sm text-blue-800 leading-relaxed">
                The color wheel is the foundation of color theory. Primary colors (red, blue, yellow) 
                combine to create secondary colors (green, orange, purple), which then create tertiary colors. 
                Understanding these relationships helps create harmonious palettes.
              </p>
            </div>
          </div>
        )}

        {activeTab === 'accessibility' && (
          <div className="space-y-4">
            <WCAGGuidePanel compact={false} />
          </div>
        )}

        {activeTab === 'faq' && (
          <FAQAccordion faqItems={faqItems} />
        )}
      </div>
    </div>
  );
};

// FAQ Accordion Component
interface FAQItem {
  question: string;
  answer: string;
}

interface FAQAccordionProps {
  faqItems: FAQItem[];
}

const FAQAccordion: React.FC<FAQAccordionProps> = ({ faqItems }) => {
  const [openItems, setOpenItems] = useState<Set<number>>(new Set());

  const toggleItem = (index: number) => {
    const newOpenItems = new Set(openItems);
    if (newOpenItems.has(index)) {
      newOpenItems.delete(index);
    } else {
      newOpenItems.add(index);
    }
    setOpenItems(newOpenItems);
  };

  return (
    <div className="space-y-4">
      <p className="text-gray-700 leading-relaxed">
        Frequently asked questions about ChromaGen and color palette generation.
      </p>
      
      <div className="space-y-2">
        {faqItems.map((item, index) => (
          <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={() => toggleItem(index)}
              className="w-full px-4 py-3 text-left bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-between"
            >
              <h4 className="font-medium text-gray-900 pr-4">{item.question}</h4>
              <svg
                className={`w-5 h-5 text-gray-500 transition-transform duration-200 flex-shrink-0 ${
                  openItems.has(index) ? 'transform rotate-180' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {openItems.has(index) && (
              <div className="px-4 py-3 bg-white border-t border-gray-200">
                <p className="text-sm text-gray-700 leading-relaxed">{item.answer}</p>
              </div>
            )}
          </div>
        ))}
      </div>
      
      <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
        <h4 className="font-medium text-gray-900 mb-2 flex items-center">
          <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Still have questions?
        </h4>
        <p className="text-sm text-gray-700 mb-3">
          Check out our comprehensive documentation or reach out for support.
        </p>
        <div className="flex flex-wrap gap-3">
          <button className="text-sm bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700 transition-colors">
            View Documentation
          </button>
          <button className="text-sm bg-white text-blue-600 border border-blue-600 px-3 py-1 rounded-md hover:bg-blue-50 transition-colors">
            Contact Support
          </button>
        </div>
      </div>
    </div>
  );
};

export default HelpPanel;