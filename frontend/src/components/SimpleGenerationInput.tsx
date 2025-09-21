import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { colorAPI } from '../utils/api';
import { TextGenerationRequest, GenerationResponse } from '../types/api';

interface SimpleGenerationInputProps {
  onGenerated: (response: GenerationResponse) => void;
}

const SimpleGenerationInput: React.FC<SimpleGenerationInputProps> = ({ onGenerated }) => {
  const [prompt, setPrompt] = useState('');

  // Text generation mutation
  const textMutation = useMutation({
    mutationFn: async (request: TextGenerationRequest) => {
      console.log('🔄 Making API request:', request);
      const response = await colorAPI.generateFromText(request);
      console.log('✅ API response received:', response);
      return response;
    },
    onSuccess: (response: GenerationResponse) => {
      console.log('🎉 Generation successful:', response);
      toast.success(`Generated "${response.name}"!`);
      onGenerated(response);
      setPrompt('');
    },
    onError: (error: any) => {
      console.error('❌ Generation failed:', error);
      toast.error(error.error || 'Failed to generate palette');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!prompt.trim()) {
      toast.error('Please enter a description');
      return;
    }

    console.log('🚀 Starting generation with prompt:', prompt.trim());

    textMutation.mutate({
      prompt: prompt.trim(),
      userId: `session_${Date.now()}`,
    });
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <div className="text-center mb-6">
        <h3 className="text-2xl font-semibold text-gray-900 mb-2">
          Generate Your Color Palette
        </h3>
        <p className="text-gray-600">
          Describe your ideal color scheme
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="prompt" className="block text-sm font-medium text-gray-700 mb-2">
            Describe your color palette
          </label>
          <textarea
            id="prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g., Modern tech startup with trustworthy blues..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            rows={3}
            disabled={textMutation.isPending}
          />
        </div>

        <button
          type="submit"
          disabled={textMutation.isPending || !prompt.trim()}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          {textMutation.isPending ? (
            <>
              <svg className="animate-spin w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Generating...
            </>
          ) : (
            'Generate Palette'
          )}
        </button>
      </form>

      {/* Quick Examples */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-2">
        {[
          'Ocean blue theme',
          'Warm sunset colors',
          'Modern corporate',
          'Nature inspired'
        ].map((example, index) => (
          <button
            key={index}
            onClick={() => setPrompt(example)}
            className="text-left p-2 bg-gray-50 rounded border hover:bg-gray-100 transition-colors text-sm"
            disabled={textMutation.isPending}
          >
            "{example}"
          </button>
        ))}
      </div>
    </div>
  );
};

export default SimpleGenerationInput;