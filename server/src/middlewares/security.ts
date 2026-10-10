import { randomUUID } from 'node:crypto';
import cors from 'cors';
import helmet from 'helmet';
import { pinoHttp } from 'pino-http';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

const REQUEST_ID = /^[\w-]{8,64}$/;

/** Structured request logs with a request id that is echoed back as `X-Request-Id`. */
export const requestLogger = pinoHttp({
  logger,
  genReqId(req, res) {
    const incoming = req.headers['x-request-id'];
    const id = typeof incoming === 'string' && REQUEST_ID.test(incoming) ? incoming : randomUUID();
    res.setHeader('X-Request-Id', id);
    return id;
  },
  customLogLevel(_req, res, error) {
    if (error || res.statusCode >= 500) return 'error';
    if (res.statusCode >= 400) return 'warn';
    return 'info';
  },
  autoLogging: { ignore: (req) => req.url === '/api/health' },
  serializers: {
    req: (req: { id: unknown; method: string; url: string }) => ({
      id: req.id,
      method: req.method,
      url: req.url,
    }),
  },
});

/**
 * Strict security headers. The CSP only has to allow Swagger UI's stylesheet and
 * images; the rest of the API returns JSON.
 */
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"],
      objectSrc: ["'none'"],
      frameAncestors: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
    },
  },
  crossOriginResourcePolicy: { policy: 'same-site' },
  referrerPolicy: { policy: 'no-referrer' },
});

const isAllowedOrigin = (origin: string): boolean =>
  env.clientOrigins.includes(origin) || Boolean(env.clientOriginPattern?.test(origin));

/** CORS allowlist. Unknown origins get no CORS headers, so the browser blocks them. */
export const corsPolicy = cors({
  origin(origin, callback) {
    callback(null, !origin || isAllowedOrigin(origin));
  },
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
  exposedHeaders: ['X-Request-Id', 'RateLimit', 'RateLimit-Policy', 'Retry-After'],
  maxAge: 600,
});
