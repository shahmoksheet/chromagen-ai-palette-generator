import React, { useState } from 'react';
import ImageUpload from './ImageUpload';
import { ImageGenerationRequest, GenerationResponse } from '../types/api';
import { colorAPI } from '../utils/api';

/**
 * Example component demonstrating how to use the ImageUpload component
 * This shows the integration with the API and proper error handling
 */
const ImageUploadExample: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [generatedPalette, setGeneratedPalette] = useState<GenerationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleImageUpload = async (request: ImageGenerationRequest) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Call the API to generate palette from image
      const response = await colorAPI.generateFromImage(
        request.image,
        request.userId,
        request.options
      );
      
      setGeneratedPalette(response);
      console.log('Generated palette:', response);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate palette';
      setError(errorMessage);
      console.error('Upload failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleValidationError = (errors: string[]) => {
    setError(errors.join(', '));
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Generate Palette from Image
        </h1>
        <p className="text-gray-600">
          Upload an image to extract colors and generate a harmonious palette
        </p>
      </div>

      <ImageUpload
        onImageUpload={handleImageUpload}
        isLoading={isLoading}
        onValidationError={handleValidationError}
        acceptedFormats={['image/jpeg', 'image/png', 'image/webp', 'image/gif']}
        maxSize={5 * 1024 * 1024} // 5MB
        maxDimensions={{ width: 4000, height: 4000 }}
        className="mb-8"
      />

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Upload Error</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Generated Palette Display */}
      {generatedPalette && (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-xl font-semibold text-gray-900">Generated Palette</h2>
            <p className="text-gray-600 mt-1">{generatedPalette.explanation}</p>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {generatedPalette.colors.map((color, index) => (
                <div key={index} className="text-center">
                  <div 
                    className="w-full h-20 rounded-lg mb-2 border border-gray-200"
                    style={{ backgroundColor: color.hex }}
                  />
                  <div className="space-y-1">
                    <p className="font-medium text-sm text-gray-900">{color.name}</p>
                    <p className="text-xs text-gray-600">{color.hex}</p>
                    <p className="text-xs text-gray-500 capitalize">{color.category}</p>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Accessibility Score */}
            <div className="mt-6 pt-6 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">Accessibility Score</h3>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  generatedPalette.accessibilityScore.overallScore === 'AAA' 
                    ? 'bg-green-100 text-green-800'
                    : generatedPalette.accessibilityScore.overallScore === 'AA'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {generatedPalette.accessibilityScore.overallScore}
                </span>
              </div>
              
              {generatedPalette.accessibilityScore.recommendations.length > 0 && (
                <div className="mt-3">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Recommendations:</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {generatedPalette.accessibilityScore.recommendations.map((rec, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-gray-400 mr-2">•</span>
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageUploadExample;