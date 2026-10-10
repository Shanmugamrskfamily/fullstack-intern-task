import { fileURLToPath } from 'node:url';
import compression from 'compression';
import express, { Router } from 'express';
import { env } from './config/env.js';
import { errorHandler, notFound } from './middlewares/error-handler.js';
import { createApiLimiter, passThrough } from './middlewares/rate-limit.js';
import { corsPolicy, requestLogger, securityHeaders } from './middlewares/security.js';
import { getHealth } from './modules/health/health.controller.js';

export interface AppOptions {
  /** Rate limiting is on by default and off in tests unless a test opts in. */
  rateLimits?: boolean;
}

const publicDir = fileURLToPath(new URL('../public', import.meta.url));

/**
 * Builds the Express app without starting a server, so tests can run it in memory
 * with Supertest.
 */
export function createApp({ rateLimits = !env.isTest }: AppOptions = {}) {
  const app = express();

  app.disable('x-powered-by');
  app.set('trust proxy', env.TRUST_PROXY);
  app.set('query parser', 'simple');

  app.use(requestLogger);
  app.use(securityHeaders);
  app.use(corsPolicy);
  app.use(compression());

  // Template thumbnails are embedded by the web client on another origin.
  app.use(
    '/static',
    express.static(publicDir, {
      immutable: true,
      maxAge: '30d',
      index: false,
      setHeaders: (res) => res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin'),
    }),
  );

  app.use(express.json({ limit: '10kb', strict: true }));

  const api = Router();
  api.use(rateLimits ? createApiLimiter() : passThrough);
  api.get('/health', getHealth);
  app.use('/api', api);

  app.get('/', (_req, res) => {
    res.json({
      success: true,
      data: { name: 'Layora API', docs: '/api/docs', health: '/api/health' },
    });
  });

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
