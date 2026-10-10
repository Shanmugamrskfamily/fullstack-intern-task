import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
    // The first run downloads a MongoDB binary for the in-memory server.
    hookTimeout: 180_000,
    testTimeout: 30_000,
    pool: 'forks',
  },
});
