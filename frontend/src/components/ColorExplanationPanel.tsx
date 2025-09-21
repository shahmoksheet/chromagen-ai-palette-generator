import React, { useState } from 'react';

interface ColorExplanation {
  colorName: string;
  hex: string;
  category: string;
  psychologyEffect: string;
  usageRecommendation: string;
  harmonyType: string;
  accessibilityNotes: string;
  designTips: string[];
  brandingContext: string;
}

interface ColorExplanationPanelProps {
  colors: any[];
  overallExplanation: string;
  userPrompt: string;
}

const ColorExplanationPanel: React.FC<ColorExplanationPanelProps> = ({ 
  colors, 
  overallExplanation, 
  userPrompt 
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'individual' | 'usage' | 'psychology'>('overview');
  const [selectedColor, setSelectedColor] = useState(0);

  const getColorExplanation = (color: any, index: number): ColorExplanation => {
    const psychologyEffects = {
      red: "Evokes energy, passion, urgency, and excitement. Creates a sense of importance and can stimulate appetite.",
      orange: "Represents enthusiasm, creativity, warmth, and friendliness. Great for calls-to-action and social brands.",
      yellow: "Suggests optimism, happiness, clarity, and intellect. Can grab attention but use sparingly to avoid overwhelming.",
      green: "Conveys growth, nature, harmony, and trust. Perfect for eco-friendly, health, and financial brands.",
      blue: "Communicates trust, professionalism, calm, and reliability. Ideal for corporate, tech, and healthcare brands.",
      purple: "Implies luxury, creativity, mystery, and sophistication. Great for premium brands and creative industries.",
      pink: "Represents compassion, nurturing, love, and playfulness. Works well for beauty, fashion, and lifestyle brands.",
      brown: "Suggests earthiness, reliability, warmth, and comfort. Perfect for organic, artisanal, and outdoor brands.",
      gray: "Conveys neutrality, sophistication, balance, and professionalism. Excellent for backgrounds and text.",
      black: "Represents elegance, power, sophistication, and luxury. Creates strong contrast and premium feel.",
      white: "Symbolizes purity, simplicity, cleanliness, and space. Essential for minimalist and medical designs."
    };

    const getColorPsychology = (hex: string): string => {
      const rgb = hexToRgb(hex);
      if (!rgb) return psychologyEffects.blue;
      
      const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
      const hue = hsl.h;
      
      if (hue >= 0 && hue < 15 || hue >= 345) return psychologyEffects.red;
      if (hue >= 15 && hue < 45) return psychologyEffects.orange;
      if (hue >= 45 && hue < 75) return psychologyEffects.yellow;
      if (hue >= 75 && hue < 165) return psychologyEffects.green;
      if (hue >= 165 && hue < 255) return psychologyEffects.blue;
      if (hue >= 255 && hue < 285) return psychologyEffects.purple;
      if (hue >= 285 && hue < 345) return psychologyEffects.pink;
      
      return psychologyEffects.blue;
    };

    const getDesignTips = (category: string, hex: string): string[] => {
      const baseTips = [
        `Use as ${category} color to establish visual hierarchy`,
        `Pair with neutral colors for better readability`,
        `Test contrast ratios before finalizing design`,
        `Consider color blindness accessibility when choosing combinations`
      ];

      const categoryTips = {
        primary: [
          "Use consistently across all brand touchpoints",
          "Limit to 60% of your design composition",
          "Create variations (light/dark) for different contexts",
          "Ensure it works on both light and dark backgrounds"
        ],
        secondary: [
          "Use to support and complement the primary color",
          "Great for buttons, links, and interactive elements",
          "Should comprise about 30% of your color usage",
          "Create visual interest without overwhelming the primary"
        ],
        accent: [
          "Use sparingly for highlights and call-to-action elements",
          "Perfect for drawing attention to important information",
          "Should be used in small doses (10% of design)",
          "Creates focal points and guides user attention"
        ],
        neutral: [
          "Essential for text, backgrounds, and borders",
          "Provides visual rest and improves readability",
          "Use different shades to create depth and hierarchy",
          "Should be the foundation of your color system"
        ]
      };

      return [...baseTips, ...(categoryTips[category as keyof typeof categoryTips] || [])];
    };

    const getBrandingContext = (category: string, userPrompt: string): string => {
      const promptLower = userPrompt.toLowerCase();
      let context = `This ${category} color works well for `;

      if (promptLower.includes('corporate') || promptLower.includes('business') || promptLower.includes('professional')) {
        context += "corporate and professional environments, conveying trust and reliability.";
      } else if (promptLower.includes('creative') || promptLower.includes('art') || promptLower.includes('design')) {
        context += "creative industries, expressing innovation and artistic vision.";
      } else if (promptLower.includes('health') || promptLower.includes('medical') || promptLower.includes('wellness')) {
        context += "healthcare and wellness brands, promoting feelings of care and trust.";
      } else if (promptLower.includes('tech') || promptLower.includes('digital') || promptLower.includes('app')) {
        context += "technology and digital products, suggesting innovation and modernity.";
      } else if (promptLower.includes('nature') || promptLower.includes('eco') || promptLower.includes('green')) {
        context += "environmental and sustainable brands, connecting with nature and growth.";
      } else if (promptLower.includes('luxury') || promptLower.includes('premium') || promptLower.includes('elegant')) {
        context += "luxury and premium brands, conveying sophistication and exclusivity.";
      } else {
        context += "a wide range of applications, offering versatility in brand expression.";
      }

      return context;
    };

    return {
      colorName: color.name,
      hex: color.hex,
      category: color.category,
      psychologyEffect: getColorPsychology(color.hex),
      usageRecommendation: color.usage || `Perfect for ${color.category} elements in your design system.`,
      harmonyType: "complementary", // This would come from AI
      accessibilityNotes: `Contrast with white: ${color.accessibility?.contrastWithWhite?.toFixed(1) || 'N/A'}:1, WCAG ${color.accessibility?.wcagLevel || 'Unknown'}`,
      designTips: getDesignTips(color.category, color.hex),
      brandingContext: getBrandingContext(color.category, userPrompt)
    };
  };

  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  };

  const rgbToHsl = (r: number, g: number, b: number) => {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s, l = (max + min) / 2;

    if (max === min) {
      h = s = 0;
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }
    return { h: h * 360, s: s * 100, l: l * 100 };
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📋' },
    { id: 'individual', label: 'Color Details', icon: '🎨' },
    { id: 'usage', label: 'Usage Guide', icon: '💡' },
    { id: 'psychology', label: 'Psychology', icon: '🧠' }
  ];

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Color Explanation & Guide
        </h3>
        <p className="text-gray-600">
          Understanding your palette: psychology, usage, and design recommendations
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-2 mb-6 border-b border-gray-200">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-t-lg font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-700'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <span>{tab.icon}</span>
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === 'overview' && (
          <div>
            <div className="bg-blue-50 rounded-lg p-4 mb-6">
              <h4 className="font-medium text-blue-900 mb-2">
                🎯 Palette Summary for: "{userPrompt}"
              </h4>
              <p className="text-blue-800 leading-relaxed">
                {overallExplanation}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {colors.map((color, index) => {
                const explanation = getColorExplanation(color, index);
                return (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div
                        className="w-8 h-8 rounded-full border-2 border-white shadow-sm"
                        style={{ backgroundColor: color.hex }}
                      />
                      <div>
                        <h5 className="font-medium text-gray-900">{color.name}</h5>
                        <p className="text-sm text-gray-600">{color.category}</p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {explanation.usageRecommendation}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'individual' && (
          <div>
            {/* Color Selector */}
            <div className="flex flex-wrap gap-2 mb-6">
              {colors.map((color, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedColor(index)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 transition-all ${
                    selectedColor === index
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div
                    className="w-6 h-6 rounded-full"
                    style={{ backgroundColor: color.hex }}
                  />
                  <span className="text-sm font-medium">{color.name}</span>
                </button>
              ))}
            </div>

            {/* Selected Color Details */}
            {colors[selectedColor] && (
              <div className="space-y-4">
                {(() => {
                  const explanation = getColorExplanation(colors[selectedColor], selectedColor);
                  return (
                    <>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 mb-2">Color Information</h4>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">HEX:</span>
                            <span className="ml-2 font-mono">{explanation.hex}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Category:</span>
                            <span className="ml-2 capitalize">{explanation.category}</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-green-50 rounded-lg p-4">
                        <h4 className="font-medium text-green-900 mb-2">Usage Recommendation</h4>
                        <p className="text-green-800 text-sm leading-relaxed">
                          {explanation.usageRecommendation}
                        </p>
                      </div>

                      <div className="bg-purple-50 rounded-lg p-4">
                        <h4 className="font-medium text-purple-900 mb-2">Branding Context</h4>
                        <p className="text-purple-800 text-sm leading-relaxed">
                          {explanation.brandingContext}
                        </p>
                      </div>

                      <div className="bg-yellow-50 rounded-lg p-4">
                        <h4 className="font-medium text-yellow-900 mb-2">Accessibility Notes</h4>
                        <p className="text-yellow-800 text-sm">
                          {explanation.accessibilityNotes}
                        </p>
                      </div>
                    </>
                  );
                })()}
              </div>
            )}
          </div>
        )}

        {activeTab === 'usage' && (
          <div className="space-y-6">
            {colors.map((color, index) => {
              const explanation = getColorExplanation(color, index);
              return (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className="w-10 h-10 rounded-lg"
                      style={{ backgroundColor: color.hex }}
                    />
                    <div>
                      <h4 className="font-medium text-gray-900">{color.name}</h4>
                      <p className="text-sm text-gray-600 capitalize">{color.category} Color</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h5 className="font-medium text-gray-900">Design Tips:</h5>
                    <ul className="space-y-2">
                      {explanation.designTips.map((tip, tipIndex) => (
                        <li key={tipIndex} className="flex items-start gap-2 text-sm text-gray-700">
                          <span className="text-blue-500 mt-1">•</span>
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'psychology' && (
          <div className="space-y-6">
            {colors.map((color, index) => {
              const explanation = getColorExplanation(color, index);
              return (
                <div key={index} className="bg-gradient-to-r from-gray-50 to-white rounded-lg p-6 border border-gray-200">
                  <div className="flex items-center gap-4 mb-4">
                    <div
                      className="w-12 h-12 rounded-xl shadow-lg"
                      style={{ backgroundColor: color.hex }}
                    />
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900">{color.name}</h4>
                      <p className="text-gray-600 capitalize">{color.category} Color</p>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg p-4 border border-gray-100">
                    <h5 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                      🧠 Psychological Impact
                    </h5>
                    <p className="text-gray-700 leading-relaxed">
                      {explanation.psychologyEffect}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ColorExplanationPanel;