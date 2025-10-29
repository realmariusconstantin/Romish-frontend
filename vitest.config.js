import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  plugins: [vue()],
  test: {
    // Enable global test APIs (describe, it, expect, etc.)
    globals: true,
    
    // Use jsdom environment for DOM testing
    environment: 'jsdom',
    
    // Setup files to run before each test file
    setupFiles: ['./tests/setup.js'],
    
    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        '*.config.js',
      ],
    },
    
    // Mock CSS imports
    css: true,
    
    // Increase timeout for slower tests
    testTimeout: 10000,
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
});
