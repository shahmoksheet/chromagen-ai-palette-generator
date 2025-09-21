import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import ColorPalette from '../ColorPalette';
import { ColorPalette as ColorPaletteType, Color } from '../../types/color';

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock clipboard API
const mockClipboard = {
  writeText: vi.fn(),
};

// Mock document.execCommand for fallback
const mockExecCommand = vi.fn();

describe('ColorPalette', () => {
  const mockColor1: Color = {
    hex: '#FF6B6B',
    rgb: { r: 255, g: 107, b: 107 },
    hsl: { h: 0, s: 100, l: 71 },
    name: 'Coral Red',
    category: 'primary',
    usage: 'Use for primary buttons and call-to-action elements',
    accessibility: {
      contrastWithWhite: 2.1,
      contrastWithBlack: 10.0,
      wcagLevel: 'AA',
    },
  };

  const mockColor2: Color = {
    hex: '#4ECDC4',
    rgb: { r: 78, g: 205, b: 196 },
    hsl: { h: 176, s: 57, l: 55 },
    name: 'Turquoise',
    category: 'secondary',
    usage: 'Perfect for secondary actions and highlights',
    accessibility: {
      contrastWithWhite: 1.8,
      contrastWithBlack: 11.7,
      wcagLevel: 'AAA',
    },
  };

  const mockColor3: Color = {
    hex: '#FFE66D',
    rgb: { r: 255, g: 230, b: 109 },
    hsl: { h: 50, s: 100, l: 71 },
    name: 'Sunny Yellow',
    category: 'accent',
    usage: 'Use sparingly for emphasis and warnings',
    accessibility: {
      contrastWithWhite: 1.2,
      contrastWithBlack: 17.5,
      wcagLevel: 'FAIL',
    },
  };

  const mockPalette: ColorPaletteType = {
    id: 'test-palette-1',
    name: 'Test Palette',
    prompt: 'A vibrant palette for a modern app',
    colors: [mockColor1, mockColor2, mockColor3],
    accessibilityScore: {
      overallScore: 'AA',
      contrastRatios: [
        {
          color1: '#FF6B6B',
          color2: '#FFFFFF',
          ratio: 2.1,
          level: 'AA',
          isTextReadable: true,
        },
      ],
      colorBlindnessCompatible: true,
      recommendations: [
        'Consider using darker shades for better contrast',
        'Test with color blindness simulators',
      ],
      passedChecks: 2,
      totalChecks: 3,
    },
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  const mockOnColorCopy = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockClipboard.writeText.mockResolvedValue(undefined);
    
    // Setup navigator.clipboard mock
    Object.defineProperty(navigator, 'clipboard', {
      value: mockClipboard,
      writable: true,
    });
    
    // Setup document.execCommand mock
    Object.defineProperty(document, 'execCommand', {
      value: mockExecCommand,
      writable: true,
    });
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  it('renders palette with correct name and prompt', () => {
    render(<ColorPalette palette={mockPalette} />);
    
    expect(screen.getByText('Test Palette')).toBeInTheDocument();
    expect(screen.getByText('"A vibrant palette for a modern app"')).toBeInTheDocument();
  });

  it('displays colors grouped by category', () => {
    render(<ColorPalette palette={mockPalette} />);
    
    expect(screen.getByText('Primary Colors')).toBeInTheDocument();
    expect(screen.getByText('Secondary Colors')).toBeInTheDocument();
    expect(screen.getByText('Accent Colors')).toBeInTheDocument();
    
    expect(screen.getByText('Coral Red')).toBeInTheDocument();
    expect(screen.getByText('Turquoise')).toBeInTheDocument();
    expect(screen.getByText('Sunny Yellow')).toBeInTheDocument();
  });

  it('shows default HEX color format', () => {
    render(<ColorPalette palette={mockPalette} />);
    
    expect(screen.getByText('#FF6B6B')).toBeInTheDocument();
    expect(screen.getByText('#4ECDC4')).toBeInTheDocument();
    expect(screen.getByText('#FFE66D')).toBeInTheDocument();
  });

  it('switches color formats when format buttons are clicked', async () => {
    const user = userEvent.setup();
    render(<ColorPalette palette={mockPalette} />);
    
    // Switch to RGB format
    await user.click(screen.getByText('RGB'));
    expect(screen.getByText('rgb(255, 107, 107)')).toBeInTheDocument();
    expect(screen.getByText('rgb(78, 205, 196)')).toBeInTheDocument();
    
    // Switch to HSL format
    await user.click(screen.getByText('HSL'));
    expect(screen.getByText('hsl(0, 100%, 71%)')).toBeInTheDocument();
    expect(screen.getByText('hsl(176, 57%, 55%)')).toBeInTheDocument();
    
    // Switch back to HEX
    await user.click(screen.getByText('HEX'));
    expect(screen.getByText('#FF6B6B')).toBeInTheDocument();
  });

  it('copies color value to clipboard when color is clicked', async () => {
    const user = userEvent.setup();
    render(<ColorPalette palette={mockPalette} onColorCopy={mockOnColorCopy} />);
    
    const colorSwatch = screen.getByText('#FF6B6B');
    await user.click(colorSwatch);
    
    expect(mockClipboard.writeText).toHaveBeenCalledWith('#FF6B6B');
    expect(mockOnColorCopy).toHaveBeenCalledWith(mockColor1, 'hex');
  });

  it('copies color value in selected format', async () => {
    const user = userEvent.setup();
    render(<ColorPalette palette={mockPalette} onColorCopy={mockOnColorCopy} />);
    
    // Switch to RGB format
    await user.click(screen.getByText('RGB'));
    
    const colorSwatch = screen.getByText('rgb(255, 107, 107)');
    await user.click(colorSwatch);
    
    expect(mockClipboard.writeText).toHaveBeenCalledWith('rgb(255, 107, 107)');
    expect(mockOnColorCopy).toHaveBeenCalledWith(mockColor1, 'rgb');
  });

  it('shows copied confirmation when color is copied', async () => {
    vi.useFakeTimers();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<ColorPalette palette={mockPalette} />);
    
    const colorSwatch = screen.getByText('#FF6B6B');
    await user.click(colorSwatch);
    
    expect(screen.getByText('Copied!')).toBeInTheDocument();
    
    // Fast-forward time to check if copied state resets
    vi.advanceTimersByTime(2000);
    
    await waitFor(() => {
      expect(screen.queryByText('Copied!')).not.toBeInTheDocument();
    });
    
    vi.useRealTimers();
  });

  it('falls back to execCommand when clipboard API fails', async () => {
    mockClipboard.writeText.mockRejectedValue(new Error('Clipboard not available'));
    const user = userEvent.setup();
    render(<ColorPalette palette={mockPalette} />);
    
    const colorSwatch = screen.getByText('#FF6B6B');
    await user.click(colorSwatch);
    
    expect(document.execCommand).toHaveBeenCalledWith('copy');
  });

  it('displays accessibility information by default', () => {
    render(<ColorPalette palette={mockPalette} />);
    
    expect(screen.getByText('Accessibility Score')).toBeInTheDocument();
    expect(screen.getByText('2 of 3 checks passed')).toBeInTheDocument();
    expect(screen.getByText('AA')).toBeInTheDocument();
    expect(screen.getByText('Color-blind friendly')).toBeInTheDocument();
  });

  it('hides accessibility information when showAccessibilityInfo is false', () => {
    render(<ColorPalette palette={mockPalette} showAccessibilityInfo={false} />);
    
    expect(screen.queryByText('Accessibility Score')).not.toBeInTheDocument();
    expect(screen.queryByText('2 of 3 checks passed')).not.toBeInTheDocument();
  });

  it('displays WCAG level badges for each color', () => {
    render(<ColorPalette palette={mockPalette} />);
    
    // Should show badges for each color's accessibility level
    const aaBadges = screen.getAllByText('AA');
    const aaaBadges = screen.getAllByText('AAA');
    const failBadges = screen.getAllByText('FAIL');
    
    expect(aaBadges.length).toBeGreaterThan(0);
    expect(aaaBadges.length).toBeGreaterThan(0);
    expect(failBadges.length).toBeGreaterThan(0);
  });

  it('shows usage recommendations by default', () => {
    render(<ColorPalette palette={mockPalette} />);
    
    expect(screen.getByText(/Use for primary buttons and call-to-action elements/)).toBeInTheDocument();
    expect(screen.getByText(/Perfect for secondary actions and highlights/)).toBeInTheDocument();
    expect(screen.getByText(/Use sparingly for emphasis and warnings/)).toBeInTheDocument();
  });

  it('toggles usage recommendations when button is clicked', async () => {
    const user = userEvent.setup();
    render(<ColorPalette palette={mockPalette} />);
    
    // Usage recommendations should be visible initially
    expect(screen.getByText(/Use for primary buttons and call-to-action elements/)).toBeInTheDocument();
    
    // Click toggle button to hide recommendations
    await user.click(screen.getByText('Usage Tips'));
    
    expect(screen.queryByText(/Use for primary buttons and call-to-action elements/)).not.toBeInTheDocument();
    
    // Click again to show recommendations
    await user.click(screen.getByText('Usage Tips'));
    
    expect(screen.getByText(/Use for primary buttons and call-to-action elements/)).toBeInTheDocument();
  });

  it('displays accessibility recommendations when available', () => {
    render(<ColorPalette palette={mockPalette} />);
    
    expect(screen.getByText('Accessibility Recommendations')).toBeInTheDocument();
    expect(screen.getByText(/Consider using darker shades for better contrast/)).toBeInTheDocument();
    expect(screen.getByText(/Test with color blindness simulators/)).toBeInTheDocument();
  });

  it('does not display accessibility recommendations section when none exist', () => {
    const paletteWithoutRecommendations = {
      ...mockPalette,
      accessibilityScore: {
        ...mockPalette.accessibilityScore,
        recommendations: [],
      },
    };
    
    render(<ColorPalette palette={paletteWithoutRecommendations} />);
    
    expect(screen.queryByText('Accessibility Recommendations')).not.toBeInTheDocument();
  });

  it('shows contrast information for each color', () => {
    render(<ColorPalette palette={mockPalette} />);
    
    expect(screen.getByText('Best with black (10.00:1)')).toBeInTheDocument();
    expect(screen.getByText('Best with black (11.70:1)')).toBeInTheDocument();
    expect(screen.getByText('Best with black (17.50:1)')).toBeInTheDocument();
  });

  it('handles hover states on color swatches', async () => {
    const user = userEvent.setup();
    render(<ColorPalette palette={mockPalette} />);
    
    const colorContainer = screen.getByText('Coral Red').closest('.bg-white');
    expect(colorContainer).toBeInTheDocument();
    
    if (colorContainer) {
      await user.hover(colorContainer);
      expect(screen.getByText('Click to copy')).toBeInTheDocument();
      
      await user.unhover(colorContainer);
      await waitFor(() => {
        expect(screen.queryByText('Click to copy')).not.toBeInTheDocument();
      });
    }
  });

  it('applies custom className when provided', () => {
    const { container } = render(
      <ColorPalette palette={mockPalette} className="custom-class" />
    );
    
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('handles empty color categories gracefully', () => {
    const paletteWithMissingCategories = {
      ...mockPalette,
      colors: [mockColor1], // Only primary color
    };
    
    render(<ColorPalette palette={paletteWithMissingCategories} />);
    
    expect(screen.getByText('Primary Colors')).toBeInTheDocument();
    expect(screen.queryByText('Secondary Colors')).not.toBeInTheDocument();
    expect(screen.queryByText('Accent Colors')).not.toBeInTheDocument();
  });

  it('handles palette without prompt', () => {
    const paletteWithoutPrompt = {
      ...mockPalette,
      prompt: undefined,
    };
    
    render(<ColorPalette palette={paletteWithoutPrompt} />);
    
    expect(screen.getByText('Test Palette')).toBeInTheDocument();
    expect(screen.queryByText('"A vibrant palette for a modern app"')).not.toBeInTheDocument();
  });
});