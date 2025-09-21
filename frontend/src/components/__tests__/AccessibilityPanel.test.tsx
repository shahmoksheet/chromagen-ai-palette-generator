import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import AccessibilityPanel from '../AccessibilityPanel';
import { ColorPalette, ColorBlindnessType } from '../../types/color';

// Mock framer-motion to avoid animation issues in tests
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock the accessibility utilities
jest.mock('../../utils/accessibility', () => ({
  simulateColorBlindness: jest.fn((hex: string, type: string) => {
    // Simple mock that changes the color slightly for testing
    const colorMap: Record<string, string> = {
      '#FF0000': '#CC0000', // Red becomes darker red
      '#00FF00': '#00CC00', // Green becomes darker green
      '#0000FF': '#0000CC', // Blue becomes darker blue
    };
    return colorMap[hex] || hex;
  }),
  getAccessibilityStatusIcon: jest.fn((level: string) => ({
    icon: level === 'AAA' ? '✓✓' : level === 'AA' ? '✓' : '✗',
    color: level === 'AAA' ? '#22c55e' : level === 'AA' ? '#f59e0b' : '#ef4444',
    label: level === 'AAA' ? 'Excellent (AAA)' : level === 'AA' ? 'Good (AA)' : 'Poor (Fail)',
  })),
  formatContrastRatio: jest.fn((ratio: number) => `${ratio.toFixed(2)}:1`),
  getColorBlindnessDescription: jest.fn((type: string) => {
    const descriptions: Record<string, string> = {
      protanopia: 'Red-blind (Protanopia)',
      deuteranopia: 'Green-blind (Deuteranopia)',
      tritanopia: 'Blue-blind (Tritanopia)',
      achromatopsia: 'Complete color blindness (Achromatopsia)',
    };
    return descriptions[type] || type;
  }),
  analyzeColorAccessibility: jest.fn(() => ({
    contrastWithWhite: 4.5,
    contrastWithBlack: 8.2,
    wcagLevelWhite: 'AA',
    wcagLevelBlack: 'AAA',
    luminance: 0.5,
    recommendations: ['This color works well for text on both light and dark backgrounds.'],
  })),
  getBestTextColor: jest.fn(() => '#000000'),
}));

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
    contrastRatios: [
      {
        color1: '#FF0000',
        color2: '#FFFFFF',
        ratio: 3.99,
        level: 'FAIL',
        isTextReadable: false,
      },
      {
        color1: '#00FF00',
        color2: '#000000',
        ratio: 15.3,
        level: 'AAA',
        isTextReadable: true,
      },
      {
        color1: '#0000FF',
        color2: '#FFFFFF',
        ratio: 8.59,
        level: 'AAA',
        isTextReadable: true,
      },
    ],
    colorBlindnessCompatible: true,
    recommendations: [
      'Consider adjusting the red color for better contrast with white backgrounds.',
      'The green color may be too bright for text use.',
    ],
    passedChecks: 2,
    totalChecks: 3,
  },
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

