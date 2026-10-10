import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
    // The first run downloads a MongoDB binary for the in-memory server.
    hookTimeout: 180_000,
    testTimeout: 30_000,
    pool: 'forks',
    // Tests always run against a throwaway in-memory MongoDB, never a real database,
    // even when the shell or CI exports MONGODB_URI. CORS tests rely on these origins.
    env: {
      NODE_ENV: 'test',
      MONGODB_URI: '',
      CLIENT_ORIGINS: 'http://localhost:5173,http://127.0.0.1:5173',
      CLIENT_ORIGIN_PATTERN: '',
    },
  },
});
