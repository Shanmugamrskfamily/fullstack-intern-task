import type { RequestHandler } from 'express';
import { isDatabaseConnected } from '../../config/db.js';

const startedAt = Date.now();

/** Liveness + readiness in one: 503 when the database is unreachable. */
export const getHealth: RequestHandler = (_req, res) => {
  const database = isDatabaseConnected() ? 'up' : 'down';
  res
    .status(database === 'up' ? 200 : 503)
    .set('Cache-Control', 'no-store')
    .json({
      success: database === 'up',
      data: {
        status: database === 'up' ? 'ok' : 'degraded',
        database,
        uptime_seconds: Math.round((Date.now() - startedAt) / 1000),
        timestamp: new Date().toISOString(),
      },
    });
};
