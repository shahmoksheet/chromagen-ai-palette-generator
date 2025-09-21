import { useState, useEffect } from 'react';

/**
 * Responsive design utilities for ChromaGen
 * Provides consistent breakpoints, touch interactions, and mobile optimizations
 */

// Tailwind CSS breakpoints
export const BREAKPOINTS = {
  sm: 640,   // Small devices (landscape phones)
  md: 768,   // Medium devices (tablets)
  lg: 1024,  // Large devices (desktops)
  xl: 1280,  // Extra large devices
  '2xl': 1536, // 2X Extra large devices
} as const;

export type Breakpoint = keyof typeof BREAKPOINTS;

/**
 * Hook to detect current screen size
 */
export const useScreenSize = () => {
  const [screenSize, setScreenSize] = useState<{
    width: number;
    height: number;
    breakpoint: Breakpoint;
    isMobile: boolean;
    isTablet: boolean;
    isDesktop: boolean;
  }>({
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
    height: typeof window !== 'undefined' ? window.innerHeight : 768,
    breakpoint: 'lg',
    isMobile: false,
    isTablet: false,
    isDesktop: true,
  });

  useEffect(() => {
    const updateScreenSize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      let breakpoint: Breakpoint = 'sm';
      if (width >= BREAKPOINTS['2xl']) breakpoint = '2xl';
      else if (width >= BREAKPOINTS.xl) breakpoint = 'xl';
      else if (width >= BREAKPOINTS.lg) breakpoint = 'lg';
      else if (width >= BREAKPOINTS.md) breakpoint = 'md';
      else breakpoint = 'sm';

      const isMobile = width < BREAKPOINTS.md;
      const isTablet = width >= BREAKPOINTS.md && width < BREAKPOINTS.lg;
      const isDesktop = width >= BREAKPOINTS.lg;

      setScreenSize({
        width,
        height,
        breakpoint,
        isMobile,
        isTablet,
        isDesktop,
      });
    };

    updateScreenSize();
    window.addEventListener('resize', updateScreenSize);
    
    return () => window.removeEventListener('resize', updateScreenSize);
  }, []);

  return screenSize;
};

/**
 * Hook to detect touch device
 */
export const useTouchDevice = () => {
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    const checkTouchDevice = () => {
      setIsTouchDevice(
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0 ||
        // @ts-ignore
        navigator.msMaxTouchPoints > 0
      );
    };

    checkTouchDevice();
  }, []);

  return isTouchDevice;
};

/**
 * Hook for mobile-optimized interactions
 */
export const useMobileInteractions = () => {
  const { isMobile } = useScreenSize();
  const isTouchDevice = useTouchDevice();

  const getTouchProps = (onClick?: () => void) => {
    if (!isTouchDevice) return { onClick };

    return {
      onTouchStart: (e: React.TouchEvent) => {
        // Add touch feedback
        (e.currentTarget as HTMLElement).style.transform = 'scale(0.98)';
      },
      onTouchEnd: (e: React.TouchEvent) => {
        // Remove touch feedback
        (e.currentTarget as HTMLElement).style.transform = 'scale(1)';
        onClick?.();
      },
      onTouchCancel: (e: React.TouchEvent) => {
        // Remove touch feedback on cancel
        (e.currentTarget as HTMLElement).style.transform = 'scale(1)';
      },
    };
  };

  const getSwipeProps = (
    onSwipeLeft?: () => void,
    onSwipeRight?: () => void,
    threshold = 50
  ) => {
    if (!isTouchDevice) return {};

    let startX = 0;
    let startY = 0;

    return {
      onTouchStart: (e: React.TouchEvent) => {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
      },
      onTouchEnd: (e: React.TouchEvent) => {
        const endX = e.changedTouches[0].clientX;
        const endY = e.changedTouches[0].clientY;
        
        const deltaX = endX - startX;
        const deltaY = endY - startY;
        
        // Only trigger swipe if horizontal movement is greater than vertical
        if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > threshold) {
          if (deltaX > 0) {
            onSwipeRight?.();
          } else {
            onSwipeLeft?.();
          }
        }
      },
    };
  };

  return {
    isMobile,
    isTouchDevice,
    getTouchProps,
    getSwipeProps,
  };
};

