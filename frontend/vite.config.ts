import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:3333',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    // Enable code splitting
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks
          vendor: ['react', 'react-dom'],
          ui: ['framer-motion', 'lucide-react'],
          query: ['@tanstack/react-query'],
          router: ['react-router-dom'],
        },
      },
    },
    // Enable source maps for production debugging
    sourcemap: true,
    // Optimize chunk size
    chunkSizeWarningLimit: 1000,
    // Enable minification
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
  },
  // Enable performance optimizations
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'framer-motion',
      '@tanstack/react-query',
      'react-router-dom',
      'lucide-react',
    ],
  },
})