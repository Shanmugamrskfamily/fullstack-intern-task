import mongoose from 'mongoose';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { api } from './helpers.js';

describe('GET /api/health', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('reports the API and database as up', async () => {
    const res = await api().get('/api/health').expect(200);

    expect(res.body).toEqual({
      success: true,
      data: {
        status: 'ok',
        database: 'up',
        uptime_seconds: expect.any(Number),
        timestamp: expect.any(String),
      },
    });
    expect(res.body.data.uptime_seconds).toBeGreaterThanOrEqual(0);
    expect(new Date(res.body.data.timestamp).toISOString()).toBe(res.body.data.timestamp);
  });

  it('is never cached, so uptime monitors always see the live state', async () => {
    const res = await api().get('/api/health').expect(200);
    expect(res.headers['cache-control']).toBe('no-store');
  });

  it('answers 503 "degraded" when the database is unreachable', async () => {
    vi.spyOn(mongoose.connection, 'readyState', 'get').mockReturnValue(
      mongoose.ConnectionStates.disconnected,
    );

    const res = await api().get('/api/health').expect(503);

    expect(res.body.success).toBe(false);
    expect(res.body.data).toMatchObject({ status: 'degraded', database: 'down' });
  });
});

describe('GET /', () => {
  it('describes the API and links to the docs and health check', async () => {
    const res = await api().get('/').expect(200);

    expect(res.body).toEqual({
      success: true,
      data: { name: 'Layora API', docs: '/api/docs', health: '/api/health' },
    });
  });
});
