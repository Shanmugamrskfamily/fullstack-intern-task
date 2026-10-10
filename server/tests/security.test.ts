import jwt from 'jsonwebtoken';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { env } from '../src/config/env.js';
import { UserModel } from '../src/modules/users/user.model.js';
import { SEED_TEMPLATES } from '../src/seed/templates.data.js';
import {
  MISSING_ID,
  anyTemplateId,
  api,
  authHeader,
  newUser,
  registerUser,
  uniqueEmail,
} from './helpers.js';

const UUID = /^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/;

/** Signs a token the way the API does, with optional overrides. */
const signToken = (
  subject: string,
  options: jwt.SignOptions = {},
  secret: string = env.jwtSecret,
) =>
  jwt.sign({}, secret, {
    algorithm: 'HS256',
    subject,
    issuer: 'layora-api',
    audience: 'layora-client',
    expiresIn: '1h',
    ...options,
  });

const base64url = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url');

/** Replaces the character at `index` with a different base64url character. */
const flipCharAt = (value: string, index: number) =>
  `${value.slice(0, index)}${value[index] === 'A' ? 'B' : 'A'}${value.slice(index + 1)}`;

const meWith = (authorization: string) =>
  api().get('/api/auth/me').set('Authorization', authorization);

describe('session tokens (JWT)', () => {
  it('accepts a token signed by the API', async () => {
    const { user } = await registerUser();
    await meWith(`Bearer ${signToken(user.id)}`).expect(200);
  });

  it('rejects a token with one character changed in its signature', async () => {
    const { token } = await registerUser();
    const signatureStart = token.lastIndexOf('.') + 1;

    const res = await meWith(`Bearer ${flipCharAt(token, signatureStart + 5)}`).expect(401);

    expect(res.body.error).toMatchObject({
      code: 'INVALID_TOKEN',
      message: 'Your session is not valid. Please sign in again.',
    });
  });

  it('rejects a token whose payload was edited to impersonate another user', async () => {
    const [alice, bob] = await Promise.all([registerUser(), registerUser()]);
    const [header, , signature] = alice.token.split('.');
    const payload = jwt.decode(alice.token) as jwt.JwtPayload;
    const forged = `${header}.${base64url({ ...payload, sub: bob.user.id })}.${signature}`;

    const res = await meWith(`Bearer ${forged}`).expect(401);

    expect(res.body.error.code).toBe('INVALID_TOKEN');
  });

  it('rejects a token signed with another secret', async () => {
    const { user } = await registerUser();
    const token = signToken(user.id, {}, 'not-the-server-secret-but-long-enough-to-pass');

    const res = await meWith(`Bearer ${token}`).expect(401);

    expect(res.body.error.code).toBe('INVALID_TOKEN');
  });

  it('answers 401 TOKEN_EXPIRED for an expired token', async () => {
    const { user } = await registerUser();
    const token = signToken(user.id, { expiresIn: -10 });

    const res = await meWith(`Bearer ${token}`).expect(401);

    expect(res.body.error).toMatchObject({
      code: 'TOKEN_EXPIRED',
      message: 'Your session has expired. Please sign in again.',
    });
  });

  it('rejects an unsigned token (alg "none")', async () => {
    const { user } = await registerUser();
    const now = Math.floor(Date.now() / 1000);
    const unsigned = `${base64url({ alg: 'none', typ: 'JWT' })}.${base64url({
      sub: user.id,
      iss: 'layora-api',
      aud: 'layora-client',
      iat: now,
      exp: now + 3600,
    })}.`;

    const res = await meWith(`Bearer ${unsigned}`).expect(401);

    expect(res.body.error.code).toBe('INVALID_TOKEN');
  });

  it.each([
    ['another algorithm (HS512)', { algorithm: 'HS512' }],
    ['another issuer', { issuer: 'someone-else' }],
    ['another audience', { audience: 'another-app' }],
  ] as const)('rejects a token with %s, even with the right secret', async (_label, options) => {
    const { user } = await registerUser();

    const res = await meWith(`Bearer ${signToken(user.id, options)}`).expect(401);

    expect(res.body.error.code).toBe('INVALID_TOKEN');
  });

  it('rejects a valid signature over a subject that is not a user id', async () => {
    const res = await meWith(`Bearer ${signToken('admin')}`).expect(401);
    expect(res.body.error.code).toBe('INVALID_TOKEN');
  });

  it.each([
    ['another scheme', 'Basic dXNlcjpwYXNz'],
    ['a missing token', 'Bearer'],
    ['extra parts', 'Bearer abc def'],
    ['garbage', 'Bearer not.a.jwt'],
    ['an oversized token', `Bearer ${'a'.repeat(2049)}`],
  ])('rejects an Authorization header with %s', async (_label, header) => {
    const res = await meWith(header).expect(401);
    expect(res.body.error.code).toBe('INVALID_TOKEN');
  });
});

