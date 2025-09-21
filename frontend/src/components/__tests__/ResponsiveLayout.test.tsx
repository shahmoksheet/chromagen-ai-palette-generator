import React from 'react';
import { render, screen } from '@testing-library/react';
import { act } from '@testing-library/react';
import ResponsiveLayout from '../ResponsiveLayout';

// Mock the responsive utilities
jest.mock('../utils/responsive', () => ({
  useScreenSize: jest.fn(() => ({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    width: 1024,
    height: 768,
    breakpoint: 'lg',
  })),
  useMobilePerformance: jest.fn(),
  useViewportHeight: jest.fn(),
  CONTAINER_CLASSES: {
    full: 'w-full',
    constrained: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8',
    narrow: 'max-w-4xl mx-auto px-4 sm:px-6 lg:px-8',
    wide: 'max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8',
  },
}));

describe('ResponsiveLayout', () => {
  it('should render children with default container classes', () => {
    render(
      <ResponsiveLayout>
        <div data-testid="child">Test content</div>
      </ResponsiveLayout>
    );

    const container = screen.getByTestId('child').parentElement;
    expect(container).toHaveClass('max-w-7xl', 'mx-auto', 'px-4', 'sm:px-6', 'lg:px-8');
  });

  it('should apply custom container type', () => {
    render(
      <ResponsiveLayout container="narrow">
        <div data-testid="child">Test content</div>
      </ResponsiveLayout>
    );

    const container = screen.getByTestId('child').parentElement;
    expect(container).toHaveClass('max-w-4xl');
  });

  it('should apply custom className', () => {
    render(
      <ResponsiveLayout className="custom-class">
        <div data-testid="child">Test content</div>
      </ResponsiveLayout>
    );

    const container = screen.getByTestId('child').parentElement;
    expect(container).toHaveClass('custom-class');
  });

  it('should call performance and viewport hooks', () => {
    const { useMobilePerformance, useViewportHeight } = require('../utils/responsive');
    
    render(
      <ResponsiveLayout>
        <div>Test</div>
      </ResponsiveLayout>
    );

    expect(useMobilePerformance).toHaveBeenCalled();
    expect(useViewportHeight).toHaveBeenCalled();
  });
});