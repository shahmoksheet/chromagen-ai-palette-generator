import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ResponsiveColorGrid from '../ResponsiveColorGrid';
import { Color } from '../../types/color';

// Mock the responsive utilities
jest.mock('../../utils/responsive', () => ({
  useScreenSize: jest.fn(() => ({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
  })),
  useMobileInteractions: jest.fn(() => ({
    getTouchProps: jest.fn((onClick) => ({ onClick })),
  })),
  getResponsiveGridClasses: jest.fn(() => 'grid-cols-2 md:grid-cols-3 lg:grid-cols-6'),
}));

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn(() => Promise.resolve()),
  },
});

const mockColors: Color[] = [
  {
    hex: '#FF5733',
    rgb: { r: 255, g: 87, b: 51 },
    hsl: { h: 12, s: 100, l: 60 },
    name: 'Vibrant Orange',
    category: 'primary',
    usage: 'Primary brand color',
    accessibility: {
      contrastWithWhite: 3.2,
      contrastWithBlack: 6.5,
      wcagLevel: 'AA',
    },
  },
  {
    hex: '#33C3FF',
    rgb: { r: 51, g: 195, b: 255 },
    hsl: { h: 198, s: 100, l: 60 },
    name: 'Sky Blue',
    category: 'secondary',
    usage: 'Secondary accent color',
    accessibility: {
      contrastWithWhite: 2.8,
      contrastWithBlack: 7.5,
      wcagLevel: 'AA',
    },
  },
];

describe('ResponsiveColorGrid', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render color grid with correct responsive classes', () => {
    const { container } = render(<ResponsiveColorGrid colors={mockColors} />);
    
    const grid = container.firstChild;
    expect(grid).toHaveClass('grid', 'grid-cols-2', 'md:grid-cols-3', 'lg:grid-cols-6');
  });

  it('should render all colors', () => {
    render(<ResponsiveColorGrid colors={mockColors} />);
    
    expect(screen.getByText('Vibrant Orange')).toBeInTheDocument();
    expect(screen.getByText('Sky Blue')).toBeInTheDocument();
    expect(screen.getByText('#FF5733')).toBeInTheDocument();
    expect(screen.getByText('#33C3FF')).toBeInTheDocument();
  });

  it('should handle color click and copy to clipboard', async () => {
    const onColorClick = jest.fn();
    render(
      <ResponsiveColorGrid 
        colors={mockColors} 
        onColorClick={onColorClick}
        showCopyFeedback={true}
      />
    );

    const colorSwatch = screen.getByTitle('Vibrant Orange - #FF5733 - Click to copy');
    fireEvent.click(colorSwatch);

    expect(onColorClick).toHaveBeenCalledWith(mockColors[0]);
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('#FF5733');
  });

  it('should show copy feedback when color is copied', async () => {
    render(<ResponsiveColorGrid colors={mockColors} showCopyFeedback={true} />);

    const colorSwatch = screen.getByTitle('Vibrant Orange - #FF5733 - Click to copy');
    fireEvent.click(colorSwatch);

    await waitFor(() => {
      expect(screen.getByRole('img', { hidden: true })).toBeInTheDocument(); // Check icon
    });
  });

  it('should adapt to mobile screen size', () => {
    const { useScreenSize } = require('../../utils/responsive');
    useScreenSize.mockReturnValue({
      isMobile: true,
      isTablet: false,
      isDesktop: false,
    });

    render(<ResponsiveColorGrid colors={mockColors} />);
    
    // Should show mobile copy icons
    const copyIcons = screen.getAllByRole('img', { hidden: true });
    expect(copyIcons.length).toBeGreaterThan(0);
  });

  it('should show accessibility indicators on mobile', () => {
    const { useScreenSize } = require('../../utils/responsive');
    useScreenSize.mockReturnValue({
      isMobile: true,
      isTablet: false,
      isDesktop: false,
    });

    render(<ResponsiveColorGrid colors={mockColors} />);
    
    // Check for accessibility indicators (colored dots)
    const indicators = screen.getAllByRole('generic').filter(el => 
      el.className.includes('w-2 h-2 rounded-full')
    );
    expect(indicators.length).toBe(mockColors.length);
  });

  it('should handle touch interactions on mobile', () => {
    const { useMobileInteractions } = require('../../utils/responsive');
    const mockGetTouchProps = jest.fn((onClick) => ({
      onTouchStart: jest.fn(),
      onTouchEnd: onClick,
      onTouchCancel: jest.fn(),
    }));
    
    useMobileInteractions.mockReturnValue({
      getTouchProps: mockGetTouchProps,
    });

    const onColorClick = jest.fn();
    render(<ResponsiveColorGrid colors={mockColors} onColorClick={onColorClick} />);

    expect(mockGetTouchProps).toHaveBeenCalled();
  });

  it('should apply custom className', () => {
    const { container } = render(
      <ResponsiveColorGrid colors={mockColors} className="custom-grid" />
    );
    
    expect(container.firstChild).toHaveClass('custom-grid');
  });

  it('should handle empty colors array', () => {
    const { container } = render(<ResponsiveColorGrid colors={[]} />);
    
    const grid = container.firstChild;
    expect(grid).toHaveClass('grid');
    expect(grid?.children).toHaveLength(0);
  });

  it('should display color categories correctly', () => {
    render(<ResponsiveColorGrid colors={mockColors} />);
    
    expect(screen.getByText('primary')).toBeInTheDocument();
    expect(screen.getByText('secondary')).toBeInTheDocument();
  });
});