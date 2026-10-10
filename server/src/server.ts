import './config/load-env.js';
import { createApp } from './app.js';
import { connectDatabase, disconnectDatabase } from './config/db.js';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';

async function main() {
  await connectDatabase();

  const app = createApp();
  const server = app.listen(env.PORT, () => {
    logger.info(`Layora API ready on http://localhost:${env.PORT} (${env.NODE_ENV})`);
  });

  // Render sends SIGTERM on deploys: finish in-flight requests, then close the DB pool.
  const shutdown = (signal: NodeJS.Signals) => {
    logger.info({ signal }, 'Shutting down gracefully');
    server.close(async () => {
      await disconnectDatabase();
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10_000).unref();
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

process.on('unhandledRejection', (reason) => {
  logger.error({ err: reason }, 'Unhandled promise rejection');
});

main().catch((error: unknown) => {
  logger.fatal({ err: error }, 'API failed to start');
  process.exit(1);
});
