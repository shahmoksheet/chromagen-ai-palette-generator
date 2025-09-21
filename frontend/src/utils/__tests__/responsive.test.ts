import { renderHook, act } from '@testing-library/react';
import { useScreenSize, useTouchDevice, getResponsiveGridClasses, getResponsiveTextClasses, getModalClasses } from '../responsive';
import { vi, beforeEach, describe, it, expect } from 'vitest';

/**
 * @vitest-environment jsdom
 */

// Mock window object
const mockWindow = (width: number, height: number) => {
  Object.defineProperty(global.window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  });
  Object.defineProperty(global.window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: height,
  });
};

// Setup window mock
Object.defineProperty(global, 'window', {
  value: {
    innerWidth: 1024,
    innerHeight: 768,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  },
  writable: true,
});

// Setup navigator mock
Object.defineProperty(global, 'navigator', {
  value: {
    maxTouchPoints: 0,
  },
  writable: true,
});

describe('Responsive Utilities', () => {
  beforeEach(() => {
    // Reset window size
    mockWindow(1024, 768);
  });

  describe('useScreenSize', () => {
    it('should detect desktop screen size', () => {
      mockWindow(1200, 800);
      const { result } = renderHook(() => useScreenSize());

      expect(result.current.width).toBe(1200);
      expect(result.current.height).toBe(800);
      expect(result.current.breakpoint).toBe('lg');
      expect(result.current.isDesktop).toBe(true);
      expect(result.current.isMobile).toBe(false);
      expect(result.current.isTablet).toBe(false);
    });

    it('should detect mobile screen size', () => {
      mockWindow(375, 667);
      const { result } = renderHook(() => useScreenSize());

      expect(result.current.width).toBe(375);
      expect(result.current.breakpoint).toBe('sm');
      expect(result.current.isMobile).toBe(true);
      expect(result.current.isDesktop).toBe(false);
      expect(result.current.isTablet).toBe(false);
    });

    it('should detect tablet screen size', () => {
      mockWindow(768, 1024);
      const { result } = renderHook(() => useScreenSize());

      expect(result.current.width).toBe(768);
      expect(result.current.breakpoint).toBe('md');
      expect(result.current.isMobile).toBe(false);
      expect(result.current.isDesktop).toBe(false);
      expect(result.current.isTablet).toBe(true);
    });

    it('should update on window resize', () => {
      const { result } = renderHook(() => useScreenSize());
      
      // Start with desktop
      expect(result.current.isDesktop).toBe(true);

      // Simulate resize to mobile
      act(() => {
        mockWindow(375, 667);
        window.dispatchEvent(new Event('resize'));
      });

      expect(result.current.isMobile).toBe(true);
      expect(result.current.isDesktop).toBe(false);
    });
  });

  describe('useTouchDevice', () => {
    it('should detect touch device', () => {
      // Mock touch support
      Object.defineProperty(window, 'ontouchstart', {
        writable: true,
        configurable: true,
        value: null,
      });

      const { result } = renderHook(() => useTouchDevice());
      expect(result.current).toBe(true);
    });

    it('should detect non-touch device', () => {
      // Remove touch support
      delete (window as any).ontouchstart;
      Object.defineProperty(navigator, 'maxTouchPoints', {
        writable: true,
        configurable: true,
        value: 0,
      });

      const { result } = renderHook(() => useTouchDevice());
      expect(result.current).toBe(false);
    });
  });

  describe('getResponsiveGridClasses', () => {
    it('should generate correct grid classes', () => {
      const classes = getResponsiveGridClasses(1, 2, 3, 4);
      expect(classes).toBe('grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4');
    });

    it('should handle optional parameters', () => {
      const classes = getResponsiveGridClasses(2);
      expect(classes).toBe('grid-cols-2');
    });

    it('should handle partial parameters', () => {
      const classes = getResponsiveGridClasses(1, 2);
      expect(classes).toBe('grid-cols-1 md:grid-cols-2');
    });
  });

  describe('getResponsiveTextClasses', () => {
    it('should generate correct text classes', () => {
      const classes = getResponsiveTextClasses('text-sm', 'text-base', 'text-lg');
      expect(classes).toBe('text-sm md:text-base lg:text-lg');
    });

    it('should handle mobile only', () => {
      const classes = getResponsiveTextClasses('text-sm');
      expect(classes).toBe('text-sm');
    });

    it('should handle mobile and tablet', () => {
      const classes = getResponsiveTextClasses('text-sm', 'text-base');
      expect(classes).toBe('text-sm md:text-base');
    });
  });

  describe('getModalClasses', () => {
    it('should return mobile modal classes', () => {
      const classes = getModalClasses(true);
      
      expect(classes.overlay).toContain('items-end');
      expect(classes.content).toContain('rounded-t-2xl');
      expect(classes.animation.initial).toEqual({ y: '100%' });
    });

    it('should return desktop modal classes', () => {
      const classes = getModalClasses(false);
      
      expect(classes.overlay).toContain('items-center');
      expect(classes.content).toContain('rounded-2xl');
      expect(classes.animation.initial).toEqual({ scale: 0.9, opacity: 0 });
    });
  });
});

// Integration tests for responsive components
describe('Responsive Integration', () => {
  it('should provide consistent breakpoint detection', () => {
    const breakpoints = [
      { width: 320, expected: 'sm', isMobile: true },
      { width: 640, expected: 'sm', isMobile: true },
      { width: 768, expected: 'md', isTablet: true },
      { width: 1024, expected: 'lg', isDesktop: true },
      { width: 1280, expected: 'xl', isDesktop: true },
      { width: 1536, expected: '2xl', isDesktop: true },
    ];

    breakpoints.forEach(({ width, expected, isMobile, isTablet, isDesktop }) => {
      mockWindow(width, 800);
      const { result } = renderHook(() => useScreenSize());
      
      expect(result.current.breakpoint).toBe(expected);
      if (isMobile) expect(result.current.isMobile).toBe(true);
      if (isTablet) expect(result.current.isTablet).toBe(true);
      if (isDesktop) expect(result.current.isDesktop).toBe(true);
    });
  });
});