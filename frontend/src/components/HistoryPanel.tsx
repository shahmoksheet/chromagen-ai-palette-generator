import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Copy,
  RefreshCw,
  Palette,
  Calendar,
  Star,
  MoreVertical,
  Eye,
  AlertTriangle,
  Grid,
  List,
  SortAsc,
  SortDesc,
} from 'lucide-react';
import { ColorPalette, GenerationOptions } from '../types/color';
// import VirtualScrollList from './VirtualScrollList'; // TODO: Implement virtual scrolling

interface HistoryPanelProps {
  palettes: ColorPalette[];
  currentPalette?: ColorPalette | null;
  className?: string;
  onPaletteSelect?: (palette: ColorPalette) => void;
  onPaletteDelete?: (paletteId: string) => void;
  onPaletteRegenerate?: (palette: ColorPalette, options?: Partial<GenerationOptions>) => void;
  onPaletteVariation?: (palette: ColorPalette, variationType: 'lighter' | 'darker' | 'complementary') => void;
  onPaletteDuplicate?: (palette: ColorPalette) => void;
}

interface FilterOptions {
  accessibilityLevel: 'all' | 'AAA' | 'AA' | 'FAIL';
  colorCount: 'all' | '3-5' | '6-8' | '9+';
  dateRange: 'all' | 'today' | 'week' | 'month';
  category: 'all' | 'favorites' | 'recent';
}

interface SortOptions {
  field: 'name' | 'createdAt' | 'updatedAt' | 'accessibilityScore';
  direction: 'asc' | 'desc';
}

interface PaginationState {
  currentPage: number;
  itemsPerPage: number;
  totalItems: number;
  totalPages: number;
}

interface ConfirmationDialog {
  isOpen: boolean;
  type: 'delete' | 'regenerate' | null;
  palette: ColorPalette | null;
  message: string;
}

