// Main homepage component

import React, { useState, useEffect, useMemo } from 'react';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import PromptInput from '../components/PromptInput';
import ColorReasoningPanel, { ColorReasoning } from '../components/ColorReasoningPanel';
import HelpPanel from '../components/HelpPanel';
import OnboardingFlow from '../components/OnboardingFlow';
import WCAGGuidePanel from '../components/WCAGGuidePanel';
import ResponsiveLayout from '../components/ResponsiveLayout';
import MobileNavigation from '../components/MobileNavigation';
import ResponsiveColorGrid from '../components/ResponsiveColorGrid';
import ExportDropdown from '../components/ExportDropdown';
import ColorCard from '../components/ColorCard';
import GenerationInput from '../components/GenerationInput';
import PaletteHistory from '../components/PaletteHistory';
import ColorExplanationPanel from '../components/ColorExplanationPanel';
import WCAGAlternatives from '../components/WCAGAlternatives';
import ConnectionStatus from '../components/ConnectionStatus';
import ErrorBoundary from '../components/ErrorBoundary';
import { useOnboarding } from '../hooks/useOnboarding';
import { getOnboardingSteps } from '../config/onboardingSteps';
import { colorAPI, paletteAPI } from '../utils/api';
import { TextGenerationRequest, GenerationResponse, ColorPalette } from '../types/api';
import { performanceMonitor, measureAsync } from '../utils/performance';
import { useScreenSize, useMobileInteractions, getResponsiveTextClasses, getResponsiveSpacingClasses } from '../utils/responsive';

