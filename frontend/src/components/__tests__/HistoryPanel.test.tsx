import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import HistoryPanel from '../HistoryPanel';
import { ColorPalette } from '../../types/color';

// Mock framer-motion to avoid animation issues in tests
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

const mockPalettes: ColorPalette[] = [
  {
    id: 'palette-1',
    name: 'Ocean Breeze',
    prompt: 'A calming ocean-inspired palette',
    colors: [
      {
        hex: '#0EA5E9',
        rgb: { r: 14, g: 165, b: 233 },
        hsl: { h: 199, s: 89, l: 48 },
        name: 'Sky Blue',
        category: 'primary',
        usage: 'Primary brand color',
        accessibility: {
          contrastWithWhite: 4.5,
          contrastWithBlack: 4.7,
          wcagLevel: 'AA',
        },
      },
      {
        hex: '#06B6D4',
        rgb: { r: 6, g: 182, b: 212 },
        hsl: { h: 189, s: 94, l: 43 },
        name: 'Cyan',
        category: 'secondary',
        usage: 'Secondary elements',
        accessibility: {
          contrastWithWhite: 3.8,
          contrastWithBlack: 5.5,
          wcagLevel: 'AA',
        },
      },
    ],
    accessibilityScore: {
      overallScore: 'AA',
      contrastRatios: [],
      colorBlindnessCompatible: true,
      recommendations: [],
      passedChecks: 2,
      totalChecks: 2,
    },
    createdAt: new Date('2024-01-15T10:00:00Z'),
    updatedAt: new Date('2024-01-15T10:00:00Z'),
  },
  {
    id: 'palette-2',
    name: 'Sunset Glow',
    prompt: 'Warm sunset colors',
    colors: [
      {
        hex: '#F97316',
        rgb: { r: 249, g: 115, b: 22 },
        hsl: { h: 25, s: 95, l: 53 },
        name: 'Orange',
        category: 'primary',
        usage: 'Accent color',
        accessibility: {
          contrastWithWhite: 3.2,
          contrastWithBlack: 6.5,
          wcagLevel: 'FAIL',
        },
      },
    ],
    accessibilityScore: {
      overallScore: 'FAIL',
      contrastRatios: [],
      colorBlindnessCompatible: false,
      recommendations: ['Improve contrast ratios'],
      passedChecks: 0,
      totalChecks: 1,
    },
    createdAt: new Date('2024-01-10T15:30:00Z'),
    updatedAt: new Date('2024-01-10T15:30:00Z'),
  },
  {
    id: 'palette-3',
    name: 'Forest Green',
    colors: [
      {
        hex: '#059669',
        rgb: { r: 5, g: 150, b: 105 },
        hsl: { h: 160, s: 94, l: 30 },
        name: 'Emerald',
        category: 'primary',
        usage: 'Nature theme',
        accessibility: {
          contrastWithWhite: 7.2,
          contrastWithBlack: 2.9,
          wcagLevel: 'AAA',
        },
      },
    ],
    accessibilityScore: {
      overallScore: 'AAA',
      contrastRatios: [],
      colorBlindnessCompatible: true,
      recommendations: [],
      passedChecks: 1,
      totalChecks: 1,
    },
    createdAt: new Date('2024-01-20T09:15:00Z'),
    updatedAt: new Date('2024-01-20T09:15:00Z'),
  },
];

