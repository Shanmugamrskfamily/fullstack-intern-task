// Loads `.env` for local development. Imported first by every entry point.
// In production the platform (Render) injects variables, so a missing file is fine.
if (process.env.NODE_ENV !== 'production') {
  try {
    process.loadEnvFile();
  } catch {
    // No .env file: defaults in env.ts apply.
  }
}

export {};