const HomePage: React.FC = React.memo(() => {
  const [generatedPalette, setGeneratedPalette] = useState<ColorPalette | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [colorReasoning, setColorReasoning] = useState<ColorReasoning[]>([]);
  const [overallExplanation, setOverallExplanation] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'generate' | 'history'>('generate');
  const [userId] = useState(`session_${Date.now()}`);
  
  // Responsive hooks
  const { isMobile, isDesktop } = useScreenSize();
  const { getTouchProps } = useMobileInteractions();
  
  // Onboarding setup
  const onboarding = useOnboarding({
    steps: getOnboardingSteps(),
    autoStart: true
  });

  // Monitor component performance and test API connection
  useEffect(() => {
    const renderStart = performance.now();
    
    // Test API connection on component mount
    const testConnection = async () => {
      try {
        const result = await colorAPI.testConnection();
        console.log('✅ API Connection Test:', result);
        // Don't show success toast to avoid spam
      } catch (error) {
        console.error('❌ API Connection Failed:', error);
        setError('Connection lost. Please check if the backend is running on port 3333.');
      }
    };
    
    testConnection();
    
    // Set up periodic connection check
    const connectionCheck = setInterval(testConnection, 30000); // Check every 30 seconds
    
    return () => {
      clearInterval(connectionCheck);
      const renderTime = performance.now() - renderStart;
      performanceMonitor.recordMetric('homepage_render', renderTime);
    };
  }, []);

  // Memoize feature cards to prevent unnecessary re-renders
  const featureCards = useMemo(() => [
    {
      icon: (
        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m-9 0h10m-10 0a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V6a2 2 0 00-2-2" />
        </svg>
      ),
      title: 'Multi-Modal Input',
      description: 'Generate palettes from text descriptions or upload images to extract color schemes.',
      bgColor: 'bg-blue-100',
    },
    {
      icon: (
        <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      title: 'Accessibility First',
      description: 'Automatic WCAG compliance checking with color blindness simulation and recommendations.',
      bgColor: 'bg-green-100',
    },
    {
      icon: (
        <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
      title: 'Educational Insights',
      description: 'Learn color theory and understand the reasoning behind each generated palette.',
      bgColor: 'bg-purple-100',
    },
  ], []);

  // Mutation for generating palettes with performance monitoring
  const generatePaletteMutation = useMutation({
    mutationFn: (request: TextGenerationRequest) => 
      measureAsync('palette_generation_api', () => colorAPI.generateFromText(request), {
        prompt_length: request.prompt.length,
        user_id: request.userId,
      }),
    onSuccess: (response: GenerationResponse) => {
      const palette: ColorPalette = {
        id: response.id,
        name: response.name,
        prompt: response.prompt,
        colors: response.colors,
        accessibilityScore: {
          ...response.accessibilityScore,
          passedChecks: response.accessibilityScore.contrastRatios ? 
            response.accessibilityScore.contrastRatios.filter(cr => cr.passes?.AA || cr.passes?.AAA).length : 
            response.accessibilityScore.passedChecks || 0,
          totalChecks: response.accessibilityScore.contrastRatios ? 
            response.accessibilityScore.contrastRatios.length : 
            response.accessibilityScore.totalChecks || 0,
        },
        createdAt: new Date(response.createdAt),
        updatedAt: new Date(response.updatedAt),
      };
      setGeneratedPalette(palette);
      setError(null);
      
      // Set AI reasoning and explanation
      setOverallExplanation(response.explanation || '');
      const reasoning: ColorReasoning[] = palette.colors.map(color => ({
        colorName: color.name,
        hex: color.hex,
        category: color.category,
        reasoning: color.usage || `This ${color.category} color provides excellent visual balance and ${color.category === 'primary' ? 'serves as the main brand color' : color.category === 'secondary' ? 'supports the primary colors' : 'adds visual interest and emphasis'}.`,
        harmonyType: 'complementary', // This would come from the AI response
        psychologicalEffect: getColorPsychology(color.hex),
        usageRecommendation: color.usage,
        accessibilityNotes: `Contrast ratio with white: ${color.accessibility.contrastWithWhite.toFixed(1)}:1, WCAG ${color.accessibility.wcagLevel}`
      }));
      setColorReasoning(reasoning);
      
      // Record performance metrics
      performanceMonitor.recordMetric('palette_generation_success', response.processingTime || 0, {
        color_count: palette.colors.length,
        accessibility_score: palette.accessibilityScore.overallScore,
      });
      
      toast.success(`Generated "${palette.name}" in ${response.processingTime}ms`);
    },
    onError: (error: any) => {
      console.error('Generation error details:', error);
      
      let errorMessage = 'Failed to generate palette';
      
      if (error.error) {
        errorMessage = error.error;
      } else if (error.message) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      setError(errorMessage);
      
      // Record error metrics
      performanceMonitor.recordMetric('palette_generation_error', 1, {
        error_type: error.code || 'unknown',
        error_message: errorMessage,
      });
      
      toast.error(`Generation failed: ${errorMessage}`);
    },
  });

  const handlePromptSubmit = async (request: TextGenerationRequest) => {
    console.log('Submitting prompt request:', request);
    setError(null);
    generatePaletteMutation.mutate(request);
  };

  const handlePaletteGenerated = (response: GenerationResponse) => {
    try {
      console.log('🎨 Palette generated:', response);
      console.log('🎨 Response colors:', response.colors);
      
      // Validate response
      if (!response || !response.colors || !Array.isArray(response.colors)) {
        throw new Error('Invalid response format');
      }
      
      // Convert response to ColorPalette format with safe defaults
      const palette: ColorPalette = {
        id: response.id || `palette_${Date.now()}`,
        name: response.name || 'Generated Palette',
        prompt: response.prompt || '',
        colors: response.colors.map(color => ({
          ...color,
          accessibility: color.accessibility || {
            contrastWithWhite: 4.5,
            contrastWithBlack: 4.5,
            wcagLevel: 'AA'
          }
        })),
        accessibilityScore: {
          overallScore: response.accessibilityScore?.overallScore || 'AA',
          passedChecks: response.accessibilityScore?.passedChecks || response.colors.length,
          totalChecks: response.accessibilityScore?.totalChecks || response.colors.length,
          recommendations: response.accessibilityScore?.recommendations || []
        },
        createdAt: new Date(response.createdAt || Date.now()),
        updatedAt: new Date(response.updatedAt || Date.now()),
      };
      
      setGeneratedPalette(palette);
      setError(null);
      
      console.log('🎨 Palette set to state:', palette);
      
      // Set explanation
      setOverallExplanation(response.explanation || 'Generated color palette with harmonious colors.');
      
      // Set color reasoning with error handling
      try {
        const reasoning: ColorReasoning[] = palette.colors.map(color => ({
          colorName: color.name || 'Unnamed Color',
          hex: color.hex || '#000000',
          category: color.category || 'accent',
          reasoning: color.usage || `This ${color.category || 'accent'} color provides visual balance.`,
          harmonyType: 'complementary',
          psychologicalEffect: safeGetColorPsychology(color.hex),
          usageRecommendation: color.usage || 'General use',
          accessibilityNotes: `Contrast: ${color.accessibility?.contrastWithWhite?.toFixed(1) || 'N/A'}:1, WCAG ${color.accessibility?.wcagLevel || 'Unknown'}`
        }));
        setColorReasoning(reasoning);
      } catch (reasoningError) {
        console.warn('Error setting color reasoning:', reasoningError);
        setColorReasoning([]);
      }
      
      // Record performance metrics safely
      try {
        performanceMonitor.recordMetric('palette_generation_success', response.processingTime || 0, {
          color_count: palette.colors.length,
          accessibility_score: palette.accessibilityScore.overallScore,
        });
      } catch (metricsError) {
        console.warn('Error recording metrics:', metricsError);
      }
      
      toast.success(`Generated "${palette.name}"!`);
      
    } catch (error) {
      console.error('Error handling palette generation:', error);
      setError('Failed to process generated palette');
      toast.error('Failed to process generated palette');
    }
  };

  // Safe version of getColorPsychology that won't crash
  const safeGetColorPsychology = (hex: string): string => {
    try {
      return getColorPsychology(hex);
    } catch (error) {
      console.warn('Error getting color psychology:', error);
      return 'This color creates a balanced visual impression.';
    }
  };

  const getColorPsychology = (hex: string): string => {
    // Simple color psychology based on hue
    const rgb = hexToRgb(hex);
    if (!rgb) return 'This color evokes a sense of balance and harmony.';
    
    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
    const hue = hsl.h;
    
    if (hue >= 0 && hue < 30) return 'Red evokes energy, passion, and urgency. Great for calls-to-action.';
    if (hue >= 30 && hue < 60) return 'Orange represents enthusiasm, creativity, and warmth. Perfect for friendly brands.';
    if (hue >= 60 && hue < 120) return 'Yellow and green suggest growth, nature, and optimism. Ideal for eco-friendly brands.';
    if (hue >= 120 && hue < 180) return 'Green represents nature, growth, and tranquility. Great for health and wellness.';
    if (hue >= 180 && hue < 240) return 'Blue conveys trust, professionalism, and calm. Perfect for corporate and tech brands.';
    if (hue >= 240 && hue < 300) return 'Purple suggests luxury, creativity, and mystery. Ideal for premium brands.';
    return 'This color creates a sophisticated and balanced impression.';
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

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`Copied ${text} to clipboard`);
    } catch (error) {
      toast.error('Failed to copy to clipboard');
    }
  };

  // const isGenerating = generatePaletteMutation.isPending;

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <ConnectionStatus />
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-30">
        <ResponsiveLayout>
          <div className="flex justify-between items-center py-4 sm:py-6">
            <div className="flex items-center">
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg mr-2 sm:mr-3"></div>
              <h1 className={getResponsiveTextClasses('text-xl', 'text-2xl', 'text-2xl') + ' font-bold text-gray-900'}>
                ChromaGen
              </h1>
            </div>
            
            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-6 lg:space-x-8">
              <button
                onClick={() => {
                  const featuresSection = document.getElementById('features');
                  featuresSection?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                Features
              </button>
              <button
                onClick={() => {
                  const aboutSection = document.getElementById('about');
                  aboutSection?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                About
              </button>
              <button
                onClick={() => setShowHelp(!showHelp)}
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                Help
              </button>
              <button
                onClick={onboarding.startOnboarding}
                className="bg-purple-100 text-purple-700 hover:bg-purple-200 px-3 py-1 rounded-md transition-colors font-medium"
              >
                Take Tour
              </button>
            </nav>

            {/* Mobile Navigation */}
            <MobileNavigation
              onHelpClick={() => setShowHelp(!showHelp)}
              onTourClick={onboarding.startOnboarding}
            />
          </div>
        </ResponsiveLayout>
      </header>

      {/* Hero Section */}
      <main>
        <ResponsiveLayout className={getResponsiveSpacingClasses('py-8', 'py-12', 'py-16')}>
          <div className="text-center mb-12 sm:mb-16">
            <h2 className={`${getResponsiveTextClasses('text-3xl', 'text-5xl', 'text-6xl')} font-bold text-gray-900 mb-4 sm:mb-6 leading-tight`}>
              AI-Powered Color
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent block sm:inline">
                {isMobile ? 'Palette Generator' : ' Palette Generator'}
              </span>
            </h2>
            <p className={`${getResponsiveTextClasses('text-lg', 'text-xl', 'text-xl')} text-gray-600 max-w-3xl mx-auto mb-6 sm:mb-8 px-4 sm:px-0`}>
              Transform your creative vision into beautiful, accessible color palettes.
              Generate harmonious colors from text prompts or images with automatic
              WCAG compliance checking.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4 sm:px-0">
              <button 
                {...getTouchProps()}
                className={`${isMobile ? 'min-h-[48px]' : ''} bg-purple-600 hover:bg-purple-700 text-white font-medium px-6 sm:px-8 py-3 sm:py-4 rounded-lg transition-colors text-base sm:text-lg`}
              >
                Start Creating
              </button>
              <button 
                {...getTouchProps()}
                className={`${isMobile ? 'min-h-[48px]' : ''} bg-white hover:bg-gray-50 text-gray-700 font-medium px-6 sm:px-8 py-3 sm:py-4 rounded-lg border border-gray-300 transition-colors text-base sm:text-lg`}
              >
                View Examples
              </button>
            </div>
          </div>

          {/* Feature Cards */}
          <section id="features" className="scroll-mt-20">
            <div className="text-center mb-8 sm:mb-12">
              <h2 className={`${getResponsiveTextClasses('text-2xl', 'text-3xl', 'text-4xl')} font-bold text-gray-900 mb-4`}>
                Powerful Features
              </h2>
              <p className={`${getResponsiveTextClasses('text-base', 'text-lg', 'text-xl')} text-gray-600 max-w-2xl mx-auto px-4 sm:px-0`}>
                Everything you need to create beautiful, accessible color palettes
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 mb-12 sm:mb-16 px-4 sm:px-0">
              {featureCards.map((card, index) => (
                <div key={index} className="bg-white rounded-xl shadow-lg p-6 text-center hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                  <div className={`w-10 h-10 sm:w-12 sm:h-12 ${card.bgColor} rounded-lg mx-auto mb-3 sm:mb-4 flex items-center justify-center`}>
                    {card.icon}
                  </div>
                  <h3 className={`${getResponsiveTextClasses('text-lg', 'text-xl', 'text-xl')} font-semibold mb-2`}>
                    {card.title}
                  </h3>
                  <p className={`${getResponsiveTextClasses('text-sm', 'text-base', 'text-base')} text-gray-600`}>
                    {card.description}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Tab Navigation */}
          <div className="flex justify-center mb-8">
            <div className="bg-white rounded-xl shadow-lg p-1 flex">
              <button
                onClick={() => setActiveTab('generate')}
                className={`px-6 py-3 rounded-lg font-medium transition-all ${
                  activeTab === 'generate'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                🎨 Generate Palette
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`px-6 py-3 rounded-lg font-medium transition-all ${
                  activeTab === 'history'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                📚 Saved Palettes
              </button>
            </div>
          </div>

          {/* Main Interface */}
          {activeTab === 'generate' ? (
            <div className="mb-12 sm:mb-16">
              <GenerationInput
                onGenerated={handlePaletteGenerated}
                isLoading={false}
              />
            </div>
          ) : (
            <div className="mb-12 sm:mb-16">
              <PaletteHistory
                userId={userId}
                onPaletteSelect={(palette) => {
                  setGeneratedPalette(palette);
                  setActiveTab('generate');
                  toast.success('Palette loaded!');
                }}
              />
            </div>
          )}



          {/* Generated Palette Display */}
          {generatedPalette && (
            <div className="space-y-6 sm:space-y-8 mb-12 sm:mb-16">
              <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 lg:p-8 mx-4 sm:mx-0">
                <div className="text-center mb-6 sm:mb-8">
                  <h3 className={`${getResponsiveTextClasses('text-xl', 'text-2xl', 'text-2xl')} font-semibold text-gray-900 mb-2`}>
                    {generatedPalette.name}
                  </h3>
                  <p className={`${getResponsiveTextClasses('text-sm', 'text-base', 'text-base')} text-gray-600 px-2 sm:px-0`}>
                    Generated from: "{generatedPalette.prompt}"
                  </p>
                </div>
                
                {/* Enhanced Color Grid */}
                <div className="mb-6 sm:mb-8">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                    {generatedPalette.colors && generatedPalette.colors.length > 0 ? (
                      generatedPalette.colors.map((color, index) => (
                        <ColorCard
                          key={index}
                          color={color}
                          showDetails={true}
                        />
                      ))
                    ) : (
                      <div className="col-span-full text-center py-8">
                        <p className="text-gray-500">No colors to display</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Accessibility Score */}
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2 gap-2">
                    <span className={`${getResponsiveTextClasses('text-sm', 'text-base', 'text-base')} font-medium text-gray-900`}>
                      Accessibility Score
                    </span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium self-start sm:self-auto ${
                      generatedPalette.accessibilityScore.overallScore === 'AAA' 
                        ? 'bg-green-100 text-green-800'
                        : generatedPalette.accessibilityScore.overallScore === 'AA'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      WCAG {generatedPalette.accessibilityScore.overallScore}
                    </span>
                  </div>
                  {generatedPalette.accessibilityScore.recommendations.length > 0 && (
                    <div className={`${getResponsiveTextClasses('text-xs', 'text-sm', 'text-sm')} text-gray-600`}>
                      <strong>Recommendations:</strong>
                      <ul className="list-disc list-inside mt-1 space-y-1">
                        {generatedPalette.accessibilityScore.recommendations.map((rec, index) => (
                          <li key={index}>{rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <ExportDropdown 
                    palette={generatedPalette}
                    onExportSuccess={(format, filename) => {
                      toast.success(`Exported as ${filename}`);
                    }}
                    onExportError={(format, error) => {
                      toast.error(`Export failed: ${error}`);
                    }}
                  />
                  <button 
                    {...getTouchProps()}
                    onClick={async () => {
                      try {
                        await paletteAPI.save({
                          name: generatedPalette.name,
                          prompt: generatedPalette.prompt,
                          colors: generatedPalette.colors,
                          accessibilityScore: generatedPalette.accessibilityScore
                        });
                        toast.success('Palette saved to history!');
                      } catch (error) {
                        toast.error('Failed to save palette');
                      }
                    }}
                    className={`${isMobile ? 'min-h-[48px]' : ''} bg-white hover:bg-gray-50 text-gray-700 font-medium px-6 py-3 rounded-lg border border-gray-300 transition-colors`}
                  >
                    Save to History
                  </button>
                  <button 
                    {...getTouchProps()}
                    onClick={() => {
                      // Generate variation logic
                      if (generatedPalette.prompt) {
                        const variationPrompt = `${generatedPalette.prompt} (variation)`;
                        handlePromptSubmit({
                          prompt: variationPrompt,
                          userId: 'session_' + Date.now(),
                        });
                      }
                    }}
                    className={`${isMobile ? 'min-h-[48px]' : ''} bg-white hover:bg-gray-50 text-gray-700 font-medium px-6 py-3 rounded-lg border border-gray-300 transition-colors`}
                  >
                    Generate Variation
                  </button>
                </div>
              </div>

              {/* WCAG Alternatives Panel */}
              <div className="mx-4 sm:mx-0">
                <WCAGAlternatives
                  originalPalette={generatedPalette.colors}
                  onSelectAlternative={(alternativePalette) => {
                    const updatedPalette = {
                      ...generatedPalette,
                      colors: alternativePalette,
                      name: `${generatedPalette.name} (Accessible)`
                    };
                    setGeneratedPalette(updatedPalette);
                    toast.success('Switched to accessible palette!');
                  }}
                />
              </div>

              {/* Enhanced Color Explanation Panel */}
              <div className="mx-4 sm:mx-0">
                <ColorExplanationPanel
                  colors={generatedPalette.colors}
                  overallExplanation={overallExplanation}
                  userPrompt={generatedPalette.prompt || ''}
                />
              </div>

              {/* WCAG Guide Panel */}
              <div className="mx-4 sm:mx-0">
                <WCAGGuidePanel compact={!isDesktop} />
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-12 sm:mb-16 mx-4 sm:mx-0">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="w-5 h-5 text-red-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className={`${getResponsiveTextClasses('text-sm', 'text-sm', 'text-sm')} font-medium text-red-800`}>
                    Generation Failed
                  </h3>
                  <div className={`mt-2 ${getResponsiveTextClasses('text-sm', 'text-sm', 'text-sm')} text-red-700`}>
                    {error}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* About Section */}
          <section id="about" className="scroll-mt-20 mb-12 sm:mb-16">
            <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 lg:p-12 mx-4 sm:mx-0">
              <div className="text-center mb-8">
                <h2 className={`${getResponsiveTextClasses('text-2xl', 'text-3xl', 'text-4xl')} font-bold text-gray-900 mb-4`}>
                  About ChromaGen
                </h2>
                <p className={`${getResponsiveTextClasses('text-base', 'text-lg', 'text-xl')} text-gray-600 max-w-3xl mx-auto`}>
                  ChromaGen is an AI-powered color palette generator designed to streamline your design workflow while ensuring accessibility compliance.
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-12">
                <div>
                  <h3 className={`${getResponsiveTextClasses('text-lg', 'text-xl', 'text-xl')} font-semibold text-gray-900 mb-4`}>
                    How It Works
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-start">
                      <div className="w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-sm font-semibold mr-3 mt-0.5">1</div>
                      <p className={`${getResponsiveTextClasses('text-sm', 'text-base', 'text-base')} text-gray-600`}>
                        Enter a text description or upload an image
                      </p>
                    </div>
                    <div className="flex items-start">
                      <div className="w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-sm font-semibold mr-3 mt-0.5">2</div>
                      <p className={`${getResponsiveTextClasses('text-sm', 'text-base', 'text-base')} text-gray-600`}>
                        AI generates harmonious colors with accessibility checking
                      </p>
                    </div>
                    <div className="flex items-start">
                      <div className="w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-sm font-semibold mr-3 mt-0.5">3</div>
                      <p className={`${getResponsiveTextClasses('text-sm', 'text-base', 'text-base')} text-gray-600`}>
                        Export in multiple formats for your design tools
                      </p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className={`${getResponsiveTextClasses('text-lg', 'text-xl', 'text-xl')} font-semibold text-gray-900 mb-4`}>
                    Key Benefits
                  </h3>
                  <ul className="space-y-2">
                    <li className="flex items-center">
                      <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className={`${getResponsiveTextClasses('text-sm', 'text-base', 'text-base')} text-gray-600`}>
                        WCAG AA/AAA compliance checking
                      </span>
                    </li>
                    <li className="flex items-center">
                      <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className={`${getResponsiveTextClasses('text-sm', 'text-base', 'text-base')} text-gray-600`}>
                        Color blindness simulation
                      </span>
                    </li>
                    <li className="flex items-center">
                      <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className={`${getResponsiveTextClasses('text-sm', 'text-base', 'text-base')} text-gray-600`}>
                        Multiple export formats
                      </span>
                    </li>
                    <li className="flex items-center">
                      <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className={`${getResponsiveTextClasses('text-sm', 'text-base', 'text-base')} text-gray-600`}>
                        AI-powered color reasoning
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Help Panel - Now as a modal overlay */}
          {showHelp && (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center rounded-t-2xl">
                  <h2 className={`${getResponsiveTextClasses('text-xl', 'text-2xl', 'text-2xl')} font-bold text-gray-900`}>
                    Help & FAQ
                  </h2>
                  <button
                    onClick={() => setShowHelp(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="p-6">
                  <HelpPanel onStartOnboarding={onboarding.startOnboarding} />
                </div>
              </div>
            </div>
          )}
        </ResponsiveLayout>
      </main>

      {/* Onboarding Flow */}
      <OnboardingFlow
        steps={onboarding.steps}
        isVisible={onboarding.isVisible}
        onComplete={onboarding.completeOnboarding}
        onSkip={onboarding.skipOnboarding}
      />

      {/* Footer */}
      <footer className="bg-white border-t">
        <ResponsiveLayout className={getResponsiveSpacingClasses('py-6', 'py-8', 'py-8')}>
          <div className="text-center text-gray-600">
            <p className={getResponsiveTextClasses('text-sm', 'text-base', 'text-base')}>
              &copy; 2024 ChromaGen. Built for the Bit N Build International Hackathon.
            </p>
          </div>
        </ResponsiveLayout>
      </footer>
      </div>
    </ErrorBoundary>
  );
});

HomePage.displayName = 'HomePage';

export default HomePage;