/**
 * Animation utilities for ChromaGen
 * Provides consistent animations across the application
 */

export const animations = {
  // Fade animations
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.3 }
  },

  fadeInUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
    transition: { duration: 0.4, ease: "easeOut" }
  },

  fadeInDown: {
    initial: { opacity: 0, y: -20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 20 },
    transition: { duration: 0.4, ease: "easeOut" }
  },

  // Scale animations
  scaleIn: {
    initial: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.9 },
    transition: { duration: 0.3, ease: "easeOut" }
  },

  // Slide animations
  slideInLeft: {
    initial: { opacity: 0, x: -30 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 30 },
    transition: { duration: 0.4, ease: "easeOut" }
  },

  slideInRight: {
    initial: { opacity: 0, x: 30 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -30 },
    transition: { duration: 0.4, ease: "easeOut" }
  },

  // Color palette specific animations
  colorReveal: {
    initial: { opacity: 0, scale: 0.8, rotateY: -90 },
    animate: { opacity: 1, scale: 1, rotateY: 0 },
    transition: { duration: 0.6, ease: "easeOut" }
  },

  colorHover: {
    scale: 1.05,
    transition: { duration: 0.2, ease: "easeInOut" }
  },

  // Loading animations
  pulse: {
    animate: {
      scale: [1, 1.05, 1],
      opacity: [0.7, 1, 0.7]
    },
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut"
    }
  },

  spin: {
    animate: { rotate: 360 },
    transition: {
      duration: 1,
      repeat: Infinity,
      ease: "linear"
    }
  },

  // Stagger animations for lists
  staggerContainer: {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  },

  staggerItem: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.4, ease: "easeOut" }
  }
};

// Animation presets for common components
export const componentAnimations = {
  modal: {
    overlay: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
      transition: { duration: 0.2 }
    },
    content: {
      initial: { opacity: 0, scale: 0.95, y: 20 },
      animate: { opacity: 1, scale: 1, y: 0 },
      exit: { opacity: 0, scale: 0.95, y: 20 },
      transition: { duration: 0.3, ease: "easeOut" }
    }
  },

  dropdown: {
    initial: { opacity: 0, y: -10, scale: 0.95 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: -10, scale: 0.95 },
    transition: { duration: 0.2, ease: "easeOut" }
  },

  tooltip: {
    initial: { opacity: 0, scale: 0.8 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.8 },
    transition: { duration: 0.15 }
  },

  notification: {
    initial: { opacity: 0, x: 300, scale: 0.9 },
    animate: { opacity: 1, x: 0, scale: 1 },
    exit: { opacity: 0, x: 300, scale: 0.9 },
    transition: { duration: 0.4, ease: "easeOut" }
  }
};

// Easing functions
export const easings = {
  easeInOut: [0.4, 0, 0.2, 1],
  easeOut: [0, 0, 0.2, 1],
  easeIn: [0.4, 0, 1, 1],
  bounce: [0.68, -0.55, 0.265, 1.55]
};

// Duration constants
export const durations = {
  fast: 0.15,
  normal: 0.3,
  slow: 0.5,
  slower: 0.8
};

// Animation utilities
export const createStaggerAnimation = (
  itemAnimation: any,
  staggerDelay: number = 0.1
) => ({
  container: {
    animate: {
      transition: {
        staggerChildren: staggerDelay
      }
    }
  },
  item: itemAnimation
});

export const createHoverAnimation = (
  scale: number = 1.05,
  duration: number = 0.2
) => ({
  whileHover: { scale },
  transition: { duration, ease: "easeInOut" }
});

export const createTapAnimation = (
  scale: number = 0.95,
  duration: number = 0.1
) => ({
  whileTap: { scale },
  transition: { duration }
});

// Color-specific animations
export const colorAnimations = {
  // Smooth color transitions
  colorTransition: {
    transition: { duration: 0.3, ease: "easeInOut" }
  },

  // Color swatch reveal animation
  swatchReveal: (delay: number = 0) => ({
    initial: { opacity: 0, scale: 0.8, rotateY: -90 },
    animate: { opacity: 1, scale: 1, rotateY: 0 },
    transition: { 
      duration: 0.6, 
      ease: "easeOut",
      delay 
    }
  }),

  // Accessibility indicator animation
  accessibilityPulse: {
    animate: {
      scale: [1, 1.1, 1],
      opacity: [0.8, 1, 0.8]
    },
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }
};

// Performance optimized animations
export const performanceAnimations = {
  // Use transform instead of changing layout properties
  slideTransform: {
    initial: { transform: "translateX(-100%)" },
    animate: { transform: "translateX(0%)" },
    exit: { transform: "translateX(100%)" },
    transition: { duration: 0.3, ease: "easeOut" }
  },

  // GPU-accelerated animations
  gpuAccelerated: {
    style: {
      willChange: "transform, opacity"
    }
  }
};

export default animations;