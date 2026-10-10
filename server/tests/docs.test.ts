import { describe, expect, it } from 'vitest';
import { openApiDocument } from '../src/docs/openapi.js';
import { SORT_OPTIONS } from '../src/modules/templates/template.schemas.js';
import { anyTemplateId, api, authHeader, registerUser } from './helpers.js';

type Json = Record<string, unknown>;

const HTTP_METHODS = ['get', 'post', 'put', 'patch', 'delete'] as const;

/** Every `METHOD /path` pair the API actually serves under /api (docs routes excluded). */
const API_ROUTES = [
  'GET /health',
  'POST /auth/register',
  'POST /auth/login',
  'GET /auth/me',
  'GET /templates',
  'GET /templates/categories',
  'GET /templates/{id}',
  'GET /favorites',
  'POST /favorites/{templateId}',
  'DELETE /favorites/{templateId}',
];

const PROTECTED_ROUTES = [
  'GET /auth/me',
  'GET /favorites',
  'POST /favorites/{templateId}',
  'DELETE /favorites/{templateId}',
];

interface Operation {
  key: string;
  path: string;
  operation: Json & { responses: Json; security?: unknown[]; parameters?: Json[] };
  pathParameters: Json[];
}

const operations: Operation[] = Object.entries(openApiDocument.paths ?? {}).flatMap(
  ([path, item]) =>
    HTTP_METHODS.filter((method) => item?.[method]).map((method) => ({
      key: `${method.toUpperCase()} ${path}`,
      path,
      operation: item![method] as unknown as Operation['operation'],
      pathParameters: (item?.parameters ?? []) as Json[],
    })),
);

