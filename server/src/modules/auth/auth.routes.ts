import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate.js';
import { createAuthLimiter, passThrough } from '../../middlewares/rate-limit.js';
import { validate } from '../../middlewares/validate.js';
import { login, me, register } from './auth.controller.js';
import { loginSchema, registerSchema } from './auth.schemas.js';

export function createAuthRouter({ rateLimits }: { rateLimits: boolean }) {
  const router = Router();
  const bruteForceGuard = rateLimits ? createAuthLimiter() : passThrough;

  router.post('/register', bruteForceGuard, validate({ body: registerSchema }), register);
  router.post('/login', bruteForceGuard, validate({ body: loginSchema }), login);
  router.get('/me', authenticate, me);

  return router;
}
