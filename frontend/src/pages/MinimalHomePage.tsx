import React, { useState } from 'react';
import toast from 'react-hot-toast';
import SimpleGenerationInput from '../components/SimpleGenerationInput';
import ErrorBoundary from '../components/ErrorBoundary';
import { GenerationResponse, ColorPalette } from '../types/api';

const MinimalHomePage: React.FC = () => {
  const [generatedPalette, setGeneratedPalette] = useState<ColorPalette | null>(null);

  const handlePaletteGenerated = (response: GenerationResponse) => {
    try {
      console.log('🎨 Palette generated:', response);
      
      const palette: ColorPalette = {
        id: response.id,
        name: response.name,
        prompt: response.prompt,
        colors: response.colors,
        accessibilityScore: response.accessibilityScore,
        createdAt: new Date(response.createdAt),
        updatedAt: new Date(response.updatedAt),
      };
      
      setGeneratedPalette(palette);
      toast.success(`Generated "${palette.name}"!`);
      
    } catch (error) {
      console.error('Error handling palette:', error);
      toast.error('Failed to process palette');
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`Copied ${text}!`);
    } catch (error) {
      toast.error('Failed to copy');
    }
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              ChromaGen
            </h1>
            <p className="text-gray-600">
              AI-Powered Color Palette Generator
            </p>
          </div>

          {/* Generation Input */}
          <div className="mb-8">
            <SimpleGenerationInput onGenerated={handlePaletteGenerated} />
          </div>

          {/* Generated Palette Display */}
          {generatedPalette && (
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                  {generatedPalette.name}
                </h2>
                <p className="text-gray-600">
                  "{generatedPalette.prompt}"
                </p>
              </div>

              {/* Color Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
                {generatedPalette.colors.map((color, index) => (
                  <div key={index} className="text-center">
                    <div
                      className="w-full h-24 rounded-lg cursor-pointer border-2 border-gray-200 hover:border-gray-300 transition-colors mb-2"
                      style={{ backgroundColor: color.hex }}
                      onClick={() => copyToClipboard(color.hex)}
                      title={`Click to copy ${color.hex}`}
                    />
                    <h4 className="font-medium text-gray-900 text-sm mb-1">
                      {color.name}
                    </h4>
                    <p className="text-xs font-mono text-gray-600 mb-1">
                      {color.hex}
                    </p>
                    <p className="text-xs text-gray-500 capitalize">
                      {color.category}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      {color.usage}
                    </p>
                  </div>
                ))}
              </div>

              {/* Accessibility Score */}
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                  generatedPalette.accessibilityScore.overallScore === 'AAA' 
                    ? 'bg-green-100 text-green-800'
                    : generatedPalette.accessibilityScore.overallScore === 'AA'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  WCAG {generatedPalette.accessibilityScore.overallScore}
                </span>
                <p className="text-sm text-gray-600 mt-2">
                  {generatedPalette.accessibilityScore.passedChecks} of {generatedPalette.accessibilityScore.totalChecks} colors meet accessibility standards
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default MinimalHomePage;