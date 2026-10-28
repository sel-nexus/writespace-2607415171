import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    include: ['src/**/*.{test,spec}.{js,jsx}'],
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/setupTests.js'],
    clearMocks: true,
    restoreMocks: true,
  },
});
