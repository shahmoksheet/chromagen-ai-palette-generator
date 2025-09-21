import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  useGenerateFromText, 
  useGenerateFromImage, 
  usePaletteHistory, 
  useSavePalette,
  useDeletePalette,
  useExportPalette,
  useConnectionStatus,
  getSessionId 
} from '../services/apiService';
import LoadingSpinner from './LoadingSpinner';
import { GenerationResponse } from '../types/api';

const ApiIntegrationDemo: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [generatedPalette, setGeneratedPalette] = useState<GenerationResponse | null>(null);
  
  const sessionId = getSessionId();
  const { isOnline } = useConnectionStatus();
  
  // API hooks
  const generateFromText = useGenerateFromText({
    onSuccess: (data) => {
      setGeneratedPalette(data);
    },
  });
  
  const generateFromImage = useGenerateFromImage({
    onSuccess: (data) => {
      setGeneratedPalette(data);
    },
  });
  
  const { data: paletteHistory, isLoading: historyLoading } = usePaletteHistory(sessionId);
  
  const savePalette = useSavePalette();
  const deletePalette = useDeletePalette();
  const exportPalette = useExportPalette();

  const handleTextGeneration = () => {
    if (!prompt.trim()) return;
    
    generateFromText.mutate({
      prompt: prompt.trim(),
      userId: sessionId,
      options: {
        colorCount: 5,
        harmonyType: 'complementary',
        accessibilityLevel: 'AA',
      },
    });
  };

  const handleImageGeneration = () => {
    if (!selectedFile) return;
    
    generateFromImage.mutate({
      file: selectedFile,
      userId: sessionId,
      options: {
        colorCount: 6,
        harmonyType: 'analogous',
      },
    });
  };

  const handleSavePalette = () => {
    if (!generatedPalette) return;
    
    savePalette.mutate({
      name: generatedPalette.name,
      prompt: generatedPalette.prompt,
      colors: generatedPalette.colors,
      accessibilityScore: generatedPalette.accessibilityScore,
    });
  };

  const handleExportPalette = (format: string) => {
    if (!generatedPalette) return;
    
    exportPalette.mutate({
      paletteId: generatedPalette.id,
      format,
    });
  };

  const handleDeletePalette = (paletteId: string) => {
    deletePalette.mutate(paletteId);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          API Integration Demo
        </h1>
        <p className="text-gray-600">
          Demonstrating frontend-backend API integration with error handling and loading states
        </p>
        
        {/* Connection Status */}
        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm mt-4 ${
          isOnline ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`} />
          {isOnline ? 'Connected' : 'Offline'}
        </div>
      </div>

      {/* Text Generation Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-lg shadow-lg p-6"
      >
        <h2 className="text-xl font-semibold mb-4">Generate from Text</h2>
        <div className="space-y-4">
          <div>
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Enter a color palette prompt..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={generateFromText.isPending}
            />
          </div>
          <button
            onClick={handleTextGeneration}
            disabled={!prompt.trim() || generateFromText.isPending || !isOnline}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {generateFromText.isPending ? (
              <LoadingSpinner size="sm" />
            ) : (
              'Generate Palette'
            )}
          </button>
          
          {generateFromText.error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              Error: {generateFromText.error.error}
            </div>
          )}
        </div>
      </motion.div>

      {/* Image Generation Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-lg shadow-lg p-6"
      >
        <h2 className="text-xl font-semibold mb-4">Generate from Image</h2>
        <div className="space-y-4">
          <div>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              disabled={generateFromImage.isPending}
            />
          </div>
          <button
            onClick={handleImageGeneration}
            disabled={!selectedFile || generateFromImage.isPending || !isOnline}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {generateFromImage.isPending ? (
              <LoadingSpinner size="sm" />
            ) : (
              'Generate from Image'
            )}
          </button>
          
          {generateFromImage.error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              Error: {generateFromImage.error.error}
            </div>
          )}
        </div>
      </motion.div>

      {/* Generated Palette Display */}
      {generatedPalette && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-lg p-6"
        >
          <h2 className="text-xl font-semibold mb-4">Generated Palette</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium">{generatedPalette.name}</h3>
              <p className="text-gray-600 text-sm">{generatedPalette.prompt}</p>
            </div>
            
            <div className="flex flex-wrap gap-4">
              {generatedPalette.colors.map((color, index) => (
                <div key={index} className="text-center">
                  <div
                    className="w-16 h-16 rounded-lg shadow-md cursor-pointer"
                    style={{ backgroundColor: color.hex }}
                    onClick={() => navigator.clipboard?.writeText(color.hex)}
                    title={`Click to copy ${color.hex}`}
                  />
                  <p className="text-xs mt-1 font-mono">{color.hex}</p>
                  <p className="text-xs text-gray-500">{color.name}</p>
                </div>
              ))}
            </div>
            
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={handleSavePalette}
                disabled={savePalette.isPending}
                className="btn-secondary"
              >
                {savePalette.isPending ? <LoadingSpinner size="sm" /> : 'Save Palette'}
              </button>
              
              <button
                onClick={() => handleExportPalette('css')}
                disabled={exportPalette.isPending}
                className="btn-secondary"
              >
                Export CSS
              </button>
              
              <button
                onClick={() => handleExportPalette('json')}
                disabled={exportPalette.isPending}
                className="btn-secondary"
              >
                Export JSON
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Palette History */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-lg shadow-lg p-6"
      >
        <h2 className="text-xl font-semibold mb-4">Palette History</h2>
        
        {historyLoading ? (
          <LoadingSpinner message="Loading history..." />
        ) : paletteHistory?.palettes.length ? (
          <div className="space-y-4">
            {paletteHistory.palettes.slice(0, 5).map((palette) => (
              <div key={palette.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="flex gap-1">
                    {palette.colors.slice(0, 4).map((color, index) => (
                      <div
                        key={index}
                        className="w-6 h-6 rounded"
                        style={{ backgroundColor: color.hex }}
                      />
                    ))}
                  </div>
                  <div>
                    <p className="font-medium">{palette.name}</p>
                    <p className="text-sm text-gray-500">{palette.prompt}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleDeletePalette(palette.id)}
                  disabled={deletePalette.isPending}
                  className="text-red-600 hover:text-red-800 text-sm"
                >
                  Delete
                </button>
              </div>
            ))}
            
            {paletteHistory.total > 5 && (
              <p className="text-sm text-gray-500 text-center">
                Showing 5 of {paletteHistory.total} palettes
              </p>
            )}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">
            No saved palettes yet. Generate and save a palette to see it here.
          </p>
        )}
      </motion.div>

      {/* API Status Information */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-gray-50 rounded-lg p-6"
      >
        <h2 className="text-xl font-semibold mb-4">API Integration Status</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <p><strong>Session ID:</strong> {sessionId}</p>
            <p><strong>Connection:</strong> {isOnline ? '✅ Online' : '❌ Offline'}</p>
          </div>
          <div>
            <p><strong>Text Generation:</strong> {generateFromText.isPending ? '⏳ Loading' : '✅ Ready'}</p>
            <p><strong>Image Generation:</strong> {generateFromImage.isPending ? '⏳ Loading' : '✅ Ready'}</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ApiIntegrationDemo;