const HistoryPanel: React.FC<HistoryPanelProps> = memo(({
  palettes,
  currentPalette,
  className = '',
  onPaletteSelect,
  onPaletteDelete,
  onPaletteRegenerate,
  onPaletteVariation,
  onPaletteDuplicate,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<FilterOptions>({
    accessibilityLevel: 'all',
    colorCount: 'all',
    dateRange: 'all',
    category: 'all',
  });
  const [sortOptions, setSortOptions] = useState<SortOptions>({
    field: 'createdAt',
    direction: 'desc',
  });
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  // const [selectedPalettes, setSelectedPalettes] = useState<Set<string>>(new Set()); // Reserved for future bulk operations
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [confirmationDialog, setConfirmationDialog] = useState<ConfirmationDialog>({
    isOpen: false,
    type: null,
    palette: null,
    message: '',
  });
  const [pagination, setPagination] = useState<PaginationState>({
    currentPage: 1,
    itemsPerPage: 12,
    totalItems: 0,
    totalPages: 0,
  });

  // Load favorites from localStorage
  useEffect(() => {
    const savedFavorites = localStorage.getItem('chromagen-favorites');
    if (savedFavorites) {
      try {
        const favoritesArray = JSON.parse(savedFavorites);
        setFavorites(new Set(favoritesArray));
      } catch (error) {
        console.error('Failed to load favorites:', error);
      }
    }
  }, []);

  // Save favorites to localStorage
  const saveFavorites = useCallback((newFavorites: Set<string>) => {
    try {
      localStorage.setItem('chromagen-favorites', JSON.stringify(Array.from(newFavorites)));
    } catch (error) {
      console.error('Failed to save favorites:', error);
    }
  }, []);

  // Filter and sort palettes
  const filteredAndSortedPalettes = useMemo(() => {
    let filtered = palettes.filter((palette) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesName = palette.name.toLowerCase().includes(query);
        const matchesPrompt = palette.prompt?.toLowerCase().includes(query);
        const matchesColors = palette.colors.some(color => 
          color.name.toLowerCase().includes(query) || 
          color.hex.toLowerCase().includes(query)
        );
        
        if (!matchesName && !matchesPrompt && !matchesColors) {
          return false;
        }
      }

      // Accessibility level filter
      if (filters.accessibilityLevel !== 'all') {
        if (palette.accessibilityScore.overallScore !== filters.accessibilityLevel) {
          return false;
        }
      }

      // Color count filter
      if (filters.colorCount !== 'all') {
        const colorCount = palette.colors.length;
        switch (filters.colorCount) {
          case '3-5':
            if (colorCount < 3 || colorCount > 5) return false;
            break;
          case '6-8':
            if (colorCount < 6 || colorCount > 8) return false;
            break;
          case '9+':
            if (colorCount < 9) return false;
            break;
        }
      }

      // Date range filter
      if (filters.dateRange !== 'all') {
        const now = new Date();
        const paletteDate = new Date(palette.createdAt);
        const diffTime = now.getTime() - paletteDate.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        switch (filters.dateRange) {
          case 'today':
            if (diffDays > 1) return false;
            break;
          case 'week':
            if (diffDays > 7) return false;
            break;
          case 'month':
            if (diffDays > 30) return false;
            break;
        }
      }

      // Category filter
      if (filters.category !== 'all') {
        switch (filters.category) {
          case 'favorites':
            if (!favorites.has(palette.id)) return false;
            break;
          case 'recent':
            const recentDate = new Date();
            recentDate.setDate(recentDate.getDate() - 7);
            if (new Date(palette.createdAt) < recentDate) return false;
            break;
        }
      }

      return true;
    });

    // Sort palettes
    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortOptions.field) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'createdAt':
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
        case 'updatedAt':
          aValue = new Date(a.updatedAt).getTime();
          bValue = new Date(b.updatedAt).getTime();
          break;
        case 'accessibilityScore':
          const scoreMap = { 'AAA': 3, 'AA': 2, 'FAIL': 1 };
          aValue = scoreMap[a.accessibilityScore.overallScore];
          bValue = scoreMap[b.accessibilityScore.overallScore];
          break;
        default:
          return 0;
      }

      if (sortOptions.direction === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    return filtered;
  }, [palettes, searchQuery, filters, sortOptions, favorites]);

  // Update pagination when filtered results change
  useEffect(() => {
    const totalItems = filteredAndSortedPalettes.length;
    const totalPages = Math.ceil(totalItems / pagination.itemsPerPage);
    
    setPagination(prev => ({
      ...prev,
      totalItems,
      totalPages,
      currentPage: Math.min(prev.currentPage, Math.max(1, totalPages)),
    }));
  }, [filteredAndSortedPalettes, pagination.itemsPerPage]);

  // Get paginated palettes
  const paginatedPalettes = useMemo(() => {
    const startIndex = (pagination.currentPage - 1) * pagination.itemsPerPage;
    const endIndex = startIndex + pagination.itemsPerPage;
    return filteredAndSortedPalettes.slice(startIndex, endIndex);
  }, [filteredAndSortedPalettes, pagination.currentPage, pagination.itemsPerPage]);

  // TODO: Use virtual scrolling for large lists
  // const shouldUseVirtualScrolling = filteredAndSortedPalettes.length > 50;

  // Handle favorite toggle
  const handleFavoriteToggle = useCallback((paletteId: string) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(paletteId)) {
      newFavorites.delete(paletteId);
    } else {
      newFavorites.add(paletteId);
    }
    setFavorites(newFavorites);
    saveFavorites(newFavorites);
  }, [favorites, saveFavorites]);

  // Handle palette selection
  const handlePaletteSelect = useCallback((palette: ColorPalette) => {
    onPaletteSelect?.(palette);
  }, [onPaletteSelect]);

  // Handle palette deletion
  const handleDeleteClick = useCallback((palette: ColorPalette) => {
    setConfirmationDialog({
      isOpen: true,
      type: 'delete',
      palette,
      message: `Are you sure you want to delete "${palette.name}"? This action cannot be undone.`,
    });
  }, []);

  const handleDeleteConfirm = useCallback(() => {
    if (confirmationDialog.palette) {
      onPaletteDelete?.(confirmationDialog.palette.id);
      setConfirmationDialog({ isOpen: false, type: null, palette: null, message: '' });
    }
  }, [confirmationDialog.palette, onPaletteDelete]);

  // Handle palette regeneration
  const handleRegenerateClick = useCallback((palette: ColorPalette) => {
    setConfirmationDialog({
      isOpen: true,
      type: 'regenerate',
      palette,
      message: `Regenerate "${palette.name}" with similar characteristics? This will create a new palette.`,
    });
  }, []);

  const handleRegenerateConfirm = useCallback(() => {
    if (confirmationDialog.palette) {
      onPaletteRegenerate?.(confirmationDialog.palette);
      setConfirmationDialog({ isOpen: false, type: null, palette: null, message: '' });
    }
  }, [confirmationDialog.palette, onPaletteRegenerate]);

  // Handle variation creation
  const handleVariationCreate = useCallback((palette: ColorPalette, type: 'lighter' | 'darker' | 'complementary') => {
    onPaletteVariation?.(palette, type);
  }, [onPaletteVariation]);

  // Handle pagination
  const handlePageChange = useCallback((page: number) => {
    setPagination(prev => ({ ...prev, currentPage: page }));
  }, []);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setSearchQuery('');
    setFilters({
      accessibilityLevel: 'all',
      colorCount: 'all',
      dateRange: 'all',
      category: 'all',
    });
  }, []);

  // Format date for display
  const formatDate = useCallback((date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(new Date(date));
  }, []);

  // Get accessibility badge color
  const getAccessibilityBadgeColor = useCallback((level: 'AA' | 'AAA' | 'FAIL') => {
    switch (level) {
      case 'AAA':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'AA':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'FAIL':
        return 'bg-red-100 text-red-800 border-red-200';
    }
  }, []);

  return (
    <div className={`bg-white rounded-xl shadow-lg border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Palette className="w-6 h-6 text-purple-600" />
            <div>
              <h2 className="text-xl font-bold text-gray-900">Palette History</h2>
              <p className="text-sm text-gray-600">
                {filteredAndSortedPalettes.length} of {palettes.length} palettes
              </p>
            </div>
          </div>

          {/* View Controls */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'grid'
                  ? 'bg-purple-100 text-purple-600'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
              title="Grid view"
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'list'
                  ? 'bg-purple-100 text-purple-600'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
              title="List view"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search palettes by name, prompt, or colors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {/* Filter Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <Filter className="w-4 h-4" />
                <span>Filters</span>
              </button>

              {/* Sort Options */}
              <div className="flex items-center space-x-2">
                <select
                  value={sortOptions.field}
                  onChange={(e) => setSortOptions(prev => ({ ...prev, field: e.target.value as any }))}
                  className="text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="createdAt">Created Date</option>
                  <option value="updatedAt">Updated Date</option>
                  <option value="name">Name</option>
                  <option value="accessibilityScore">Accessibility</option>
                </select>
                
                <button
                  onClick={() => setSortOptions(prev => ({ 
                    ...prev, 
                    direction: prev.direction === 'asc' ? 'desc' : 'asc' 
                  }))}
                  className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                  title={`Sort ${sortOptions.direction === 'asc' ? 'descending' : 'ascending'}`}
                >
                  {sortOptions.direction === 'asc' ? (
                    <SortAsc className="w-4 h-4" />
                  ) : (
                    <SortDesc className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Clear Filters */}
            {(searchQuery || Object.values(filters).some(f => f !== 'all')) && (
              <button
                onClick={clearFilters}
                className="text-sm text-purple-600 hover:text-purple-700 transition-colors"
              >
                Clear all filters
              </button>
            )}
          </div>

          {/* Filter Panel */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Accessibility
                  </label>
                  <select
                    value={filters.accessibilityLevel}
                    onChange={(e) => setFilters(prev => ({ ...prev, accessibilityLevel: e.target.value as any }))}
                    className="w-full text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="all">All levels</option>
                    <option value="AAA">AAA only</option>
                    <option value="AA">AA only</option>
                    <option value="FAIL">Needs improvement</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Color Count
                  </label>
                  <select
                    value={filters.colorCount}
                    onChange={(e) => setFilters(prev => ({ ...prev, colorCount: e.target.value as any }))}
                    className="w-full text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="all">Any count</option>
                    <option value="3-5">3-5 colors</option>
                    <option value="6-8">6-8 colors</option>
                    <option value="9+">9+ colors</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date Range
                  </label>
                  <select
                    value={filters.dateRange}
                    onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value as any }))}
                    className="w-full text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="all">All time</option>
                    <option value="today">Today</option>
                    <option value="week">This week</option>
                    <option value="month">This month</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <select
                    value={filters.category}
                    onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value as any }))}
                    className="w-full text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="all">All palettes</option>
                    <option value="favorites">Favorites</option>
                    <option value="recent">Recent</option>
                  </select>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Palette Grid/List */}
      <div className="p-6">
        {paginatedPalettes.length === 0 ? (
          <div className="text-center py-12">
            <Palette className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No palettes found</h3>
            <p className="text-gray-600">
              {palettes.length === 0
                ? "You haven't created any palettes yet."
                : "Try adjusting your search or filter criteria."}
            </p>
          </div>
        ) : (
          <>
            {/* Palette Items */}
            <div className={
              viewMode === 'grid'
                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
                : 'space-y-4'
            }>
              {paginatedPalettes.map((palette) => (
                <motion.div
                  key={palette.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-all duration-200 ${
                    currentPalette?.id === palette.id ? 'ring-2 ring-purple-500' : ''
                  } ${viewMode === 'list' ? 'flex' : ''}`}
                >
                  {/* Color Preview */}
                  <div className={`${viewMode === 'list' ? 'w-32 flex-shrink-0' : 'h-24'} relative`}>
                    <div className="flex h-full">
                      {palette.colors.slice(0, 5).map((color, index) => (
                        <div
                          key={index}
                          className="flex-1"
                          style={{ backgroundColor: color.hex }}
                          title={`${color.name}: ${color.hex}`}
                        />
                      ))}
                      {palette.colors.length > 5 && (
                        <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                          +{palette.colors.length - 5}
                        </div>
                      )}
                    </div>

                    {/* Favorite Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleFavoriteToggle(palette.id);
                      }}
                      className={`absolute top-2 left-2 p-1 rounded-full transition-colors ${
                        favorites.has(palette.id)
                          ? 'bg-yellow-400 text-white'
                          : 'bg-black bg-opacity-50 text-white hover:bg-opacity-70'
                      }`}
                      title={favorites.has(palette.id) ? 'Remove from favorites' : 'Add to favorites'}
                    >
                      <Star className={`w-3 h-3 ${favorites.has(palette.id) ? 'fill-current' : ''}`} />
                    </button>
                  </div>

                  {/* Palette Info */}
                  <div className={`p-4 ${viewMode === 'list' ? 'flex-1' : ''}`}>
                    <div className={`${viewMode === 'list' ? 'flex items-center justify-between' : ''}`}>
                      <div className={`${viewMode === 'list' ? 'flex-1' : ''}`}>
                        <h3 className="font-semibold text-gray-900 mb-1 truncate">
                          {palette.name}
                        </h3>
                        
                        {viewMode === 'grid' && palette.prompt && (
                          <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                            "{palette.prompt}"
                          </p>
                        )}

                        <div className={`flex items-center ${viewMode === 'list' ? 'space-x-4' : 'justify-between'} text-sm text-gray-500`}>
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-3 h-3" />
                            <span>{formatDate(palette.createdAt)}</span>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getAccessibilityBadgeColor(palette.accessibilityScore.overallScore)}`}>
                              {palette.accessibilityScore.overallScore}
                            </span>
                            <span className="text-xs text-gray-500">
                              {palette.colors.length} colors
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className={`${viewMode === 'list' ? 'flex items-center space-x-2 ml-4' : 'flex justify-between mt-3'}`}>
                        <button
                          onClick={() => handlePaletteSelect(palette)}
                          className="flex items-center space-x-1 px-3 py-1 bg-purple-600 text-white text-sm rounded hover:bg-purple-700 transition-colors"
                        >
                          <Eye className="w-3 h-3" />
                          <span>View</span>
                        </button>

                        {/* More Actions Dropdown */}
                        <div className="relative group">
                          <button className="p-1 text-gray-400 hover:text-gray-600 transition-colors">
                            <MoreVertical className="w-4 h-4" />
                          </button>
                          
                          <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                            <div className="py-1">
                              <button
                                onClick={() => onPaletteDuplicate?.(palette)}
                                className="flex items-center space-x-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                              >
                                <Copy className="w-4 h-4" />
                                <span>Duplicate</span>
                              </button>
                              
                              <button
                                onClick={() => handleRegenerateClick(palette)}
                                className="flex items-center space-x-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                              >
                                <RefreshCw className="w-4 h-4" />
                                <span>Regenerate</span>
                              </button>

                              <div className="border-t border-gray-100 my-1" />
                              
                              <button
                                onClick={() => handleVariationCreate(palette, 'lighter')}
                                className="flex items-center space-x-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                              >
                                <span>Create Lighter Variation</span>
                              </button>
                              
                              <button
                                onClick={() => handleVariationCreate(palette, 'darker')}
                                className="flex items-center space-x-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                              >
                                <span>Create Darker Variation</span>
                              </button>
                              
                              <button
                                onClick={() => handleVariationCreate(palette, 'complementary')}
                                className="flex items-center space-x-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                              >
                                <span>Create Complementary</span>
                              </button>

                              <div className="border-t border-gray-100 my-1" />
                              
                              <button
                                onClick={() => handleDeleteClick(palette)}
                                className="flex items-center space-x-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4" />
                                <span>Delete</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
                <div className="text-sm text-gray-600">
                  Showing {((pagination.currentPage - 1) * pagination.itemsPerPage) + 1} to{' '}
                  {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} of{' '}
                  {pagination.totalItems} palettes
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                    disabled={pagination.currentPage === 1}
                    className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <div className="flex items-center space-x-1">
                    {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                      let pageNumber;
                      if (pagination.totalPages <= 5) {
                        pageNumber = i + 1;
                      } else if (pagination.currentPage <= 3) {
                        pageNumber = i + 1;
                      } else if (pagination.currentPage >= pagination.totalPages - 2) {
                        pageNumber = pagination.totalPages - 4 + i;
                      } else {
                        pageNumber = pagination.currentPage - 2 + i;
                      }

                      return (
                        <button
                          key={pageNumber}
                          onClick={() => handlePageChange(pageNumber)}
                          className={`px-3 py-1 text-sm rounded transition-colors ${
                            pageNumber === pagination.currentPage
                              ? 'bg-purple-600 text-white'
                              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                          }`}
                        >
                          {pageNumber}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                    disabled={pagination.currentPage === pagination.totalPages}
                    className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Confirmation Dialog */}
      <AnimatePresence>
        {confirmationDialog.isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setConfirmationDialog({ isOpen: false, type: null, palette: null, message: '' })}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center space-x-3 mb-4">
                <div className={`p-2 rounded-full ${
                  confirmationDialog.type === 'delete' ? 'bg-red-100' : 'bg-blue-100'
                }`}>
                  {confirmationDialog.type === 'delete' ? (
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                  ) : (
                    <RefreshCw className="w-5 h-5 text-blue-600" />
                  )}
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {confirmationDialog.type === 'delete' ? 'Delete Palette' : 'Regenerate Palette'}
                </h3>
              </div>

              <p className="text-gray-600 mb-6">
                {confirmationDialog.message}
              </p>

              <div className="flex items-center justify-end space-x-3">
                <button
                  onClick={() => setConfirmationDialog({ isOpen: false, type: null, palette: null, message: '' })}
                  className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmationDialog.type === 'delete' ? handleDeleteConfirm : handleRegenerateConfirm}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-white transition-colors ${
                    confirmationDialog.type === 'delete'
                      ? 'bg-red-600 hover:bg-red-700'
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {confirmationDialog.type === 'delete' ? (
                    <>
                      <Trash2 className="w-4 h-4" />
                      <span>Delete</span>
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4" />
                      <span>Regenerate</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

HistoryPanel.displayName = 'HistoryPanel';

export default HistoryPanel;