describe('sensitive data', () => {
  const containsPassword = (body: unknown, plain: string) => {
    const json = JSON.stringify(body);
    return /password/i.test(json) || json.includes(plain);
  };

  it('never returns the password or its hash, from any endpoint', async () => {
    const body = newUser({ password: 'Very-Secret-42' });
    const registered = await api().post('/api/auth/register').send(body).expect(201);
    const { token } = registered.body.data;
    const loggedIn = await api()
      .post('/api/auth/login')
      .send({ email: body.email, password: body.password })
      .expect(200);
    const me = await api().get('/api/auth/me').set(authHeader(token)).expect(200);
    await api()
      .post(`/api/favorites/${await anyTemplateId()}`)
      .set(authHeader(token))
      .expect(201);
    const favorites = await api().get('/api/favorites').set(authHeader(token)).expect(200);

    for (const res of [registered, loggedIn, me, favorites]) {
      expect(containsPassword(res.body, body.password)).toBe(false);
    }
  });

  it('keeps the password hash out of the token payload', async () => {
    const { token, user } = await registerUser();

    const payload = jwt.decode(token) as jwt.JwtPayload;

    expect(Object.keys(payload).sort()).toEqual(['aud', 'exp', 'iat', 'iss', 'sub']);
    expect(payload.sub).toBe(user.id);
  });
});

describe('injection and mass assignment', () => {
  it('rejects a MongoDB operator object as the login email', async () => {
    await registerUser();

    const res = await api()
      .post('/api/auth/login')
      .send({ email: { $gt: '' }, password: 'anything' })
      .expect(400);

    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details[0].field).toBe('email');
  });

  it('rejects a MongoDB operator object as the login password', async () => {
    const { user } = await registerUser();

    const res = await api()
      .post('/api/auth/login')
      .send({ email: user.email, password: { $ne: null } })
      .expect(400);

    expect(res.body.error.details[0].field).toBe('password');
  });

  it.each(['search[$ne]=x', 'category[$regex]=.*', 'sort[$gt]=a', 'search=a&search=b'])(
    'does not build objects or arrays from the query string (%s)',
    async (query) => {
      const res = await api().get(`/api/templates?${query}`).expect(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    },
  );

  it('rejects an operator in place of a template id', async () => {
    await api()
      .get(`/api/templates/${encodeURIComponent('{"$ne":null}')}`)
      .expect(400);
  });

  it.each([
    ['_id', MISSING_ID],
    ['password_hash', '$2b$12$abcdefghijklmnopqrstuuvwxyz0123456789ABCDEFGHIJKLMN'],
    ['created_at', '2000-01-01T00:00:00.000Z'],
    ['isAdmin', true],
  ])('refuses to let a sign-up set the internal field %s', async (field, value) => {
    const body = { ...newUser(), [field]: value };

    const res = await api().post('/api/auth/register').send(body).expect(400);

    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(await UserModel.countDocuments({ email: body.email })).toBe(0);
  });

  it('is not affected by prototype pollution attempts in JSON bodies', async () => {
    const body = newUser();
    const raw = `{"__proto__":{"polluted":true},"name":"${body.name}","email":"${body.email}","password":"${body.password}"}`;

    const res = await api()
      .post('/api/auth/register')
      .set('Content-Type', 'application/json')
      .send(raw);

    expect(res.status).toBe(400);
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
  });
});

