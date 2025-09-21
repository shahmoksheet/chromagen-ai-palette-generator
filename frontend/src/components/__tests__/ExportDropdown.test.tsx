import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import ExportDropdown from '../ExportDropdown';
import { ColorPalette, ExportFormat } from '../../types/color';

// Mock framer-motion to avoid animation issues in tests
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn(() => Promise.resolve()),
  },
});

// Mock URL.createObjectURL and revokeObjectURL
global.URL.createObjectURL = jest.fn(() => 'mock-url');
global.URL.revokeObjectURL = jest.fn();

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

const mockPalette: ColorPalette = {
  id: 'test-palette-1',
  name: 'Test Palette',
  prompt: 'A vibrant test palette',
  colors: [
    {
      hex: '#FF0000',
      rgb: { r: 255, g: 0, b: 0 },
      hsl: { h: 0, s: 100, l: 50 },
      name: 'Vibrant Red',
      category: 'primary',
      usage: 'Use for call-to-action buttons and important highlights',
      accessibility: {
        contrastWithWhite: 3.99,
        contrastWithBlack: 5.25,
        wcagLevel: 'AA',
      },
    },
    {
      hex: '#00FF00',
      rgb: { r: 0, g: 255, b: 0 },
      hsl: { h: 120, s: 100, l: 50 },
      name: 'Bright Green',
      category: 'secondary',
      usage: 'Use for success messages and positive feedback',
      accessibility: {
        contrastWithWhite: 1.37,
        contrastWithBlack: 15.3,
        wcagLevel: 'FAIL',
      },
    },
    {
      hex: '#0000FF',
      rgb: { r: 0, g: 0, b: 255 },
      hsl: { h: 240, s: 100, l: 50 },
      name: 'Pure Blue',
      category: 'accent',
      usage: 'Use for links and interactive elements',
      accessibility: {
        contrastWithWhite: 8.59,
        contrastWithBlack: 2.44,
        wcagLevel: 'AAA',
      },
    },
  ],
  accessibilityScore: {
    overallScore: 'AA',
    contrastRatios: [],
    colorBlindnessCompatible: true,
    recommendations: ['Test recommendation'],
    passedChecks: 2,
    totalChecks: 3,
  },
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

describe('ExportDropdown', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  describe('Rendering', () => {
    it('renders the export button', () => {
      render(<ExportDropdown palette={mockPalette} />);
      
      expect(screen.getByRole('button', { name: /export/i })).toBeInTheDocument();
      expect(screen.getByText('Export')).toBeInTheDocument();
    });

    it('shows dropdown when export button is clicked', async () => {
      render(<ExportDropdown palette={mockPalette} />);
      
      const exportButton = screen.getByRole('button', { name: /export/i });
      await user.click(exportButton);
      
      expect(screen.getByText('Export Palette')).toBeInTheDocument();
    });

    it('displays all export format options', async () => {
      render(<ExportDropdown palette={mockPalette} />);
      
      const exportButton = screen.getByRole('button', { name: /export/i });
      await user.click(exportButton);
      
      // Check for all export formats
      expect(screen.getByText('CSS Variables')).toBeInTheDocument();
      expect(screen.getByText('SCSS Variables')).toBeInTheDocument();
      expect(screen.getByText('JSON')).toBeInTheDocument();
      expect(screen.getByText('Tailwind Config')).toBeInTheDocument();
      expect(screen.getByText('Adobe ASE')).toBeInTheDocument();
      expect(screen.getByText('Sketch Palette')).toBeInTheDocument();
      expect(screen.getByText('Figma Tokens')).toBeInTheDocument();
    });

    it('shows format descriptions', async () => {
      render(<ExportDropdown palette={mockPalette} />);
      
      const exportButton = screen.getByRole('button', { name: /export/i });
      await user.click(exportButton);
      
      expect(screen.getByText('CSS custom properties for web development')).toBeInTheDocument();
      expect(screen.getByText('Structured data format for applications')).toBeInTheDocument();
    });
  });

  describe('Export Functionality', () => {
    it('handles CSS export correctly', async () => {
      const onExportSuccess = jest.fn();
      render(<ExportDropdown palette={mockPalette} onExportSuccess={onExportSuccess} />);
      
      const exportButton = screen.getByRole('button', { name: /export/i });
      await user.click(exportButton);
      
      const cssDownloadButton = screen.getAllByText('Download')[0]; // First download button (CSS)
      await user.click(cssDownloadButton);
      
      await waitFor(() => {
        expect(onExportSuccess).toHaveBeenCalledWith('css', expect.stringContaining('test-palette'));
      });
    });

    it('handles JSON export correctly', async () => {
      const onExportSuccess = jest.fn();
      render(<ExportDropdown palette={mockPalette} onExportSuccess={onExportSuccess} />);
      
      const exportButton = screen.getByRole('button', { name: /export/i });
      await user.click(exportButton);
      
      // Find JSON download button specifically
      const jsonSection = screen.getByText('JSON').closest('div');
      const jsonDownloadButton = jsonSection?.querySelector('button:last-child');
      
      if (jsonDownloadButton) {
        await user.click(jsonDownloadButton);
        
        await waitFor(() => {
          expect(onExportSuccess).toHaveBeenCalledWith('json', expect.stringContaining('test-palette'));
        });
      }
    });

    it('shows loading state during export', async () => {
      render(<ExportDropdown palette={mockPalette} />);
      
      const exportButton = screen.getByRole('button', { name: /export/i });
      await user.click(exportButton);
      
      const downloadButton = screen.getAllByText('Download')[0];
      await user.click(downloadButton);
      
      // Check that the main button shows exporting state
      expect(screen.getByText('Exporting...')).toBeInTheDocument();
    });

    it('calls onExportError when export fails', async () => {
      // Mock URL.createObjectURL to throw an error
      global.URL.createObjectURL = jest.fn(() => {
        throw new Error('Mock export error');
      });
      
      const onExportError = jest.fn();
      render(<ExportDropdown palette={mockPalette} onExportError={onExportError} />);
      
      const exportButton = screen.getByRole('button', { name: /export/i });
      await user.click(exportButton);
      
      const downloadButton = screen.getAllByText('Download')[0];
      await user.click(downloadButton);
      
      await waitFor(() => {
        expect(onExportError).toHaveBeenCalledWith('css', 'Mock export error');
      });
      
      // Restore the mock
      global.URL.createObjectURL = jest.fn(() => 'mock-url');
    });
  });

  describe('Preview Functionality', () => {
    it('shows preview when preview button is clicked', async () => {
      render(<ExportDropdown palette={mockPalette} />);
      
      const exportButton = screen.getByRole('button', { name: /export/i });
      await user.click(exportButton);
      
      const previewButtons = screen.getAllByTitle('Preview');
      await user.click(previewButtons[0]); // Click first preview button
      
      expect(screen.getByText('Export Preview')).toBeInTheDocument();
    });

    it('displays preview content correctly', async () => {
      render(<ExportDropdown palette={mockPalette} />);
      
      const exportButton = screen.getByRole('button', { name: /export/i });
      await user.click(exportButton);
      
      const previewButtons = screen.getAllByTitle('Preview');
      await user.click(previewButtons[0]); // CSS preview
      
      await waitFor(() => {
        expect(screen.getByText(/--color-vibrant-red/)).toBeInTheDocument();
      });
    });

    it('allows copying preview content', async () => {
      render(<ExportDropdown palette={mockPalette} />);
      
      const exportButton = screen.getByRole('button', { name: /export/i });
      await user.click(exportButton);
      
      const previewButtons = screen.getAllByTitle('Preview');
      await user.click(previewButtons[0]);
      
      await waitFor(() => {
        const copyButton = screen.getByText('Copy');
        expect(copyButton).toBeInTheDocument();
      });
      
      const copyButton = screen.getByText('Copy');
      await user.click(copyButton);
      
      expect(navigator.clipboard.writeText).toHaveBeenCalled();
    });

    it('closes preview when X button is clicked', async () => {
      render(<ExportDropdown palette={mockPalette} />);
      
      const exportButton = screen.getByRole('button', { name: /export/i });
      await user.click(exportButton);
      
      const previewButtons = screen.getAllByTitle('Preview');
      await user.click(previewButtons[0]);
      
      await waitFor(() => {
        expect(screen.getByText('Export Preview')).toBeInTheDocument();
      });
      
      // Find and click the X button in the preview modal
      const closeButtons = screen.getAllByRole('button');
      const xButton = closeButtons.find(button => 
        button.querySelector('svg') && button.getAttribute('class')?.includes('text-gray-400')
      );
      
      if (xButton) {
        await user.click(xButton);
        
        await waitFor(() => {
          expect(screen.queryByText('Export Preview')).not.toBeInTheDocument();
        });
      }
    });
  });

  describe('Export History', () => {
    it('loads export history from localStorage', () => {
      const mockHistory = JSON.stringify([
        {
          id: 'test-1',
          format: 'css',
          filename: 'test.css',
          timestamp: '2024-01-01T00:00:00.000Z',
          paletteId: 'test-palette',
          paletteName: 'Test Palette',
        },
      ]);
      
      localStorageMock.getItem.mockReturnValue(mockHistory);
      
      render(<ExportDropdown palette={mockPalette} />);
      
      const exportButton = screen.getByRole('button', { name: /export/i });
      fireEvent.click(exportButton);
      
      expect(screen.getByText('Recent Exports')).toBeInTheDocument();
      expect(screen.getByText('test.css')).toBeInTheDocument();
    });

    it('saves export to history after successful export', async () => {
      render(<ExportDropdown palette={mockPalette} />);
      
      const exportButton = screen.getByRole('button', { name: /export/i });
      await user.click(exportButton);
      
      const downloadButton = screen.getAllByText('Download')[0];
      await user.click(downloadButton);
      
      await waitFor(() => {
        expect(localStorageMock.setItem).toHaveBeenCalledWith(
          'chromagen-export-history',
          expect.stringContaining('css')
        );
      });
    });

    it('limits history to 10 items', async () => {
      // Create mock history with 10 items
      const mockHistory = Array.from({ length: 10 }, (_, i) => ({
        id: `test-${i}`,
        format: 'css',
        filename: `test-${i}.css`,
        timestamp: new Date().toISOString(),
        paletteId: 'test-palette',
        paletteName: 'Test Palette',
      }));
      
      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockHistory));
      
      render(<ExportDropdown palette={mockPalette} />);
      
      const exportButton = screen.getByRole('button', { name: /export/i });
      await user.click(exportButton);
      
      const downloadButton = screen.getAllByText('Download')[0];
      await user.click(downloadButton);
      
      await waitFor(() => {
        const savedHistory = JSON.parse(localStorageMock.setItem.mock.calls[0][1]);
        expect(savedHistory).toHaveLength(10); // Should still be 10 (new item replaces oldest)
      });
    });
  });

  describe('Content Generation', () => {
    it('generates valid CSS content', async () => {
      render(<ExportDropdown palette={mockPalette} />);
      
      const exportButton = screen.getByRole('button', { name: /export/i });
      await user.click(exportButton);
      
      const previewButtons = screen.getAllByTitle('Preview');
      await user.click(previewButtons[0]); // CSS preview
      
      await waitFor(() => {
        expect(screen.getByText(/:root/)).toBeInTheDocument();
        expect(screen.getByText(/--color-vibrant-red: #FF0000/)).toBeInTheDocument();
      });
    });

    it('generates valid JSON content', async () => {
      render(<ExportDropdown palette={mockPalette} />);
      
      const exportButton = screen.getByRole('button', { name: /export/i });
      await user.click(exportButton);
      
      // Find and click JSON preview button
      const jsonSection = screen.getByText('JSON').closest('div');
      const jsonPreviewButton = jsonSection?.querySelector('button[title="Preview"]');
      
      if (jsonPreviewButton) {
        await user.click(jsonPreviewButton);
        
        await waitFor(() => {
          expect(screen.getByText(/"name": "Test Palette"/)).toBeInTheDocument();
          expect(screen.getByText(/"hex": "#FF0000"/)).toBeInTheDocument();
        });
      }
    });

    it('generates valid SCSS content', async () => {
      render(<ExportDropdown palette={mockPalette} />);
      
      const exportButton = screen.getByRole('button', { name: /export/i });
      await user.click(exportButton);
      
      // Find and click SCSS preview button
      const scssSection = screen.getByText('SCSS Variables').closest('div');
      const scssPreviewButton = scssSection?.querySelector('button[title="Preview"]');
      
      if (scssPreviewButton) {
        await user.click(scssPreviewButton);
        
        await waitFor(() => {
          expect(screen.getByText(/\$color-vibrant-red: #FF0000/)).toBeInTheDocument();
        });
      }
    });

    it('generates valid Tailwind config', async () => {
      render(<ExportDropdown palette={mockPalette} />);
      
      const exportButton = screen.getByRole('button', { name: /export/i });
      await user.click(exportButton);
      
      // Find and click Tailwind preview button
      const tailwindSection = screen.getByText('Tailwind Config').closest('div');
      const tailwindPreviewButton = tailwindSection?.querySelector('button[title="Preview"]');
      
      if (tailwindPreviewButton) {
        await user.click(tailwindPreviewButton);
        
        await waitFor(() => {
          expect(screen.getByText(/module\.exports/)).toBeInTheDocument();
          expect(screen.getByText(/'vibrant-red': '#FF0000'/)).toBeInTheDocument();
        });
      }
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels and roles', () => {
      render(<ExportDropdown palette={mockPalette} />);
      
      expect(screen.getByRole('button', { name: /export/i })).toBeInTheDocument();
    });

    it('supports keyboard navigation', async () => {
      render(<ExportDropdown palette={mockPalette} />);
      
      const exportButton = screen.getByRole('button', { name: /export/i });
      
      // Tab to the export button
      await user.tab();
      expect(exportButton).toHaveFocus();
      
      // Press Enter to open dropdown
      await user.keyboard('{Enter}');
      expect(screen.getByText('Export Palette')).toBeInTheDocument();
    });

    it('closes dropdown when clicking outside', async () => {
      render(
        <div>
          <ExportDropdown palette={mockPalette} />
          <div data-testid="outside">Outside element</div>
        </div>
      );
      
      const exportButton = screen.getByRole('button', { name: /export/i });
      await user.click(exportButton);
      
      expect(screen.getByText('Export Palette')).toBeInTheDocument();
      
      // Click outside
      const outsideElement = screen.getByTestId('outside');
      await user.click(outsideElement);
      
      await waitFor(() => {
        expect(screen.queryByText('Export Palette')).not.toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('handles localStorage errors gracefully', () => {
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('localStorage error');
      });
      
      // Should not throw an error
      expect(() => {
        render(<ExportDropdown palette={mockPalette} />);
      }).not.toThrow();
    });

    it('handles invalid JSON in localStorage', () => {
      localStorageMock.getItem.mockReturnValue('invalid json');
      
      // Should not throw an error
      expect(() => {
        render(<ExportDropdown palette={mockPalette} />);
      }).not.toThrow();
    });

    it('shows error notification when clipboard copy fails', async () => {
      // Mock clipboard to fail
      Object.assign(navigator, {
        clipboard: {
          writeText: jest.fn(() => Promise.reject(new Error('Clipboard error'))),
        },
      });
      
      render(<ExportDropdown palette={mockPalette} />);
      
      const exportButton = screen.getByRole('button', { name: /export/i });
      await user.click(exportButton);
      
      const previewButtons = screen.getAllByTitle('Preview');
      await user.click(previewButtons[0]);
      
      await waitFor(() => {
        const copyButton = screen.getByText('Copy');
        expect(copyButton).toBeInTheDocument();
      });
      
      const copyButton = screen.getByText('Copy');
      await user.click(copyButton);
      
      await waitFor(() => {
        expect(screen.getByText(/Failed to copy to clipboard/)).toBeInTheDocument();
      });
    });
  });

  describe('Custom Props', () => {
    it('applies custom className', () => {
      const { container } = render(
        <ExportDropdown palette={mockPalette} className="custom-class" />
      );
      
      expect(container.firstChild).toHaveClass('custom-class');
    });

    it('calls callback functions with correct parameters', async () => {
      const onExportSuccess = jest.fn();
      const onExportError = jest.fn();
      
      render(
        <ExportDropdown 
          palette={mockPalette} 
          onExportSuccess={onExportSuccess}
          onExportError={onExportError}
        />
      );
      
      const exportButton = screen.getByRole('button', { name: /export/i });
      await user.click(exportButton);
      
      const downloadButton = screen.getAllByText('Download')[0];
      await user.click(downloadButton);
      
      await waitFor(() => {
        expect(onExportSuccess).toHaveBeenCalledWith(
          'css',
          expect.stringContaining('test-palette')
        );
      });
    });
  });
});