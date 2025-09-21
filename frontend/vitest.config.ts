import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
    environmentMatchGlobs: [
      // Use node environment for API tests with different setup
      ['**/utils/**/*.test.ts', 'node'],
      ['**/services/**/*.test.ts', 'node'],
      // Use jsdom for component tests
      ['**/components/**/*.test.tsx', 'jsdom'],
    ],
  },
});