import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { paletteAPI } from '../utils/api';
import { ColorPalette } from '../types/api';
import ColorCard from './ColorCard';

interface PaletteHistoryProps {
  onPaletteSelect: (palette: ColorPalette) => void;
  userId: string;
}

const PaletteHistory: React.FC<PaletteHistoryProps> = ({ onPaletteSelect, userId }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const queryClient = useQueryClient();

  const { data: historyData, isLoading, error } = useQuery({
    queryKey: ['paletteHistory', userId, currentPage],
    queryFn: () => paletteAPI.getHistory(userId, currentPage, 12),
    enabled: !!userId,
  });

  const deleteMutation = useMutation({
    mutationFn: (paletteId: string) => paletteAPI.delete(paletteId),
    onSuccess: () => {
      toast.success('Palette deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['paletteHistory'] });
    },
    onError: (error: any) => {
      toast.error(error.error || 'Failed to delete palette');
    },
  });

  const filteredPalettes = historyData?.palettes?.filter(palette =>
    palette.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    palette.prompt?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const handleDelete = (paletteId: string, paletteName: string) => {
    if (window.confirm(`Are you sure you want to delete "${paletteName}"?`)) {
      deleteMutation.mutate(paletteId);
    }
  };

  if (error) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="text-center py-8">
          <div className="text-red-500 mb-2">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to load history</h3>
          <p className="text-gray-600">Please try again later</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-4 sm:mb-0">
          Saved Palettes
        </h3>
        
        {/* Search */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search palettes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <svg
            className="absolute left-3 top-2.5 w-5 h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-200 h-32 rounded-lg mb-3"></div>
              <div className="bg-gray-200 h-4 rounded mb-2"></div>
              <div className="bg-gray-200 h-3 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      ) : filteredPalettes.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm ? 'No palettes found' : 'No saved palettes yet'}
          </h3>
          <p className="text-gray-600">
            {searchTerm 
              ? 'Try adjusting your search terms' 
              : 'Generate your first palette to see it here'
            }
          </p>
        </div>
      ) : (
        <>
          {/* Palette Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
            {filteredPalettes.map((palette) => (
              <div key={palette.id} className="group">
                <div className="bg-gray-50 rounded-xl p-4 hover:shadow-lg transition-all duration-300">
                  {/* Color Preview */}
                  <div className="flex h-16 rounded-lg overflow-hidden mb-3">
                    {palette.colors.slice(0, 5).map((color, index) => (
                      <div
                        key={index}
                        className="flex-1 cursor-pointer hover:scale-105 transition-transform"
                        style={{ backgroundColor: color.hex }}
                        title={`${color.name}: ${color.hex}`}
                        onClick={() => navigator.clipboard.writeText(color.hex)}
                      />
                    ))}
                  </div>

                  {/* Palette Info */}
                  <div className="mb-3">
                    <h4 className="font-medium text-gray-900 mb-1 truncate">
                      {palette.name}
                    </h4>
                    {palette.prompt && (
                      <p className="text-sm text-gray-600 line-clamp-2">
                        "{palette.prompt}"
                      </p>
                    )}
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-gray-500">
                        {new Date(palette.createdAt).toLocaleDateString()}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        palette.accessibilityScore.overallScore === 'AAA' 
                          ? 'bg-green-100 text-green-800'
                          : palette.accessibilityScore.overallScore === 'AA'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        WCAG {palette.accessibilityScore.overallScore}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => onPaletteSelect(palette)}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm py-2 px-3 rounded-lg transition-colors"
                    >
                      Use Palette
                    </button>
                    <button
                      onClick={() => handleDelete(palette.id, palette.name)}
                      className="bg-red-100 hover:bg-red-200 text-red-600 p-2 rounded-lg transition-colors"
                      title="Delete palette"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {historyData && historyData.totalPages > 1 && (
            <div className="flex justify-center items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Previous
              </button>
              
              <span className="px-4 py-2 text-sm text-gray-600">
                Page {currentPage} of {historyData.totalPages}
              </span>
              
              <button
                onClick={() => setCurrentPage(p => Math.min(historyData.totalPages, p + 1))}
                disabled={currentPage === historyData.totalPages}
                className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default PaletteHistory;