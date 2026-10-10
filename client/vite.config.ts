/// <reference types="vitest/config" />
import { fileURLToPath } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// Used in index.html for absolute Open Graph URLs; overridden per environment (Vercel sets it).
process.env.VITE_SITE_URL ??= 'http://localhost:5173';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  server: {
    port: 5173,
    // In development the API runs on :5000; proxying keeps requests same-origin.
    proxy: { '/api': 'http://localhost:5000', '/static': 'http://localhost:5000' },
  },
  build: {
    target: 'es2022',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (/node_modules.(react|react-dom|react-router|scheduler)./.test(id)) return 'react';
          if (/@tanstack|axios/.test(id)) return 'data';
          if (/radix-ui|@radix-ui|sonner|lucide-react/.test(id)) return 'ui';
          return undefined;
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    css: false,
    restoreMocks: true,
  },
});
