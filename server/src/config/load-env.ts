// Loads `.env` for local development. Imported first by every entry point.
// In production the platform (Render) injects variables, so a missing file is fine.
// Tests never read it: a local .env may point at a real database.
if (process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test') {
  try {
    process.loadEnvFile();
  } catch {
    // No .env file: defaults in env.ts apply.
  }
}

export {};