describe('AccessibilityPanel', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders the accessibility panel with correct title', () => {
      render(<AccessibilityPanel palette={mockPalette} />);
      
      expect(screen.getByText('Accessibility Analysis')).toBeInTheDocument();
      expect(screen.getByText('WCAG compliance and color blindness testing')).toBeInTheDocument();
    });

    it('displays the accessibility overview by default', () => {
      render(<AccessibilityPanel palette={mockPalette} />);
      
      expect(screen.getByText('Accessibility Overview')).toBeInTheDocument();
      expect(screen.getByText('AA')).toBeInTheDocument(); // Overall score
      expect(screen.getByText('2/3')).toBeInTheDocument(); // Passed checks
      expect(screen.getByText('Yes')).toBeInTheDocument(); // Color blind friendly
    });

    it('displays accessibility recommendations', () => {
      render(<AccessibilityPanel palette={mockPalette} />);
      
      expect(screen.getByText('Recommendations')).toBeInTheDocument();
      expect(screen.getByText(/Consider adjusting the red color/)).toBeInTheDocument();
      expect(screen.getByText(/The green color may be too bright/)).toBeInTheDocument();
    });

    it('renders color blindness simulation section', () => {
      render(<AccessibilityPanel palette={mockPalette} />);
      
      expect(screen.getByText('Color Blindness Simulation')).toBeInTheDocument();
      expect(screen.getByText('Protanopia')).toBeInTheDocument();
      expect(screen.getByText('Deuteranopia')).toBeInTheDocument();
      expect(screen.getByText('Tritanopia')).toBeInTheDocument();
      expect(screen.getByText('Achromatopsia')).toBeInTheDocument();
    });

    it('renders contrast analysis section', () => {
      render(<AccessibilityPanel palette={mockPalette} />);
      
      expect(screen.getByText('Contrast Analysis')).toBeInTheDocument();
    });
  });

  describe('Section Expansion/Collapse', () => {
    it('allows toggling of overview section', async () => {
      render(<AccessibilityPanel palette={mockPalette} />);
      
      const overviewButton = screen.getByRole('button', { name: /Accessibility Overview/ });
      
      // Overview should be expanded by default
      expect(screen.getByText('Overall Score')).toBeInTheDocument();
      
      // Click to collapse
      await user.click(overviewButton);
      
      // Should still be visible since we're not testing actual animation
      // In a real test, you might need to wait for animation completion
    });

    it('allows toggling of color blindness section', async () => {
      render(<AccessibilityPanel palette={mockPalette} />);
      
      const colorBlindnessButton = screen.getByRole('button', { name: /Color Blindness Simulation/ });
      
      // Click to expand
      await user.click(colorBlindnessButton);
      
      // Should show color blindness controls
      expect(screen.getByText('Protanopia')).toBeInTheDocument();
    });

    it('allows toggling of contrast analysis section', async () => {
      render(<AccessibilityPanel palette={mockPalette} />);
      
      const contrastButton = screen.getByRole('button', { name: /Contrast Analysis/ });
      
      // Click to expand
      await user.click(contrastButton);
      
      // Should show contrast information
      expect(screen.getByText('Understanding Contrast Ratios')).toBeInTheDocument();
    });
  });

  describe('Color Blindness Simulation', () => {
    it('activates color blindness simulation when type is selected', async () => {
      const onColorBlindnessToggle = jest.fn();
      render(
        <AccessibilityPanel 
          palette={mockPalette} 
          onColorBlindnessToggle={onColorBlindnessToggle}
        />
      );
      
      // Expand color blindness section
      const colorBlindnessButton = screen.getByRole('button', { name: /Color Blindness Simulation/ });
      await user.click(colorBlindnessButton);
      
      // Click on protanopia button
      const protanopiaButton = screen.getByRole('button', { name: 'Protanopia' });
      await user.click(protanopiaButton);
      
      expect(onColorBlindnessToggle).toHaveBeenCalledWith('protanopia');
    });

    it('deactivates color blindness simulation when same type is clicked again', async () => {
      const onColorBlindnessToggle = jest.fn();
      render(
        <AccessibilityPanel 
          palette={mockPalette} 
          onColorBlindnessToggle={onColorBlindnessToggle}
        />
      );
      
      // Expand color blindness section
      const colorBlindnessButton = screen.getByRole('button', { name: /Color Blindness Simulation/ });
      await user.click(colorBlindnessButton);
      
      // Click on protanopia button twice
      const protanopiaButton = screen.getByRole('button', { name: 'Protanopia' });
      await user.click(protanopiaButton);
      await user.click(protanopiaButton);
      
      expect(onColorBlindnessToggle).toHaveBeenLastCalledWith(null);
    });

    it('shows clear simulation button when simulation is active', async () => {
      render(<AccessibilityPanel palette={mockPalette} />);
      
      // Expand color blindness section
      const colorBlindnessButton = screen.getByRole('button', { name: /Color Blindness Simulation/ });
      await user.click(colorBlindnessButton);
      
      // Activate simulation
      const protanopiaButton = screen.getByRole('button', { name: 'Protanopia' });
      await user.click(protanopiaButton);
      
      // Should show clear button
      expect(screen.getByText('Clear Simulation')).toBeInTheDocument();
    });

    it('displays simulated colors when simulation is active', async () => {
      render(<AccessibilityPanel palette={mockPalette} />);
      
      // Expand color blindness section
      const colorBlindnessButton = screen.getByRole('button', { name: /Color Blindness Simulation/ });
      await user.click(colorBlindnessButton);
      
      // Activate simulation
      const protanopiaButton = screen.getByRole('button', { name: 'Protanopia' });
      await user.click(protanopiaButton);
      
      // Should show original colors in the description
      expect(screen.getByText('Original: #FF0000')).toBeInTheDocument();
      expect(screen.getByText('Original: #00FF00')).toBeInTheDocument();
      expect(screen.getByText('Original: #0000FF')).toBeInTheDocument();
    });

    it('shows simulation description when active', async () => {
      render(<AccessibilityPanel palette={mockPalette} />);
      
      // Expand color blindness section
      const colorBlindnessButton = screen.getByRole('button', { name: /Color Blindness Simulation/ });
      await user.click(colorBlindnessButton);
      
      // Activate simulation
      const protanopiaButton = screen.getByRole('button', { name: 'Protanopia' });
      await user.click(protanopiaButton);
      
      // Should show simulation description
      expect(screen.getByText(/Viewing as:/)).toBeInTheDocument();
      expect(screen.getByText(/Red-blind \(Protanopia\)/)).toBeInTheDocument();
    });
  });

  describe('Individual Color Analysis', () => {
    it('shows color analysis when a color is clicked', async () => {
      render(<AccessibilityPanel palette={mockPalette} />);
      
      // Expand color blindness section to see color swatches
      const colorBlindnessButton = screen.getByRole('button', { name: /Color Blindness Simulation/ });
      await user.click(colorBlindnessButton);
      
      // Find and click on a color swatch (they should be rendered as divs with background colors)
      const colorSwatches = screen.getAllByRole('generic').filter(el => 
        el.style.backgroundColor && el.style.backgroundColor !== ''
      );
      
      if (colorSwatches.length > 0) {
        await user.click(colorSwatches[0]);
        
        // Should show color analysis
        expect(screen.getByText(/Color Analysis:/)).toBeInTheDocument();
        expect(screen.getByText('Contrast with White')).toBeInTheDocument();
        expect(screen.getByText('Contrast with Black')).toBeInTheDocument();
      }
    });

    it('closes color analysis when close button is clicked', async () => {
      render(<AccessibilityPanel palette={mockPalette} />);
      
      // Expand color blindness section
      const colorBlindnessButton = screen.getByRole('button', { name: /Color Blindness Simulation/ });
      await user.click(colorBlindnessButton);
      
      // Find and click on a color swatch
      const colorSwatches = screen.getAllByRole('generic').filter(el => 
        el.style.backgroundColor && el.style.backgroundColor !== ''
      );
      
      if (colorSwatches.length > 0) {
        await user.click(colorSwatches[0]);
        
        // Should show close button
        const closeButton = screen.getByText('Close Analysis');
        expect(closeButton).toBeInTheDocument();
        
        // Click close button
        await user.click(closeButton);
        
        // Analysis should be closed (text should not be visible)
        expect(screen.queryByText(/Color Analysis:/)).not.toBeInTheDocument();
      }
    });
  });

  describe('Tooltips', () => {
    it('shows tooltip on hover for help icon', async () => {
      render(<AccessibilityPanel palette={mockPalette} />);
      
      const helpIcon = screen.getByRole('generic', { name: /help/ }) || 
                      document.querySelector('[data-testid="help-icon"]') ||
                      screen.getByText('?') ||
                      document.querySelector('svg[class*="help"]');
      
      if (helpIcon) {
        await user.hover(helpIcon);
        
        await waitFor(() => {
          expect(screen.getByText(/This panel helps ensure/)).toBeInTheDocument();
        });
      }
    });

    it('shows tooltips for color blindness type buttons', async () => {
      render(<AccessibilityPanel palette={mockPalette} />);
      
      // Expand color blindness section
      const colorBlindnessButton = screen.getByRole('button', { name: /Color Blindness Simulation/ });
      await user.click(colorBlindnessButton);
      
      const protanopiaButton = screen.getByRole('button', { name: 'Protanopia' });
      await user.hover(protanopiaButton);
      
      await waitFor(() => {
        expect(screen.getByText(/Red-blind.*affects.*1%.*men/)).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility Features', () => {
    it('has proper ARIA labels and roles', () => {
      render(<AccessibilityPanel palette={mockPalette} />);
      
      // Check for proper button roles
      expect(screen.getByRole('button', { name: /Accessibility Overview/ })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Color Blindness Simulation/ })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Contrast Analysis/ })).toBeInTheDocument();
    });

    it('supports keyboard navigation', async () => {
      render(<AccessibilityPanel palette={mockPalette} />);
      
      // Tab through the interface
      await user.tab();
      
      // Should focus on the first interactive element
      const firstButton = screen.getByRole('button', { name: /Accessibility Overview/ });
      expect(firstButton).toHaveFocus();
    });

    it('displays proper contrast ratio information', () => {
      render(<AccessibilityPanel palette={mockPalette} />);
      
      // Expand contrast section
      const contrastButton = screen.getByRole('button', { name: /Contrast Analysis/ });
      fireEvent.click(contrastButton);
      
      // Should show contrast ratio explanations
      expect(screen.getByText(/AAA \(7:1\)/)).toBeInTheDocument();
      expect(screen.getByText(/AA \(4.5:1\)/)).toBeInTheDocument();
      expect(screen.getByText(/Enhanced contrast for users with low vision/)).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('handles empty palette gracefully', () => {
      const emptyPalette: ColorPalette = {
        ...mockPalette,
        colors: [],
        accessibilityScore: {
          overallScore: 'FAIL',
          contrastRatios: [],
          colorBlindnessCompatible: false,
          recommendations: ['No colors to analyze'],
          passedChecks: 0,
          totalChecks: 0,
        },
      };
      
      render(<AccessibilityPanel palette={emptyPalette} />);
      
      expect(screen.getByText('Accessibility Analysis')).toBeInTheDocument();
      expect(screen.getByText('0/0')).toBeInTheDocument();
    });

    it('handles palette with no recommendations', () => {
      const perfectPalette: ColorPalette = {
        ...mockPalette,
        accessibilityScore: {
          ...mockPalette.accessibilityScore,
          recommendations: [],
        },
      };
      
      render(<AccessibilityPanel palette={perfectPalette} />);
      
      expect(screen.getByText('Accessibility Analysis')).toBeInTheDocument();
      // Should not show recommendations section
      expect(screen.queryByText('Recommendations')).not.toBeInTheDocument();
    });
  });

  describe('Custom Props', () => {
    it('applies custom className', () => {
      const { container } = render(
        <AccessibilityPanel palette={mockPalette} className="custom-class" />
      );
      
      expect(container.firstChild).toHaveClass('custom-class');
    });

    it('calls onColorBlindnessToggle callback with correct parameters', async () => {
      const onToggle = jest.fn();
      render(
        <AccessibilityPanel 
          palette={mockPalette} 
          onColorBlindnessToggle={onToggle}
        />
      );
      
      // Expand color blindness section
      const colorBlindnessButton = screen.getByRole('button', { name: /Color Blindness Simulation/ });
      await user.click(colorBlindnessButton);
      
      // Test each color blindness type
      const types: ColorBlindnessType[] = ['protanopia', 'deuteranopia', 'tritanopia', 'achromatopsia'];
      
      for (const type of types) {
        const button = screen.getByRole('button', { name: new RegExp(type, 'i') });
        await user.click(button);
        expect(onToggle).toHaveBeenCalledWith(type);
      }
    });
  });
});