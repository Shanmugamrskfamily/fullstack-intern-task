import type { RequestHandler } from 'express';
import { rateLimit } from 'express-rate-limit';
import { ApiError } from '../utils/api-error.js';

const FIFTEEN_MINUTES = 15 * 60 * 1000;

const rejectWith429: RequestHandler = (_req, _res, next) => next(ApiError.tooManyRequests());

/** Broad limit for the whole API: generous for real users, stops floods. */
export const createApiLimiter = () =>
  rateLimit({
    windowMs: FIFTEEN_MINUTES,
    limit: 300,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    handler: rejectWith429,
  });

/**
 * Brute-force protection for login and register. Only failed attempts count,
 * so a user who signs in successfully is never locked out by it.
 */
export const createAuthLimiter = () =>
  rateLimit({
    windowMs: FIFTEEN_MINUTES,
    limit: 10,
    skipSuccessfulRequests: true,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    handler: rejectWith429,
  });

export const passThrough: RequestHandler = (_req, _res, next) => next();