describe('request bodies', () => {
  it('answers 400 INVALID_JSON for malformed JSON', async () => {
    const res = await api()
      .post('/api/auth/login')
      .set('Content-Type', 'application/json')
      .send('{"email": "demo@example.com", "password": ')
      .expect(400);

    expect(res.body).toMatchObject({
      success: false,
      error: { code: 'INVALID_JSON', message: 'The request body must be valid JSON' },
    });
  });

  it('only accepts objects and arrays as JSON bodies', async () => {
    const res = await api()
      .post('/api/auth/login')
      .set('Content-Type', 'application/json')
      .send('"just a string"')
      .expect(400);

    expect(res.body.error.code).toBe('INVALID_JSON');
  });

  it('answers 413 PAYLOAD_TOO_LARGE for bodies over 10kb', async () => {
    const res = await api()
      .post('/api/auth/register')
      .send({ ...newUser(), name: 'A'.repeat(11 * 1024) })
      .expect(413);

    expect(res.body.error).toMatchObject({
      code: 'PAYLOAD_TOO_LARGE',
      message: 'The request body is too large',
    });
  });

  it('ignores bodies that are not JSON', async () => {
    const res = await api()
      .post('/api/auth/login')
      .set('Content-Type', 'text/plain')
      .send(`email=${uniqueEmail()}&password=x`)
      .expect(400);

    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});

describe('HTTP hardening', () => {
  it('sends strict security headers and hides the framework', async () => {
    const res = await api().get('/api/templates').expect(200);

    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['referrer-policy']).toBe('no-referrer');
    expect(res.headers['strict-transport-security']).toMatch(/max-age=\d+/);
    expect(res.headers['cross-origin-resource-policy']).toBe('same-site');
    expect(res.headers['content-security-policy']).toContain("default-src 'self'");
    expect(res.headers['content-security-policy']).toContain("frame-ancestors 'none'");
    expect(res.headers['x-powered-by']).toBeUndefined();
  });

  it('answers unknown routes with a JSON 404', async () => {
    const res = await api().get('/api/does-not-exist').expect(404);

    expect(res.headers['content-type']).toMatch(/application\/json/);
    expect(res.body).toEqual({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'This route does not exist',
        requestId: expect.any(String),
      },
    });
  });

  it('answers unsupported methods with a JSON 404', async () => {
    const res = await api().put('/api/templates').send({}).expect(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });
});

describe('request ids', () => {
  it('tags every response with a generated X-Request-Id', async () => {
    const res = await api().get('/api/health').expect(200);
    expect(res.headers['x-request-id']).toMatch(UUID);
  });

  it('echoes a well-formed incoming X-Request-Id for tracing across services', async () => {
    const res = await api()
      .get('/api/health')
      .set('X-Request-Id', 'client-trace-12345')
      .expect(200);

    expect(res.headers['x-request-id']).toBe('client-trace-12345');
  });

  it('replaces a malformed incoming X-Request-Id', async () => {
    const res = await api().get('/api/health').set('X-Request-Id', 'bad id <script>').expect(200);

    expect(res.headers['x-request-id']).toMatch(UUID);
  });

  it('includes the request id in error bodies', async () => {
    const res = await api().get(`/api/templates/${MISSING_ID}`).expect(404);
    expect(res.body.error.requestId).toBe(res.headers['x-request-id']);
  });
});

describe('CORS', () => {
  const ALLOWED = 'http://localhost:5173';
  const BLOCKED = 'https://evil.example';

  it('allows the web client origin and exposes the request id header', async () => {
    const res = await api().get('/api/templates').set('Origin', ALLOWED).expect(200);

    expect(res.headers['access-control-allow-origin']).toBe(ALLOWED);
    expect(res.headers['access-control-expose-headers']).toContain('X-Request-Id');
    expect(res.headers.vary).toMatch(/origin/i);
  });

  it('sends no CORS headers to other origins, so browsers block them', async () => {
    const res = await api().get('/api/templates').set('Origin', BLOCKED);

    expect(res.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('answers preflight requests for authenticated calls from the web client', async () => {
    const res = await api()
      .options(`/api/favorites/${MISSING_ID}`)
      .set('Origin', ALLOWED)
      .set('Access-Control-Request-Method', 'DELETE')
      .set('Access-Control-Request-Headers', 'authorization,content-type')
      .expect(204);

    expect(res.headers['access-control-allow-origin']).toBe(ALLOWED);
    expect(res.headers['access-control-allow-methods']).toContain('DELETE');
    expect(res.headers['access-control-allow-headers']).toContain('Authorization');
    expect(res.headers['access-control-max-age']).toBe('600');
  });

  it('does not approve preflight requests from other origins', async () => {
    const res = await api()
      .options('/api/favorites')
      .set('Origin', BLOCKED)
      .set('Access-Control-Request-Method', 'GET');

    expect(res.headers['access-control-allow-origin']).toBeUndefined();
  });
});

describe('static thumbnails', () => {
  it('serves SVG thumbnails that other origins may embed, cached for 30 days', async () => {
    const res = await api().get('/static/thumbnails/nimbus-saas-landing.svg').expect(200);

    expect(res.headers['content-type']).toMatch(/^image\/svg\+xml/);
    expect(res.headers['cross-origin-resource-policy']).toBe('cross-origin');
    expect(res.headers['cache-control']).toBe('public, max-age=2592000, immutable');
  });

  it('has a thumbnail for every seeded template', async () => {
    const statuses = await Promise.all(
      SEED_TEMPLATES.map(async ({ slug }) => {
        const res = await api().head(`/static/thumbnails/${slug}.svg`);
        return [slug, res.status];
      }),
    );

    expect(statuses).toEqual(SEED_TEMPLATES.map(({ slug }) => [slug, 200]));
  });

  it('answers 404 JSON for a missing file and does not list directories', async () => {
    const missing = await api().get('/static/thumbnails/missing.svg').expect(404);
    expect(missing.body.error.code).toBe('NOT_FOUND');

    await api().get('/static/thumbnails/').expect(404);
  });

  it('never serves files outside the public folder', async () => {
    const res = await api().get('/static/..%2fpackage.json');

    expect([403, 404]).toContain(res.status);
    expect(res.text).not.toContain('layora-api');
  });
});

describe('rate limiting', () => {
  it('blocks login after 10 failed attempts with 429 TOO_MANY_REQUESTS', async () => {
    const limitedApp = createApp({ rateLimits: true });
    const { user, password } = await registerUser();
    const attempt = (pass: string) =>
      request(limitedApp).post('/api/auth/login').send({ email: user.email, password: pass });

    for (let i = 1; i <= 10; i += 1) {
      const res = await attempt(`Wrong-Password-${i}`);
      expect(res.status).toBe(401);
    }

    const blocked = await attempt('Wrong-Password-11');
    expect(blocked.status).toBe(429);
    expect(blocked.body.error.code).toBe('TOO_MANY_REQUESTS');
    expect(blocked.headers['retry-after']).toBe('900');

    // Even the right password is refused until the window resets.
    expect((await attempt(password)).status).toBe(429);
  });

  it('does not count successful sign-ins towards the limit', async () => {
    const limitedApp = createApp({ rateLimits: true });
    const { user, password } = await registerUser();

    for (let i = 1; i <= 12; i += 1) {
      const res = await request(limitedApp)
        .post('/api/auth/login')
        .send({ email: user.email, password });
      expect(res.status).toBe(200);
    }
  });

  it('advertises the limits with standard RateLimit headers', async () => {
    const limitedApp = createApp({ rateLimits: true });

    const res = await request(limitedApp).get('/api/templates').expect(200);

    expect(res.headers['ratelimit-policy']).toBeDefined();
    expect(res.headers.ratelimit).toBeDefined();
  });

  it('is off by default in tests, so suites are not throttled', async () => {
    const res = await api().get('/api/templates').expect(200);
    expect(res.headers['ratelimit-policy']).toBeUndefined();
  });
});
