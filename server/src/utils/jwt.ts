import jwt, { type SignOptions } from 'jsonwebtoken';
import { env } from '../config/env.js';

const ISSUER = 'layora-api';
const AUDIENCE = 'layora-client';
const ALGORITHM = 'HS256';

export interface AccessTokenPayload {
  sub: string;
  exp: number;
}

export function signAccessToken(userId: string): { token: string; expiresAt: string } {
  const token = jwt.sign({}, env.jwtSecret, {
    algorithm: ALGORITHM,
    subject: userId,
    issuer: ISSUER,
    audience: AUDIENCE,
    expiresIn: env.JWT_EXPIRES_IN as SignOptions['expiresIn'],
  });
  const { exp } = jwt.decode(token) as { exp: number };
  return { token, expiresAt: new Date(exp * 1000).toISOString() };
}

/**
 * Verifies signature, expiry, issuer and audience. The algorithm is pinned so a token
 * signed with `none` or a different algorithm is always rejected.
 */
export function verifyAccessToken(token: string): AccessTokenPayload {
  const payload = jwt.verify(token, env.jwtSecret, {
    algorithms: [ALGORITHM],
    issuer: ISSUER,
    audience: AUDIENCE,
  });
  if (typeof payload === 'string' || !payload.sub || typeof payload.exp !== 'number') {
    throw new jwt.JsonWebTokenError('Malformed token payload');
  }
  return { sub: payload.sub, exp: payload.exp };
}

export const { TokenExpiredError } = jwt;