/** Resolves a local JSON pointer such as `#/components/schemas/User`. */
const resolveRef = (ref: string): unknown =>
  ref
    .replace(/^#\//, '')
    .split('/')
    .reduce<unknown>((node, key) => (node as Json | undefined)?.[key], openApiDocument);

/** Every `$ref` value anywhere in the document. */
function collectRefs(node: unknown, refs: string[] = []): string[] {
  if (Array.isArray(node)) node.forEach((child) => collectRefs(child, refs));
  else if (node && typeof node === 'object') {
    for (const [key, value] of Object.entries(node)) {
      if (key === '$ref' && typeof value === 'string') refs.push(value);
      else collectRefs(value, refs);
    }
  }
  return refs;
}

const schema = (name: string) => openApiDocument.components?.schemas?.[name] as Json;
const requiredOf = (name: string) => [...(schema(name).required as string[])].sort();

describe('GET /api/openapi.json', () => {
  it('serves the OpenAPI 3.1 document', async () => {
    const res = await api().get('/api/openapi.json').expect(200);

    expect(res.headers['content-type']).toMatch(/application\/json/);
    expect(res.body.openapi).toMatch(/^3\.1\./);
    expect(res.body.info).toMatchObject({ title: 'Layora API', version: '1.0.0' });
    expect(res.body.servers).toEqual([{ url: '/api', description: 'This server' }]);
    expect(res.body).toEqual(JSON.parse(JSON.stringify(openApiDocument)));
  });
});

describe('Swagger UI at /api/docs', () => {
  it('redirects /api/docs to /api/docs/ so relative asset URLs resolve', async () => {
    const res = await api().get('/api/docs').expect(301);
    expect(res.headers.location).toBe('/api/docs/');
  });

  it('serves the Swagger UI page', async () => {
    const res = await api().get('/api/docs/').expect(200);

    expect(res.headers['content-type']).toMatch(/text\/html/);
    expect(res.text).toContain('<title>Layora API docs</title>');
    expect(res.text).toContain('<div id="swagger-ui"></div>');
  });

  it("loads only same-origin scripts, so the API's strict CSP still applies", async () => {
    const res = await api().get('/api/docs/').expect(200);

    const scripts = [...res.text.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)];
    expect(scripts.length).toBeGreaterThan(0);
    for (const [, attributes, body] of scripts) {
      expect(attributes).toMatch(/src=["']\.\/[\w.-]+\.js["']/);
      expect(body?.trim()).toBe('');
    }
    expect(res.headers['content-security-policy']).toContain("script-src 'self'");
  });

  it('serves the UI assets and an init script that embeds the document', async () => {
    const bundle = await api().get('/api/docs/swagger-ui-bundle.js').expect(200);
    expect(bundle.headers['content-type']).toMatch(/javascript/);

    const init = await api().get('/api/docs/swagger-ui-init.js').expect(200);
    expect(init.headers['content-type']).toMatch(/javascript/);
    expect(init.text).toContain('"title": "Layora API"');
    expect(init.text).toContain('"persistAuthorization": true');
  });

  it('does not expose the package metadata of the UI bundle', async () => {
    await api().get('/api/docs/package.json').expect(404);
  });
});

describe('OpenAPI document', () => {
  it('documents every API route, and nothing else', () => {
    expect(operations.map((op) => op.key).sort()).toEqual([...API_ROUTES].sort());
  });

  it('gives every operation a unique operationId, a summary and a tag', () => {
    const ids = operations.map(({ operation }) => operation.operationId);

    expect(new Set(ids).size).toBe(operations.length);
    for (const { operation } of operations) {
      expect(operation.summary).toEqual(expect.any(String));
      expect(operation.tags).toHaveLength(1);
    }
  });

  it('documents a success response, rate limiting and server errors for every operation', () => {
    for (const { key, operation } of operations) {
      const codes = Object.keys(operation.responses);
      expect(
        codes.some((code) => code.startsWith('2')),
        `${key} has no 2xx response`,
      ).toBe(true);
      expect(codes, key).toEqual(expect.arrayContaining(['429', '500']));
    }
  });

  it('marks exactly the protected routes as needing a bearer token, with a 401', () => {
    for (const { key, operation } of operations) {
      const isProtected = PROTECTED_ROUTES.includes(key);
      expect(operation.security, key).toEqual(isProtected ? [{ bearerAuth: [] }] : undefined);
      expect(Object.keys(operation.responses).includes('401'), key).toBe(
        isProtected || key === 'POST /auth/login',
      );
    }
    expect(openApiDocument.components?.securitySchemes?.bearerAuth).toMatchObject({
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
    });
  });

  it('declares every path parameter used in a path template', () => {
    for (const { key, path, operation, pathParameters } of operations) {
      const declared = [...pathParameters, ...(operation.parameters ?? [])]
        .map((p) => ('$ref' in p ? resolveRef(p.$ref as string) : p) as Json)
        .filter((p) => p.in === 'path')
        .map((p) => p.name);
      const inTemplate = [...path.matchAll(/\{(\w+)\}/g)].map((match) => match[1]);

      expect(declared, key).toEqual(inTemplate);
    }
  });

  it('only contains references that resolve', () => {
    const refs = collectRefs(openApiDocument);

    expect(refs.length).toBeGreaterThan(0);
    for (const ref of refs) expect(resolveRef(ref), ref).toBeDefined();
  });

  it('offers exactly the sort orders the API accepts', async () => {
    const sort = openApiDocument.components?.parameters?.Sort as { schema: { enum: string[] } };
    expect(sort.schema.enum).toEqual([...SORT_OPTIONS]);

    for (const value of sort.schema.enum) {
      await api().get(`/api/templates?sort=${value}`).expect(200);
    }
  });
});

describe('OpenAPI schemas match real responses', () => {
  it('Template lists exactly the fields a template has', async () => {
    const res = await api().get('/api/templates?limit=1').expect(200);

    expect(Object.keys(res.body.data[0]).sort()).toEqual(requiredOf('Template'));
    expect(Object.keys(res.body.meta).sort()).toEqual(requiredOf('PaginationMeta'));
  });

  it('Category lists exactly the fields and slugs of the categories endpoint', async () => {
    const res = await api().get('/api/templates/categories').expect(200);

    expect(Object.keys(res.body.data[0]).sort()).toEqual(requiredOf('Category'));
    expect(res.body.data.map((c: { slug: string }) => c.slug)).toEqual(schema('CategorySlug').enum);
  });

  it('Session and User list exactly the fields of a sign-up response', async () => {
    const res = await api()
      .post('/api/auth/register')
      .send({ name: 'Docs Check', email: 'docs-check@example.com', password: 'Layora@2026' })
      .expect(201);

    expect(Object.keys(res.body.data).sort()).toEqual(requiredOf('Session'));
    expect(Object.keys(res.body.data.user).sort()).toEqual(requiredOf('User'));
  });

  it('FavoriteTemplate adds favorited_at to a template', async () => {
    const { token } = await registerUser();
    const res = await api()
      .post(`/api/favorites/${await anyTemplateId()}`)
      .set(authHeader(token))
      .expect(201);

    const [, extra] = schema('FavoriteTemplate').allOf as [unknown, { required: string[] }];
    expect(Object.keys(res.body.data).sort()).toEqual(
      [...requiredOf('Template'), ...extra.required].sort(),
    );
  });

  it('Error lists every error code the API returns', async () => {
    const { token } = await registerUser({ email: 'taken@example.com' });
    const errors = await Promise.all([
      api().get('/api/templates?sort=price'),
      api().get('/api/templates/0123456789abcdef01234567'),
      api().get('/api/favorites'),
      api()
        .get('/api/favorites')
        .set(authHeader(`${token}x`)),
      api().post('/api/auth/login').send({ email: 'taken@example.com', password: 'Nope-1234' }),
      api()
        .post('/api/auth/register')
        .send({ name: 'Taken', email: 'taken@example.com', password: 'Layora@2026' }),
      api().post('/api/auth/login').set('Content-Type', 'application/json').send('{'),
    ]);

    const codes = (
      (schema('Error').properties as Json).error as { properties: { code: { enum: string[] } } }
    ).properties.code.enum;
    for (const res of errors) {
      expect(res.body.success).toBe(false);
      expect(codes).toContain(res.body.error.code);
    }
  });
});
