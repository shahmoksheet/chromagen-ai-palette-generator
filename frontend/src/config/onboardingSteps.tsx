import React from 'react';
import { OnboardingStep } from '../components/OnboardingFlow';

export const getOnboardingSteps = (): OnboardingStep[] => [
  {
    id: 'welcome',
    title: 'Welcome to ChromaGen! 🎨',
    content: (
      <div className="space-y-3">
        <p>
          ChromaGen is an AI-powered color palette generator that creates beautiful, 
          accessible color schemes from your ideas and images.
        </p>
        <p>
          Let's take a quick tour to help you get the most out of the tool!
        </p>
        <div className="bg-blue-50 p-3 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>💡 Tip:</strong> You can restart this tour anytime from the help menu.
          </p>
        </div>
      </div>
    )
  },
  {
    id: 'prompt-input',
    title: 'Start with a Prompt',
    target: '[data-onboarding="prompt-input"]',
    content: (
      <div className="space-y-3">
        <p>
          Describe the mood, theme, or style you want for your color palette. 
          The AI will understand your creative vision and generate harmonious colors.
        </p>
        <div className="bg-green-50 p-3 rounded-lg">
          <p className="text-sm text-green-800 font-medium mb-1">Try examples like:</p>
          <ul className="text-sm text-green-700 space-y-1">
            <li>• "Energetic fitness brand inspired by sunrise"</li>
            <li>• "Calm meditation app with nature vibes"</li>
            <li>• "Professional corporate website"</li>
          </ul>
        </div>
      </div>
    ),
    action: {
      text: 'Try It',
      onClick: () => {
        const input = document.querySelector('[data-onboarding="prompt-input"] input') as HTMLInputElement;
        if (input) {
          input.focus();
          input.value = 'Energetic fitness brand inspired by sunrise';
        }
      }
    }
  },
  {
    id: 'color-theory',
    title: 'Learn Color Theory',
    content: (
      <div className="space-y-3">
        <p>
          ChromaGen doesn't just generate colors—it teaches you why they work together. 
          Look for the <span className="inline-flex items-center">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </span> icons throughout the interface.
        </p>
        <div className="bg-purple-50 p-3 rounded-lg">
          <p className="text-sm text-purple-800">
            <strong>🎓 Educational Features:</strong> Hover over terms like "complementary," 
            "triadic," or "contrast ratio" to learn color theory concepts.
          </p>
        </div>
      </div>
    )
  },
  {
    id: 'accessibility',
    title: 'Accessibility First',
    content: (
      <div className="space-y-3">
        <p>
          Every palette is automatically checked for WCAG accessibility compliance. 
          We'll show you contrast ratios, color blindness simulations, and recommendations.
        </p>
        <div className="bg-blue-50 p-3 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>♿ Accessibility Features:</strong>
          </p>
          <ul className="text-sm text-blue-700 mt-1 space-y-1">
            <li>• WCAG AA/AAA compliance checking</li>
            <li>• Color blindness simulation</li>
            <li>• Contrast ratio calculations</li>
            <li>• Alternative color suggestions</li>
          </ul>
        </div>
      </div>
    )
  },
  {
    id: 'ai-reasoning',
    title: 'AI Reasoning',
    content: (
      <div className="space-y-3">
        <p>
          When you generate a palette, you'll see detailed explanations of why each 
          color was chosen, including color theory principles and psychological effects.
        </p>
        <div className="bg-indigo-50 p-3 rounded-lg">
          <p className="text-sm text-indigo-800">
            <strong>🤖 AI Insights:</strong> Learn about color harmony, emotional impact, 
            and usage recommendations for each color in your palette.
          </p>
        </div>
      </div>
    )
  },
  {
    id: 'export-options',
    title: 'Export Your Palettes',
    content: (
      <div className="space-y-3">
        <p>
          Once you're happy with your palette, export it in multiple formats for 
          seamless integration into your design workflow.
        </p>
        <div className="bg-green-50 p-3 rounded-lg">
          <p className="text-sm text-green-800 font-medium mb-1">Available formats:</p>
          <ul className="text-sm text-green-700 space-y-1">
            <li>• CSS/SCSS variables</li>
            <li>• JSON data</li>
            <li>• Adobe ASE files</li>
            <li>• Sketch palettes</li>
          </ul>
        </div>
      </div>
    )
  },
  {
    id: 'get-started',
    title: 'Ready to Create! 🚀',
    content: (
      <div className="space-y-3">
        <p>
          You're all set! Start by entering a prompt or uploading an image. 
          Remember to explore the educational tooltips and accessibility features.
        </p>
        <div className="bg-yellow-50 p-3 rounded-lg">
          <p className="text-sm text-yellow-800">
            <strong>💡 Pro Tips:</strong>
          </p>
          <ul className="text-sm text-yellow-700 mt-1 space-y-1">
            <li>• Be specific in your prompts for better results</li>
            <li>• Check accessibility scores before finalizing</li>
            <li>• Save palettes you like for future reference</li>
            <li>• Experiment with different harmony types</li>
          </ul>
        </div>
      </div>
    )
  }
];

export const getQuickTips = () => [
  {
    id: 'color-theory-basics',
    title: 'Color Theory Basics',
    content: 'Understanding color relationships helps create more effective designs.',
    category: 'theory'
  },
  {
    id: 'accessibility-importance',
    title: 'Why Accessibility Matters',
    content: 'Accessible colors ensure your designs work for everyone, including users with visual impairments.',
    category: 'accessibility'
  },
  {
    id: 'prompt-writing',
    title: 'Writing Better Prompts',
    content: 'Include mood, industry, and specific color preferences for more targeted results.',
    category: 'usage'
  },
  {
    id: 'contrast-ratios',
    title: 'Understanding Contrast',
    content: 'Higher contrast ratios improve readability and meet accessibility standards.',
    category: 'accessibility'
  }
];