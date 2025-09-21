import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Check if we're in a browser-like environment
const isBrowserEnvironment = typeof window !== 'undefined' && typeof navigator !== 'undefined';

if (isBrowserEnvironment) {
  // Mock IntersectionObserver
  global.IntersectionObserver = class IntersectionObserver {
    constructor() {}
    disconnect() {}
    observe() {}
    unobserve() {}
  };

  // Mock ResizeObserver
  global.ResizeObserver = class ResizeObserver {
    constructor() {}
    disconnect() {}
    observe() {}
    unobserve() {}
  };

  // Mock clipboard API
  Object.assign(navigator, {
    clipboard: {
      writeText: vi.fn(() => Promise.resolve()),
      readText: vi.fn(() => Promise.resolve('')),
    },
  });

  // Mock window.matchMedia
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(), // deprecated
      removeListener: vi.fn(), // deprecated
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
} else {
  // Node environment setup
  const localStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
  };
  global.localStorage = localStorageMock as any;

  // Mock URL for Node environment
  global.URL = {
    createObjectURL: vi.fn(() => 'blob:test-url'),
    revokeObjectURL: vi.fn(),
  } as any;

  // Mock document for Node environment
  global.document = {
    createElement: vi.fn(() => ({
      href: '',
      download: '',
      click: vi.fn(),
    })),
    body: {
      appendChild: vi.fn(),
      removeChild: vi.fn(),
    },
  } as any;
}