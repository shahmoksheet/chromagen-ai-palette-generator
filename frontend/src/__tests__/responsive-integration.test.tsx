/**
 * Integration tests for responsive design across the application
 * Tests viewport changes, touch interactions, and mobile-specific features
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import HomePage from '../pages/HomePage';

// Mock framer-motion to avoid animation issues in tests
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }: any) => children,
}));

// Mock the API
jest.mock('../utils/api', () => ({
  colorAPI: {
    generateFromText: jest.fn(() => Promise.resolve({
      id: 'test-palette',
      name: 'Test Palette',
      prompt: 'test prompt',
      colors: [
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
      ],
      accessibilityScore: {
        overallScore: 'AA',
        passedChecks: 5,
        totalChecks: 6,
        colorBlindnessCompatible: true,
        contrastRatios: [],
        recommendations: [],
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      processingTime: 1500,
    })),
  },
}));

// Mock performance utilities
jest.mock('../utils/performance', () => ({
  performanceMonitor: {
    recordMetric: jest.fn(),
  },
  measureAsync: jest.fn((name, fn) => fn()),
}));

// Mock onboarding
jest.mock('../hooks/useOnboarding', () => ({
  useOnboarding: jest.fn(() => ({
    steps: [],
    isVisible: false,
    startOnboarding: jest.fn(),
    completeOnboarding: jest.fn(),
    skipOnboarding: jest.fn(),
  })),
}));

// Mock onboarding steps
jest.mock('../config/onboardingSteps', () => ({
  getOnboardingSteps: jest.fn(() => []),
}));

// Mock toast
jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// Utility to create a test wrapper
const createTestWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

// Utility to mock window size
const mockWindowSize = (width: number, height: number) => {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  });
  Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: height,
  });
};

describe('Responsive Design Integration', () => {
  let originalInnerWidth: number;
  let originalInnerHeight: number;

  beforeAll(() => {
    originalInnerWidth = window.innerWidth;
    originalInnerHeight = window.innerHeight;
  });

  afterAll(() => {
    mockWindowSize(originalInnerWidth, originalInnerHeight);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Mobile Layout (320px - 767px)', () => {
    beforeEach(() => {
      mockWindowSize(375, 667); // iPhone SE size
    });

    it('should render mobile-optimized layout', () => {
      const Wrapper = createTestWrapper();
      render(
        <Wrapper>
          <HomePage />
        </Wrapper>
      );

      // Check for mobile navigation
      expect(screen.getByLabelText('Open menu')).toBeInTheDocument();
      
      // Desktop navigation should be hidden
      expect(screen.queryByText('Features')).not.toBeInTheDocument();
      expect(screen.queryByText('About')).not.toBeInTheDocument();
    });

    it('should show mobile navigation menu when opened', async () => {
      const Wrapper = createTestWrapper();
      render(
        <Wrapper>
          <HomePage />
        </Wrapper>
      );

      const menuButton = screen.getByLabelText('Open menu');
      fireEvent.click(menuButton);

      await waitFor(() => {
        expect(screen.getByText('Features')).toBeInTheDocument();
        expect(screen.getByText('About')).toBeInTheDocument();
        expect(screen.getByText('Help')).toBeInTheDocument();
        expect(screen.getByText('Take Tour')).toBeInTheDocument();
      });
    });

    it('should use mobile-optimized text sizes', () => {
      const Wrapper = createTestWrapper();
      render(
        <Wrapper>
          <HomePage />
        </Wrapper>
      );

      const heading = screen.getByText('AI-Powered Color');
      expect(heading).toHaveClass('text-3xl'); // Mobile size
    });

    it('should stack action buttons vertically on mobile', () => {
      const Wrapper = createTestWrapper();
      render(
        <Wrapper>
          <HomePage />
        </Wrapper>
      );

      const buttonContainer = screen.getByText('Start Creating').parentElement;
      expect(buttonContainer).toHaveClass('flex-col');
    });
  });

  describe('Tablet Layout (768px - 1023px)', () => {
    beforeEach(() => {
      mockWindowSize(768, 1024); // iPad size
    });

    it('should render tablet-optimized layout', () => {
      const Wrapper = createTestWrapper();
      render(
        <Wrapper>
          <HomePage />
        </Wrapper>
      );

      // Should show desktop navigation on tablet
      expect(screen.getByText('Features')).toBeInTheDocument();
      expect(screen.getByText('About')).toBeInTheDocument();
      
      // Mobile menu should not be visible
      expect(screen.queryByLabelText('Open menu')).not.toBeInTheDocument();
    });

    it('should use medium text sizes on tablet', () => {
      const Wrapper = createTestWrapper();
      render(
        <Wrapper>
          <HomePage />
        </Wrapper>
      );

      const heading = screen.getByText('AI-Powered Color');
      expect(heading).toHaveClass('md:text-5xl'); // Tablet size
    });
  });

  describe('Desktop Layout (1024px+)', () => {
    beforeEach(() => {
      mockWindowSize(1200, 800);
    });

    it('should render desktop-optimized layout', () => {
      const Wrapper = createTestWrapper();
      render(
        <Wrapper>
          <HomePage />
        </Wrapper>
      );

      // Desktop navigation should be visible
      expect(screen.getByText('Features')).toBeInTheDocument();
      expect(screen.getByText('About')).toBeInTheDocument();
      expect(screen.getByText('Help')).toBeInTheDocument();
      expect(screen.getByText('Tour')).toBeInTheDocument();
      
      // Mobile menu should not be visible
      expect(screen.queryByLabelText('Open menu')).not.toBeInTheDocument();
    });

    it('should use large text sizes on desktop', () => {
      const Wrapper = createTestWrapper();
      render(
        <Wrapper>
          <HomePage />
        </Wrapper>
      );

      const heading = screen.getByText('AI-Powered Color');
      expect(heading).toHaveClass('lg:text-6xl'); // Desktop size
    });

    it('should arrange action buttons horizontally on desktop', () => {
      const Wrapper = createTestWrapper();
      render(
        <Wrapper>
          <HomePage />
        </Wrapper>
      );

      const buttonContainer = screen.getByText('Start Creating').parentElement;
      expect(buttonContainer).toHaveClass('sm:flex-row');
    });
  });

  describe('Responsive Color Grid', () => {
    it('should adapt grid columns based on screen size', async () => {
      const Wrapper = createTestWrapper();
      
      // Test mobile grid
      mockWindowSize(375, 667);
      const { rerender } = render(
        <Wrapper>
          <HomePage />
        </Wrapper>
      );

      // Generate a palette to see the grid
      const promptInput = screen.getByPlaceholderText('Describe your ideal color palette...');
      fireEvent.change(promptInput, { target: { value: 'test palette prompt' } });
      
      const generateButton = screen.getByText('Generate');
      fireEvent.click(generateButton);

      await waitFor(() => {
        expect(screen.getByText('Test Palette')).toBeInTheDocument();
      });

      // Check mobile grid (should have fewer columns)
      const colorGrid = screen.getByText('Vibrant Orange').closest('[class*="grid"]');
      expect(colorGrid).toHaveClass('grid-cols-2'); // Mobile: 2 columns

      // Test desktop grid
      mockWindowSize(1200, 800);
      rerender(
        <Wrapper>
          <HomePage />
        </Wrapper>
      );

      // Grid should adapt to desktop
      expect(colorGrid).toHaveClass('lg:grid-cols-6'); // Desktop: 6 columns
    });
  });

  describe('Touch Interactions', () => {
    beforeEach(() => {
      mockWindowSize(375, 667); // Mobile size
      
      // Mock touch support
      Object.defineProperty(window, 'ontouchstart', {
        writable: true,
        configurable: true,
        value: null,
      });
    });

    it('should handle touch events on mobile buttons', () => {
      const Wrapper = createTestWrapper();
      render(
        <Wrapper>
          <HomePage />
        </Wrapper>
      );

      const startButton = screen.getByText('Start Creating');
      
      // Should have minimum touch target size
      expect(startButton).toHaveClass('min-h-[48px]');
      
      // Test touch interaction
      fireEvent.touchStart(startButton);
      fireEvent.touchEnd(startButton);
      
      // Button should remain functional
      expect(startButton).toBeInTheDocument();
    });
  });

  describe('Performance Optimizations', () => {
    it('should apply mobile performance optimizations', () => {
      mockWindowSize(375, 667);
      
      const Wrapper = createTestWrapper();
      render(
        <Wrapper>
          <HomePage />
        </Wrapper>
      );

      // Check that mobile performance hooks are called
      // This would be verified through the mocked hooks
      expect(document.documentElement.style.getPropertyValue('--animation-duration')).toBe('0.2s');
    });

    it('should use standard animations on desktop', () => {
      mockWindowSize(1200, 800);
      
      const Wrapper = createTestWrapper();
      render(
        <Wrapper>
          <HomePage />
        </Wrapper>
      );

      // Desktop should use longer animations
      expect(document.documentElement.style.getPropertyValue('--animation-duration')).toBe('0.3s');
    });
  });

  describe('Accessibility on Mobile', () => {
    beforeEach(() => {
      mockWindowSize(375, 667);
    });

    it('should maintain accessibility standards on mobile', () => {
      const Wrapper = createTestWrapper();
      render(
        <Wrapper>
          <HomePage />
        </Wrapper>
      );

      // Check for proper ARIA labels
      expect(screen.getByLabelText('Open menu')).toBeInTheDocument();
      
      // Check for minimum touch target sizes
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        const styles = window.getComputedStyle(button);
        const minHeight = parseInt(styles.minHeight);
        expect(minHeight).toBeGreaterThanOrEqual(44); // WCAG minimum touch target
      });
    });
  });

  describe('Viewport Height Handling', () => {
    it('should handle mobile viewport height correctly', () => {
      mockWindowSize(375, 667);
      
      const Wrapper = createTestWrapper();
      render(
        <Wrapper>
          <HomePage />
        </Wrapper>
      );

      // Check that viewport height CSS variable is set
      const vhValue = document.documentElement.style.getPropertyValue('--vh');
      expect(vhValue).toBeTruthy();
    });
  });
});