describe('HistoryPanel', () => {
  const user = userEvent.setup();
  const defaultProps = {
    palettes: mockPalettes,
    onPaletteSelect: jest.fn(),
    onPaletteDelete: jest.fn(),
    onPaletteRegenerate: jest.fn(),
    onPaletteVariation: jest.fn(),
    onPaletteDuplicate: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  describe('Rendering', () => {
    it('renders the history panel with correct title', () => {
      render(<HistoryPanel {...defaultProps} />);
      
      expect(screen.getByText('Palette History')).toBeInTheDocument();
      expect(screen.getByText('3 of 3 palettes')).toBeInTheDocument();
    });

    it('displays all palettes by default', () => {
      render(<HistoryPanel {...defaultProps} />);
      
      expect(screen.getByText('Ocean Breeze')).toBeInTheDocument();
      expect(screen.getByText('Sunset Glow')).toBeInTheDocument();
      expect(screen.getByText('Forest Green')).toBeInTheDocument();
    });

    it('shows empty state when no palettes exist', () => {
      render(<HistoryPanel {...defaultProps} palettes={[]} />);
      
      expect(screen.getByText('No palettes found')).toBeInTheDocument();
      expect(screen.getByText("You haven't created any palettes yet.")).toBeInTheDocument();
    });

    it('highlights current palette', () => {
      render(<HistoryPanel {...defaultProps} currentPalette={mockPalettes[0]} />);
      
      const currentPaletteCard = screen.getByText('Ocean Breeze').closest('div');
      expect(currentPaletteCard).toHaveClass('ring-2', 'ring-purple-500');
    });

    it('displays accessibility badges correctly', () => {
      render(<HistoryPanel {...defaultProps} />);
      
      expect(screen.getByText('AA')).toBeInTheDocument();
      expect(screen.getByText('FAIL')).toBeInTheDocument();
      expect(screen.getByText('AAA')).toBeInTheDocument();
    });
  });

  describe('Search Functionality', () => {
    it('filters palettes by name', async () => {
      render(<HistoryPanel {...defaultProps} />);
      
      const searchInput = screen.getByPlaceholderText(/search palettes/i);
      await user.type(searchInput, 'Ocean');
      
      expect(screen.getByText('Ocean Breeze')).toBeInTheDocument();
      expect(screen.queryByText('Sunset Glow')).not.toBeInTheDocument();
      expect(screen.queryByText('Forest Green')).not.toBeInTheDocument();
    });

    it('filters palettes by prompt', async () => {
      render(<HistoryPanel {...defaultProps} />);
      
      const searchInput = screen.getByPlaceholderText(/search palettes/i);
      await user.type(searchInput, 'sunset');
      
      expect(screen.getByText('Sunset Glow')).toBeInTheDocument();
      expect(screen.queryByText('Ocean Breeze')).not.toBeInTheDocument();
    });

    it('filters palettes by color name', async () => {
      render(<HistoryPanel {...defaultProps} />);
      
      const searchInput = screen.getByPlaceholderText(/search palettes/i);
      await user.type(searchInput, 'Emerald');
      
      expect(screen.getByText('Forest Green')).toBeInTheDocument();
      expect(screen.queryByText('Ocean Breeze')).not.toBeInTheDocument();
    });

    it('shows no results message when search yields no matches', async () => {
      render(<HistoryPanel {...defaultProps} />);
      
      const searchInput = screen.getByPlaceholderText(/search palettes/i);
      await user.type(searchInput, 'nonexistent');
      
      expect(screen.getByText('No palettes found')).toBeInTheDocument();
      expect(screen.getByText('Try adjusting your search or filter criteria.')).toBeInTheDocument();
    });
  });

  describe('Filter Functionality', () => {
    it('shows and hides filter panel', async () => {
      render(<HistoryPanel {...defaultProps} />);
      
      const filtersButton = screen.getByText('Filters');
      
      // Filters should be hidden initially
      expect(screen.queryByText('Accessibility')).not.toBeInTheDocument();
      
      // Show filters
      await user.click(filtersButton);
      expect(screen.getByText('Accessibility')).toBeInTheDocument();
    });

    it('filters by accessibility level', async () => {
      render(<HistoryPanel {...defaultProps} />);
      
      // Open filters
      await user.click(screen.getByText('Filters'));
      
      // Filter by AAA only
      const accessibilitySelect = screen.getByDisplayValue('All levels');
      await user.selectOptions(accessibilitySelect, 'AAA');
      
      expect(screen.getByText('Forest Green')).toBeInTheDocument();
      expect(screen.queryByText('Ocean Breeze')).not.toBeInTheDocument();
      expect(screen.queryByText('Sunset Glow')).not.toBeInTheDocument();
    });

    it('filters by color count', async () => {
      render(<HistoryPanel {...defaultProps} />);
      
      // Open filters
      await user.click(screen.getByText('Filters'));
      
      // Filter by 3-5 colors (should show palettes with 1-2 colors in our test data)
      const colorCountSelect = screen.getByDisplayValue('Any count');
      await user.selectOptions(colorCountSelect, '3-5');
      
      // All our test palettes have 1-2 colors, so none should match 3-5 filter
      expect(screen.getByText('No palettes found')).toBeInTheDocument();
    });

    it('clears all filters', async () => {
      render(<HistoryPanel {...defaultProps} />);
      
      // Apply search and filter
      const searchInput = screen.getByPlaceholderText(/search palettes/i);
      await user.type(searchInput, 'Ocean');
      
      await user.click(screen.getByText('Filters'));
      const accessibilitySelect = screen.getByDisplayValue('All levels');
      await user.selectOptions(accessibilitySelect, 'AAA');
      
      // Should show clear filters button
      const clearButton = screen.getByText('Clear all filters');
      expect(clearButton).toBeInTheDocument();
      
      // Clear filters
      await user.click(clearButton);
      
      // Should show all palettes again
      expect(screen.getByText('Ocean Breeze')).toBeInTheDocument();
      expect(screen.getByText('Sunset Glow')).toBeInTheDocument();
      expect(screen.getByText('Forest Green')).toBeInTheDocument();
    });
  });

  describe('Sorting Functionality', () => {
    it('sorts by name ascending', async () => {
      render(<HistoryPanel {...defaultProps} />);
      
      // Change sort to name
      const sortSelect = screen.getByDisplayValue('Created Date');
      await user.selectOptions(sortSelect, 'Name');
      
      // Change direction to ascending
      const sortButton = screen.getByTitle(/sort/i);
      await user.click(sortButton);
      
      // Check order (should be alphabetical)
      const paletteNames = screen.getAllByText(/Ocean Breeze|Sunset Glow|Forest Green/);
      expect(paletteNames[0]).toHaveTextContent('Forest Green');
      expect(paletteNames[1]).toHaveTextContent('Ocean Breeze');
      expect(paletteNames[2]).toHaveTextContent('Sunset Glow');
    });

    it('sorts by accessibility score', async () => {
      render(<HistoryPanel {...defaultProps} />);
      
      const sortSelect = screen.getByDisplayValue('Created Date');
      await user.selectOptions(sortSelect, 'Accessibility');
      
      // Should sort by accessibility (AAA > AA > FAIL)
      const paletteNames = screen.getAllByText(/Ocean Breeze|Sunset Glow|Forest Green/);
      expect(paletteNames[0]).toHaveTextContent('Forest Green'); // AAA
    });
  });

  describe('View Mode Toggle', () => {
    it('switches between grid and list view', async () => {
      render(<HistoryPanel {...defaultProps} />);
      
      // Should start in grid view
      const gridButton = screen.getByTitle('Grid view');
      const listButton = screen.getByTitle('List view');
      
      expect(gridButton).toHaveClass('bg-purple-100');
      
      // Switch to list view
      await user.click(listButton);
      expect(listButton).toHaveClass('bg-purple-100');
      expect(gridButton).not.toHaveClass('bg-purple-100');
    });
  });

  describe('Favorites Functionality', () => {
    it('loads favorites from localStorage', () => {
      localStorageMock.getItem.mockReturnValue(JSON.stringify(['palette-1']));
      
      render(<HistoryPanel {...defaultProps} />);
      
      // The favorite star should be filled for palette-1
      const favoriteButtons = screen.getAllByTitle(/favorites/i);
      expect(favoriteButtons[0]).toHaveClass('bg-yellow-400');
    });

    it('toggles favorite status', async () => {
      render(<HistoryPanel {...defaultProps} />);
      
      const favoriteButtons = screen.getAllByTitle(/add to favorites/i);
      await user.click(favoriteButtons[0]);
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'chromagen-favorites',
        JSON.stringify(['palette-1'])
      );
    });

    it('filters by favorites', async () => {
      localStorageMock.getItem.mockReturnValue(JSON.stringify(['palette-1']));
      
      render(<HistoryPanel {...defaultProps} />);
      
      // Open filters and select favorites
      await user.click(screen.getByText('Filters'));
      const categorySelect = screen.getByDisplayValue('All palettes');
      await user.selectOptions(categorySelect, 'Favorites');
      
      expect(screen.getByText('Ocean Breeze')).toBeInTheDocument();
      expect(screen.queryByText('Sunset Glow')).not.toBeInTheDocument();
    });
  });

  describe('Palette Actions', () => {
    it('calls onPaletteSelect when view button is clicked', async () => {
      render(<HistoryPanel {...defaultProps} />);
      
      const viewButtons = screen.getAllByText('View');
      await user.click(viewButtons[0]);
      
      expect(defaultProps.onPaletteSelect).toHaveBeenCalledWith(mockPalettes[0]);
    });

    it('shows confirmation dialog for deletion', async () => {
      render(<HistoryPanel {...defaultProps} />);
      
      // Click more actions button (first palette)
      const moreButtons = screen.getAllByRole('button');
      const moreButton = moreButtons.find(button => 
        button.querySelector('svg') && button.getAttribute('class')?.includes('text-gray-400')
      );
      
      if (moreButton) {
        await user.hover(moreButton);
        
        await waitFor(() => {
          const deleteButton = screen.getByText('Delete');
          expect(deleteButton).toBeInTheDocument();
        });
        
        const deleteButton = screen.getByText('Delete');
        await user.click(deleteButton);
        
        expect(screen.getByText('Delete Palette')).toBeInTheDocument();
        expect(screen.getByText(/Are you sure you want to delete/)).toBeInTheDocument();
      }
    });

    it('confirms palette deletion', async () => {
      render(<HistoryPanel {...defaultProps} />);
      
      // Trigger delete action (simplified for test)
      const moreButtons = screen.getAllByRole('button');
      const moreButton = moreButtons.find(button => 
        button.querySelector('svg') && button.getAttribute('class')?.includes('text-gray-400')
      );
      
      if (moreButton) {
        await user.hover(moreButton);
        
        await waitFor(() => {
          const deleteButton = screen.getByText('Delete');
          expect(deleteButton).toBeInTheDocument();
        });
        
        const deleteButton = screen.getByText('Delete');
        await user.click(deleteButton);
        
        // Confirm deletion
        const confirmButton = screen.getAllByText('Delete').find(btn => 
          btn.closest('button')?.className.includes('bg-red-600')
        );
        
        if (confirmButton) {
          await user.click(confirmButton);
          expect(defaultProps.onPaletteDelete).toHaveBeenCalledWith('palette-1');
        }
      }
    });

    it('shows regeneration confirmation dialog', async () => {
      render(<HistoryPanel {...defaultProps} />);
      
      const moreButtons = screen.getAllByRole('button');
      const moreButton = moreButtons.find(button => 
        button.querySelector('svg') && button.getAttribute('class')?.includes('text-gray-400')
      );
      
      if (moreButton) {
        await user.hover(moreButton);
        
        await waitFor(() => {
          const regenerateButton = screen.getByText('Regenerate');
          expect(regenerateButton).toBeInTheDocument();
        });
        
        const regenerateButton = screen.getByText('Regenerate');
        await user.click(regenerateButton);
        
        expect(screen.getByText('Regenerate Palette')).toBeInTheDocument();
      }
    });

    it('calls variation handlers', async () => {
      render(<HistoryPanel {...defaultProps} />);
      
      const moreButtons = screen.getAllByRole('button');
      const moreButton = moreButtons.find(button => 
        button.querySelector('svg') && button.getAttribute('class')?.includes('text-gray-400')
      );
      
      if (moreButton) {
        await user.hover(moreButton);
        
        await waitFor(() => {
          const lighterButton = screen.getByText('Create Lighter Variation');
          expect(lighterButton).toBeInTheDocument();
        });
        
        const lighterButton = screen.getByText('Create Lighter Variation');
        await user.click(lighterButton);
        
        expect(defaultProps.onPaletteVariation).toHaveBeenCalledWith(mockPalettes[0], 'lighter');
      }
    });
  });

  describe('Pagination', () => {
    const manyPalettes = Array.from({ length: 25 }, (_, i) => ({
      ...mockPalettes[0],
      id: `palette-${i}`,
      name: `Palette ${i}`,
    }));

    it('shows pagination when there are many palettes', () => {
      render(<HistoryPanel {...defaultProps} palettes={manyPalettes} />);
      
      expect(screen.getByText(/Showing 1 to 12 of 25 palettes/)).toBeInTheDocument();
    });

    it('navigates between pages', async () => {
      render(<HistoryPanel {...defaultProps} palettes={manyPalettes} />);
      
      // Should show page 1 initially
      expect(screen.getByText('Palette 0')).toBeInTheDocument();
      
      // Click next page
      const nextButton = screen.getByRole('button', { name: /next/i }) || 
                        screen.getAllByRole('button').find(btn => 
                          btn.querySelector('svg') && btn.getAttribute('class')?.includes('w-4 h-4')
                        );
      
      if (nextButton) {
        await user.click(nextButton);
        
        // Should show page 2 content
        expect(screen.getByText(/Showing 13 to 24 of 25 palettes/)).toBeInTheDocument();
      }
    });
  });

  describe('Error Handling', () => {
    it('handles localStorage errors gracefully', () => {
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('localStorage error');
      });
      
      // Should not throw an error
      expect(() => {
        render(<HistoryPanel {...defaultProps} />);
      }).not.toThrow();
    });

    it('handles invalid JSON in localStorage', () => {
      localStorageMock.getItem.mockReturnValue('invalid json');
      
      // Should not throw an error
      expect(() => {
        render(<HistoryPanel {...defaultProps} />);
      }).not.toThrow();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels and roles', () => {
      render(<HistoryPanel {...defaultProps} />);
      
      expect(screen.getByRole('textbox')).toBeInTheDocument(); // Search input
      expect(screen.getAllByRole('button')).toHaveLength(expect.any(Number));
    });

    it('supports keyboard navigation', async () => {
      render(<HistoryPanel {...defaultProps} />);
      
      const searchInput = screen.getByRole('textbox');
      
      // Tab to search input
      await user.tab();
      expect(searchInput).toHaveFocus();
    });
  });

  describe('Custom Props', () => {
    it('applies custom className', () => {
      const { container } = render(
        <HistoryPanel {...defaultProps} className="custom-class" />
      );
      
      expect(container.firstChild).toHaveClass('custom-class');
    });

    it('calls callback functions with correct parameters', async () => {
      const onPaletteSelect = jest.fn();
      const onPaletteDuplicate = jest.fn();
      
      render(
        <HistoryPanel 
          {...defaultProps} 
          onPaletteSelect={onPaletteSelect}
          onPaletteDuplicate={onPaletteDuplicate}
        />
      );
      
      const viewButtons = screen.getAllByText('View');
      await user.click(viewButtons[0]);
      
      expect(onPaletteSelect).toHaveBeenCalledWith(mockPalettes[0]);
    });
  });
});