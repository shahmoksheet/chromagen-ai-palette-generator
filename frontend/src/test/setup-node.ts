import { vi } from 'vitest';

// Mock localStorage for Node environment
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