/**
 * Responsive grid utilities
 */
export const getResponsiveGridClasses = (
  mobile: number,
  tablet?: number,
  desktop?: number,
  xl?: number
) => {
  const classes = [`grid-cols-${mobile}`];
  
  if (tablet) classes.push(`md:grid-cols-${tablet}`);
  if (desktop) classes.push(`lg:grid-cols-${desktop}`);
  if (xl) classes.push(`xl:grid-cols-${xl}`);
  
  return classes.join(' ');
};

/**
 * Responsive text size utilities
 */
export const getResponsiveTextClasses = (
  mobile: string,
  tablet?: string,
  desktop?: string
) => {
  const classes = [mobile];
  
  if (tablet) classes.push(`md:${tablet}`);
  if (desktop) classes.push(`lg:${desktop}`);
  
  return classes.join(' ');
};

/**
 * Responsive spacing utilities
 */
export const getResponsiveSpacingClasses = (
  mobile: string,
  tablet?: string,
  desktop?: string
) => {
  const classes = [mobile];
  
  if (tablet) classes.push(`md:${tablet}`);
  if (desktop) classes.push(`lg:${desktop}`);
  
  return classes.join(' ');
};

/**
 * Mobile-first container classes
 */
export const CONTAINER_CLASSES = {
  full: 'w-full',
  constrained: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8',
  narrow: 'max-w-4xl mx-auto px-4 sm:px-6 lg:px-8',
  wide: 'max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8',
} as const;

/**
 * Mobile-optimized button sizes
 */
export const BUTTON_SIZES = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg',
  // Mobile-optimized sizes (larger touch targets)
  'mobile-sm': 'px-4 py-3 text-sm min-h-[44px]',
  'mobile-md': 'px-6 py-4 text-base min-h-[48px]',
  'mobile-lg': 'px-8 py-5 text-lg min-h-[52px]',
} as const;

/**
 * Responsive modal/dialog positioning
 */
export const getModalClasses = (isMobile: boolean) => {
  if (isMobile) {
    return {
      overlay: 'fixed inset-0 bg-black bg-opacity-50 flex items-end justify-center p-0',
      content: 'bg-white rounded-t-2xl w-full max-h-[90vh] overflow-hidden',
      animation: {
        initial: { y: '100%' },
        animate: { y: 0 },
        exit: { y: '100%' },
      },
    };
  }

  return {
    overlay: 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4',
    content: 'bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden',
    animation: {
      initial: { scale: 0.9, opacity: 0 },
      animate: { scale: 1, opacity: 1 },
      exit: { scale: 0.9, opacity: 0 },
    },
  };
};

/**
 * Performance optimization for mobile
 */
export const useMobilePerformance = () => {
  const { isMobile } = useScreenSize();

  useEffect(() => {
    if (isMobile) {
      // Reduce animation complexity on mobile
      document.documentElement.style.setProperty('--animation-duration', '0.2s');
      
      // Enable hardware acceleration for smoother scrolling
      document.body.style.transform = 'translateZ(0)';
      
      // Optimize touch scrolling
      (document.body.style as any).webkitOverflowScrolling = 'touch';
    } else {
      document.documentElement.style.setProperty('--animation-duration', '0.3s');
    }

    return () => {
      // Cleanup
      document.documentElement.style.removeProperty('--animation-duration');
      document.body.style.transform = '';
      (document.body.style as any).webkitOverflowScrolling = '';
    };
  }, [isMobile]);

  return { isMobile };
};

/**
 * Viewport height fix for mobile browsers
 */
export const useViewportHeight = () => {
  useEffect(() => {
    const setVH = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };

    setVH();
    window.addEventListener('resize', setVH);
    window.addEventListener('orientationchange', setVH);

    return () => {
      window.removeEventListener('resize', setVH);
      window.removeEventListener('orientationchange', setVH);
    };
  }, []);
};