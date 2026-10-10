import type { OpenAPIV3_1 } from 'openapi-types';
import { CATEGORIES } from '../modules/templates/categories.js';
import { SORT_OPTIONS } from '../modules/templates/template.schemas.js';
import { DEMO_USER } from '../seed/seed.js';
import { SEED_TEMPLATES } from '../seed/templates.data.js';

/**
 * OpenAPI 3.1 description of the Layora API, served as JSON at `/api/openapi.json` and
 * rendered by Swagger UI at `/api/docs`. Enums and examples come from the same constants
 * and seed data the API uses, so the document cannot drift from the code on those points.
 */

type Schema = OpenAPIV3_1.SchemaObject;
type Reference = OpenAPIV3_1.ReferenceObject;
type Responses = OpenAPIV3_1.ResponsesObject;

const schemaRef = (name: string): Reference => ({ $ref: `#/components/schemas/${name}` });
const responseRef = (name: string): Reference => ({ $ref: `#/components/responses/${name}` });
const parameterRef = (name: string): Reference => ({ $ref: `#/components/parameters/${name}` });

const BEARER_AUTH = [{ bearerAuth: [] }];

/**
 * Every route sits behind the API-wide rate limiter and can fail unexpectedly.
 * Generic so each operation keeps its literal type: openapi-types checks 3.1 operations
 * against its 3.0 types as well, which a widened `ResponsesObject` would not satisfy.
 */
const withCommonErrors = <T extends Responses>(responses: T) => ({
  ...responses,
  '429': responseRef('TooManyRequests'),
  '500': responseRef('InternalError'),
});

/** The success envelope: `{ success: true, data, ...extra }`. */
const successEnvelope = (data: Schema | Reference, extra: Record<string, Schema> = {}): Schema => ({
  type: 'object',
  required: ['success', 'data', ...Object.keys(extra)],
  properties: { success: { type: 'boolean', const: true }, data, ...extra },
});

const message = (example: string): Schema => ({ type: 'string', examples: [example] });

const errorBody = (
  code: string,
  text: string,
  details?: Array<{ field: string; message: string }>,
) => ({
  success: false,
  error: {
    code,
    message: text,
    ...(details ? { details } : {}),
    requestId: '3f6c1e2a-8b4d-4c7e-9a1f-2d5b6e7c8a90',
  },
});

/* ------------------------------------------------------------------------------------ */
/* Examples                                                                              */
/* ------------------------------------------------------------------------------------ */

const sample = SEED_TEMPLATES.find((t) => t.slug === 'nimbus-saas-landing') ?? SEED_TEMPLATES[0]!;
const sampleCategory = CATEGORIES.find((c) => c.label === sample.category)!;

const templateExample = {
  id: '6706b1f4c2a8e93d5f1a7b11',
  name: sample.name,
  slug: sample.slug,
  description: sample.description,
  thumbnail_url: `http://localhost:5000/static/thumbnails/${sample.slug}.svg`,
  category: sample.category,
  category_slug: sampleCategory.slug,
  features: sample.features,
  pages: sample.pages,
  favorites_count: 12,
  created_at: `${sample.added}T09:00:00.000Z`,
};

const favoriteExample = { ...templateExample, favorited_at: '2026-10-14T10:24:51.000Z' };

const userExample = {
  id: '6706b1f4c2a8e93d5f1a7c20',
  name: DEMO_USER.name,
  email: DEMO_USER.email,
  created_at: '2026-10-09T08:30:00.000Z',
};

const sessionExample = {
  user: userExample,
  token:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3OTE5NjQ4MDAsImV4cCI6MTc5MjA1MTIwMCwiYXVkIjoibGF5b3JhLWNsaWVudCIsImlzcyI6ImxheW9yYS1hcGkiLCJzdWIiOiI2NzA2YjFmNGMyYThlOTNkNWYxYTdjMjAifQ.VbSCqgusqNYenhkaeBNvHpky8w8ZNlHC8t0gSnWJQRk',
  expires_at: '2026-10-15T08:00:00.000Z',
};

/* ------------------------------------------------------------------------------------ */
/* Schemas                                                                               */
/* ------------------------------------------------------------------------------------ */

const ERROR_CODES = [
  'VALIDATION_ERROR',
  'BAD_REQUEST',
  'INVALID_JSON',
  'UNAUTHORIZED',
  'INVALID_TOKEN',
  'TOKEN_EXPIRED',
  'INVALID_CREDENTIALS',
  'NOT_FOUND',
  'CONFLICT',
  'PAYLOAD_TOO_LARGE',
  'TOO_MANY_REQUESTS',
  'INTERNAL_ERROR',
] as const;

const schemas: Record<string, Schema> = {
  ObjectId: {
    type: 'string',
    pattern: '^[a-f\\d]{24}$',
    description: 'A MongoDB ObjectId: 24 hexadecimal characters.',
    examples: [templateExample.id],
  },
  User: {
    type: 'object',
    description: 'The public profile of an account. The password hash is never returned.',
    required: ['id', 'name', 'email', 'created_at'],
    properties: {
      id: schemaRef('ObjectId'),
      name: { type: 'string', examples: [userExample.name] },
      email: { type: 'string', format: 'email', examples: [userExample.email] },
      created_at: { type: 'string', format: 'date-time' },
    },
    examples: [userExample],
  },
  Session: {
    type: 'object',
    description: 'Returned by sign-up and sign-in.',
    required: ['user', 'token', 'expires_at'],
    properties: {
      user: schemaRef('User'),
      token: {
        type: 'string',
        description:
          'JWT (HS256, issuer `layora-api`, audience `layora-client`). Send it as `Authorization: Bearer <token>`.',
      },
      expires_at: {
        type: 'string',
        format: 'date-time',
        description: 'When the token expires (1 day after issue by default).',
      },
    },
    examples: [sessionExample],
  },
  RegisterRequest: {
    type: 'object',
    additionalProperties: false,
    required: ['name', 'email', 'password'],
    properties: {
      name: {
        type: 'string',
        minLength: 2,
        maxLength: 50,
        description:
          'Letters from any script, spaces, apostrophes, hyphens and periods. Surrounding spaces and invisible characters are removed and repeated spaces collapsed before the length is checked.',
        examples: ['Shanmugam R', 'சண்முகம்', "Mary-Jane O'Neil"],
      },
      email: {
        type: 'string',
        format: 'email',
        maxLength: 254,
        description: 'Trimmed and lowercased. Must not belong to an existing account.',
        examples: ['you@example.com'],
      },
      password: {
        type: 'string',
        format: 'password',
        minLength: 8,
        description:
          '8 characters to 72 bytes (UTF-8), with at least one lowercase letter, one uppercase letter and one number. Used exactly as typed (never trimmed).',
        examples: ['Layora@2026'],
      },
    },
  },
  LoginRequest: {
    type: 'object',
    additionalProperties: false,
    required: ['email', 'password'],
    properties: {
      email: {
        type: 'string',
        format: 'email',
        description: 'Case and surrounding spaces are ignored.',
        examples: [DEMO_USER.email],
      },
      password: {
        type: 'string',
        format: 'password',
        minLength: 1,
        examples: [DEMO_USER.password],
      },
    },
  },
  CategorySlug: {
    type: 'string',
    enum: CATEGORIES.map((c) => c.slug),
    description: 'URL-friendly category id.',
  },
  CategoryName: {
    type: 'string',
    enum: CATEGORIES.map((c) => c.label),
    description: 'Display name of the category.',
  },
  Category: {
    type: 'object',
    required: ['slug', 'name', 'count'],
    properties: {
      slug: schemaRef('CategorySlug'),
      name: schemaRef('CategoryName'),
      count: { type: 'integer', minimum: 0, description: 'Number of templates in the category.' },
    },
    examples: [{ slug: 'landing-page', name: 'Landing Page', count: 3 }],
  },
  Template: {
    type: 'object',
    required: [
      'id',
      'name',
      'slug',
      'description',
      'thumbnail_url',
      'category',
      'category_slug',
      'features',
      'pages',
      'favorites_count',
      'created_at',
    ],
    properties: {
      id: schemaRef('ObjectId'),
      name: { type: 'string', maxLength: 80 },
      slug: { type: 'string', pattern: '^[a-z0-9-]+$' },
      description: { type: 'string', maxLength: 400 },
      thumbnail_url: {
        type: 'string',
        format: 'uri',
        description: 'Absolute URL of the preview image (SVG, embeddable from any origin).',
      },
      category: schemaRef('CategoryName'),
      category_slug: schemaRef('CategorySlug'),
      features: { type: 'array', items: { type: 'string' }, description: 'Feature highlights.' },
      pages: {
        type: 'array',
        items: { type: 'string' },
        description: 'Pages or screens included.',
      },
      favorites_count: {
        type: 'integer',
        minimum: 0,
        description: 'How many users have this template in their favorites.',
      },
      created_at: {
        type: 'string',
        format: 'date-time',
        description: 'When the template was added to the catalogue.',
      },
    },
    examples: [templateExample],
  },
  FavoriteTemplate: {
    description: "A template in the signed-in user's favorites.",
    allOf: [
      schemaRef('Template'),
      {
        type: 'object',
        required: ['favorited_at'],
        properties: {
          favorited_at: {
            type: 'string',
            format: 'date-time',
            description: 'When the user added it to their favorites.',
          },
        },
      },
    ],
    examples: [favoriteExample],
  },
  PaginationMeta: {
    type: 'object',
    required: ['page', 'limit', 'total', 'total_pages'],
    properties: {
      page: { type: 'integer', minimum: 1, description: 'The current page.' },
      limit: { type: 'integer', minimum: 1, maximum: 50, description: 'Items per page.' },
      total: { type: 'integer', minimum: 0, description: 'Templates matching the filters.' },
      total_pages: {
        type: 'integer',
        minimum: 1,
        description: 'At least 1, even when nothing matches.',
      },
    },
    examples: [{ page: 1, limit: 12, total: 16, total_pages: 2 }],
  },
  Health: {
    type: 'object',
    required: ['status', 'database', 'uptime_seconds', 'timestamp'],
    properties: {
      status: { type: 'string', enum: ['ok', 'degraded'] },
      database: { type: 'string', enum: ['up', 'down'] },
      uptime_seconds: { type: 'integer', minimum: 0 },
      timestamp: { type: 'string', format: 'date-time' },
    },
  },
  ErrorDetail: {
    type: 'object',
    required: ['field', 'message'],
    properties: {
      field: {
        type: 'string',
        description:
          'The input that failed: a body field (`email`), query parameter (`category`) or path parameter (`id`). `body` or `query` when the problem is the input as a whole, such as an unknown key.',
        examples: ['email'],
      },
      message: {
        type: 'string',
        description: 'A human-readable message, safe to show next to the field.',
        examples: ['Enter a valid email address, like name@example.com'],
      },
    },
  },
  Error: {
    type: 'object',
    description: 'The error envelope used by every failed request.',
    required: ['success', 'error'],
    properties: {
      success: { type: 'boolean', const: false },
      error: {
        type: 'object',
        required: ['code', 'message', 'requestId'],
        properties: {
          code: {
            type: 'string',
            enum: [...ERROR_CODES],
            description: 'Stable, machine-readable error code.',
          },
          message: { type: 'string', description: 'A human-readable summary.' },
          details: {
            type: 'array',
            items: schemaRef('ErrorDetail'),
            description: 'Present on validation errors and some conflicts.',
          },
          requestId: {
            type: 'string',
            description: 'Same value as the `X-Request-Id` response header.',
          },
        },
      },
    },
  },
  HealthResponse: {
    type: 'object',
    required: ['success', 'data'],
    properties: {
      success: { type: 'boolean', description: '`false` when the database is down.' },
      data: schemaRef('Health'),
    },
  },
  SessionResponse: successEnvelope(schemaRef('Session'), {
    message: message('Signed in'),
  }),
  UserResponse: successEnvelope({
    type: 'object',
    required: ['user'],
    properties: { user: schemaRef('User') },
  }),
  TemplateListResponse: successEnvelope(
    { type: 'array', items: schemaRef('Template') },
    { meta: schemaRef('PaginationMeta') },
  ),
  TemplateResponse: successEnvelope(schemaRef('Template')),
  CategoryListResponse: successEnvelope({ type: 'array', items: schemaRef('Category') }),
  FavoriteListResponse: successEnvelope(
    { type: 'array', items: schemaRef('FavoriteTemplate') },
    {
      meta: {
        type: 'object',
        required: ['total'],
        properties: { total: { type: 'integer', minimum: 0 } },
      },
    },
  ),
  FavoriteResponse: successEnvelope(schemaRef('FavoriteTemplate'), {
    message: message('Added to favorites'),
  }),
};

/* ------------------------------------------------------------------------------------ */
/* Reusable parameters, headers and responses                                            */
/* ------------------------------------------------------------------------------------ */

const objectIdParameter = (name: string): OpenAPIV3_1.ParameterObject => ({
  name,
  in: 'path',
  required: true,
  description: 'Template id (24 hexadecimal characters).',
  schema: { type: 'string', pattern: '^[a-f\\d]{24}$' },
  example: templateExample.id,
});

const parameters: Record<string, OpenAPIV3_1.ParameterObject> = {
  TemplateId: objectIdParameter('id'),
  FavoriteTemplateId: objectIdParameter('templateId'),
  Search: {
    name: 'search',
    in: 'query',
    description:
      'Case-insensitive text matched against the template name and description. Matched literally (special characters have no meaning); surrounding spaces are trimmed.',
    schema: { type: 'string', maxLength: 64 },
    example: 'dashboard',
  },
  Category: {
    name: 'category',
    in: 'query',
    description: `Category slug or display name, case-insensitive: ${CATEGORIES.map((c) => `\`${c.slug}\``).join(', ')}. Give it once.`,
    schema: { type: 'string' },
    examples: {
      slug: { summary: 'By slug', value: 'landing-page' },
      name: { summary: 'By display name', value: 'Landing Page' },
    },
  },
  Sort: {
    name: 'sort',
    in: 'query',
    description:
      '`popular`: most favorited first (ties by name). `newest`: most recently added first. `name`: A to Z.',
    schema: { type: 'string', enum: [...SORT_OPTIONS], default: 'popular' },
  },
  Page: {
    name: 'page',
    in: 'query',
    description: 'Page number, starting at 1.',
    schema: { type: 'integer', minimum: 1, maximum: 1000, default: 1 },
  },
  Limit: {
    name: 'limit',
    in: 'query',
    description: 'Templates per page.',
    schema: { type: 'integer', minimum: 1, maximum: 50, default: 50 },
  },
};

const headers: Record<string, OpenAPIV3_1.HeaderObject> = {
  'X-Request-Id': {
    description:
      'Unique id of the request, also logged by the server. A well-formed incoming `X-Request-Id` (8 to 64 letters, digits, `_` or `-`) is reused.',
    schema: { type: 'string' },
  },
  'Retry-After': {
    description: 'Seconds to wait before trying again.',
    schema: { type: 'integer', example: 900 },
  },
};

const requestIdHeader = { 'X-Request-Id': { $ref: '#/components/headers/X-Request-Id' } };

const errorResponse = (
  description: string,
  examples: Record<string, { summary: string; value: unknown }>,
  extraHeaders: Record<string, Reference> = {},
): OpenAPIV3_1.ResponseObject => ({
  description,
  headers: { ...requestIdHeader, ...extraHeaders },
  content: { 'application/json': { schema: schemaRef('Error'), examples } },
});

const responses: Record<string, OpenAPIV3_1.ResponseObject> = {
  BadRequest: errorResponse('The request is not valid. `details` lists each problem by field.', {
    validation: {
      summary: 'Invalid fields',
      value: errorBody('VALIDATION_ERROR', 'Some fields need your attention', [
        { field: 'email', message: 'Enter a valid email address, like name@example.com' },
        { field: 'password', message: 'Password needs an uppercase letter' },
      ]),
    },
    unknownKey: {
      summary: 'Unknown field',
      value: errorBody('VALIDATION_ERROR', 'Some fields need your attention', [
        { field: 'body', message: 'Unrecognized key: "role"' },
      ]),
    },
    invalidJson: {
      summary: 'Malformed JSON body',
      value: errorBody('INVALID_JSON', 'The request body must be valid JSON'),
    },
  }),
  InvalidQuery: errorResponse('A query parameter is not valid.', {
    category: {
      summary: 'Unknown category',
      value: errorBody('VALIDATION_ERROR', 'Some fields need your attention', [
        {
          field: 'category',
          message: `Unknown category. Use one of: ${CATEGORIES.map((c) => c.slug).join(', ')}`,
        },
      ]),
    },
    repeated: {
      summary: 'Parameter given twice',
      value: errorBody('VALIDATION_ERROR', 'Some fields need your attention', [
        { field: 'category', message: 'Category must be a single value' },
      ]),
    },
  }),
  InvalidId: errorResponse('The template id is not a valid ObjectId.', {
    invalidId: {
      summary: 'Malformed id',
      value: errorBody('VALIDATION_ERROR', 'Some fields need your attention', [
        { field: 'id', message: 'The template id is not valid' },
      ]),
    },
  }),
  Unauthorized: errorResponse('Missing, invalid or expired session token.', {
    missing: {
      summary: 'No Authorization header',
      value: errorBody('UNAUTHORIZED', 'Please sign in to continue'),
    },
    invalid: {
      summary: 'Tampered, malformed or revoked token',
      value: errorBody('INVALID_TOKEN', 'Your session is not valid. Please sign in again.'),
    },
    expired: {
      summary: 'Expired token',
      value: errorBody('TOKEN_EXPIRED', 'Your session has expired. Please sign in again.'),
    },
  }),
  InvalidCredentials: errorResponse(
    'The email or password is wrong. The same answer is given for unknown emails, so accounts cannot be discovered.',
    {
      invalidCredentials: {
        summary: 'Wrong email or password',
        value: errorBody('INVALID_CREDENTIALS', 'Email or password is incorrect'),
      },
    },
  ),
  NotFound: errorResponse('The template does not exist.', {
    notFound: { summary: 'Unknown template', value: errorBody('NOT_FOUND', 'Template not found') },
  }),
  Conflict: errorResponse('An account with this email already exists.', {
    emailTaken: {
      summary: 'Email already registered',
      value: errorBody('CONFLICT', 'An account with this email already exists', [
        {
          field: 'email',
          message: 'An account with this email already exists. Try signing in.',
        },
      ]),
    },
  }),
  PayloadTooLarge: errorResponse('The request body is larger than 10 kB.', {
    tooLarge: {
      summary: 'Body over 10 kB',
      value: errorBody('PAYLOAD_TOO_LARGE', 'The request body is too large'),
    },
  }),
  TooManyRequests: errorResponse(
    'Rate limit reached: 300 requests per 15 minutes per IP across the API, and 10 failed sign-in or sign-up attempts per 15 minutes per IP.',
    {
      tooMany: {
        summary: 'Rate limited',
        value: errorBody(
          'TOO_MANY_REQUESTS',
          'Too many attempts. Please wait a few minutes and try again.',
        ),
      },
    },
    { 'Retry-After': { $ref: '#/components/headers/Retry-After' } },
  ),
  InternalError: errorResponse('Unexpected server error. No internal details are exposed.', {
    internal: {
      summary: 'Server error',
      value: errorBody('INTERNAL_ERROR', 'Something went wrong on our side. Please try again.'),
    },
  }),
};

const jsonContent = (schema: Reference, example?: unknown) => ({
  'application/json': { schema, ...(example === undefined ? {} : { example }) },
});

/* ------------------------------------------------------------------------------------ */
/* Paths                                                                                 */
/* ------------------------------------------------------------------------------------ */

const paths: OpenAPIV3_1.PathsObject = {
  '/health': {
    get: {
      tags: ['Health'],
      operationId: 'getHealth',
      summary: 'Check that the API and its database are up',
      description: 'For uptime monitors and platform health checks. Never cached.',
      responses: withCommonErrors({
        '200': {
          description: 'The API and database are healthy.',
          content: jsonContent(schemaRef('HealthResponse'), {
            success: true,
            data: {
              status: 'ok',
              database: 'up',
              uptime_seconds: 5321,
              timestamp: '2026-10-14T10:30:00.000Z',
            },
          }),
        },
        '503': {
          description: 'The database is unreachable.',
          content: jsonContent(schemaRef('HealthResponse'), {
            success: false,
            data: {
              status: 'degraded',
              database: 'down',
              uptime_seconds: 5321,
              timestamp: '2026-10-14T10:30:00.000Z',
            },
          }),
        },
      }),
    },
  },
  '/auth/register': {
    post: {
      tags: ['Auth'],
      operationId: 'register',
      summary: 'Create an account',
      description:
        'Creates an account and signs it in. Unknown fields are rejected. Ten failed attempts per 15 minutes per IP are allowed.',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: schemaRef('RegisterRequest'),
            examples: {
              account: {
                summary: 'New account',
                value: { name: 'Shanmugam R', email: 'you@example.com', password: 'Layora@2026' },
              },
              tamil: {
                summary: 'Name in Tamil',
                value: { name: 'சண்முகம்', email: 'tamil@example.com', password: 'Layora@2026' },
              },
            },
          },
        },
      },
      responses: withCommonErrors({
        '201': {
          description: 'Account created. The response contains a session token.',
          content: jsonContent(schemaRef('SessionResponse'), {
            success: true,
            data: sessionExample,
            message: 'Account created',
          }),
        },
        '400': responseRef('BadRequest'),
        '409': responseRef('Conflict'),
        '413': responseRef('PayloadTooLarge'),
      }),
    },
  },
  '/auth/login': {
    post: {
      tags: ['Auth'],
      operationId: 'login',
      summary: 'Sign in',
      description: `Exchanges an email and password for a session token. Try the demo account: \`${DEMO_USER.email}\` / \`${DEMO_USER.password}\`. Ten failed attempts per 15 minutes per IP are allowed; successful sign-ins do not count.`,
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: schemaRef('LoginRequest'),
            examples: {
              demo: {
                summary: 'Demo account',
                value: { email: DEMO_USER.email, password: DEMO_USER.password },
              },
            },
          },
        },
      },
      responses: withCommonErrors({
        '200': {
          description: 'Signed in.',
          content: jsonContent(schemaRef('SessionResponse'), {
            success: true,
            data: sessionExample,
            message: 'Signed in',
          }),
        },
        '400': responseRef('BadRequest'),
        '401': responseRef('InvalidCredentials'),
        '413': responseRef('PayloadTooLarge'),
      }),
    },
  },
  '/auth/me': {
    get: {
      tags: ['Auth'],
      operationId: 'getCurrentUser',
      summary: 'Get the signed-in user',
      description: 'Use it to restore a session on page load. Never cached.',
      security: BEARER_AUTH,
      responses: withCommonErrors({
        '200': {
          description: 'The signed-in user.',
          content: jsonContent(schemaRef('UserResponse'), {
            success: true,
            data: { user: userExample },
          }),
        },
        '401': responseRef('Unauthorized'),
      }),
    },
  },
  '/templates': {
    get: {
      tags: ['Templates'],
      operationId: 'listTemplates',
      summary: 'Browse and search templates',
      description:
        'Filters combine with AND. Empty values (`?search=`) are ignored; unknown or repeated parameters are rejected.',
      parameters: ['Search', 'Category', 'Sort', 'Page', 'Limit'].map(parameterRef),
      responses: withCommonErrors({
        '200': {
          description: 'A page of templates.',
          content: jsonContent(schemaRef('TemplateListResponse'), {
            success: true,
            data: [templateExample],
            meta: { page: 1, limit: 12, total: 1, total_pages: 1 },
          }),
        },
        '400': responseRef('InvalidQuery'),
      }),
    },
  },
  '/templates/categories': {
    get: {
      tags: ['Templates'],
      operationId: 'listCategories',
      summary: 'List categories with template counts',
      description: 'Always returns every category, in a fixed order, including empty ones.',
      responses: withCommonErrors({
        '200': {
          description: 'All categories.',
          content: jsonContent(schemaRef('CategoryListResponse'), {
            success: true,
            data: CATEGORIES.map((c) => ({
              slug: c.slug,
              name: c.label,
              count: SEED_TEMPLATES.filter((t) => t.category === c.label).length,
            })),
          }),
        },
      }),
    },
  },
  '/templates/{id}': {
    get: {
      tags: ['Templates'],
      operationId: 'getTemplate',
      summary: 'Get one template',
      parameters: [parameterRef('TemplateId')],
      responses: withCommonErrors({
        '200': {
          description: 'The template.',
          content: jsonContent(schemaRef('TemplateResponse'), {
            success: true,
            data: templateExample,
          }),
        },
        '400': responseRef('InvalidId'),
        '404': responseRef('NotFound'),
      }),
    },
  },
  '/favorites': {
    get: {
      tags: ['Favorites'],
      operationId: 'listFavorites',
      summary: "List the signed-in user's favorites",
      description: 'Newest first. Private and never cached.',
      security: BEARER_AUTH,
      responses: withCommonErrors({
        '200': {
          description: 'The favorites of the signed-in user.',
          content: jsonContent(schemaRef('FavoriteListResponse'), {
            success: true,
            data: [favoriteExample],
            meta: { total: 1 },
          }),
        },
        '401': responseRef('Unauthorized'),
      }),
    },
  },
  '/favorites/{templateId}': {
    parameters: [parameterRef('FavoriteTemplateId')],
    post: {
      tags: ['Favorites'],
      operationId: 'addFavorite',
      summary: 'Add a template to favorites',
      description:
        'Idempotent: the first call answers 201, repeated calls answer 200 with the existing favorite. `favorites_count` only increases on the first call.',
      security: BEARER_AUTH,
      responses: withCommonErrors({
        '201': {
          description: 'Added to favorites.',
          content: jsonContent(schemaRef('FavoriteResponse'), {
            success: true,
            data: favoriteExample,
            message: 'Added to favorites',
          }),
        },
        '200': {
          description: 'It was already a favorite. Nothing changed.',
          content: jsonContent(schemaRef('FavoriteResponse'), {
            success: true,
            data: favoriteExample,
            message: 'Already in your favorites',
          }),
        },
        '400': responseRef('InvalidId'),
        '401': responseRef('Unauthorized'),
        '404': responseRef('NotFound'),
      }),
    },
    delete: {
      tags: ['Favorites'],
      operationId: 'removeFavorite',
      summary: 'Remove a template from favorites',
      description:
        'Idempotent: answers 204 whether or not the template was a favorite. `favorites_count` only decreases when a favorite was actually removed.',
      security: BEARER_AUTH,
      responses: withCommonErrors({
        '204': { description: 'Removed (or it was not a favorite). No body.' },
        '400': responseRef('InvalidId'),
        '401': responseRef('Unauthorized'),
      }),
    },
  },
};

/* ------------------------------------------------------------------------------------ */
/* Document                                                                              */
/* ------------------------------------------------------------------------------------ */

const description = `
REST API of **Layora**, the Mini SaaS Template Store: browse a catalogue of website and app templates, create an account and keep a list of favorites.

### Authentication
\`POST /auth/register\` and \`POST /auth/login\` return a JWT. Send it as \`Authorization: Bearer <token>\` on the routes marked with a lock. Tokens expire after one day (see \`expires_at\`).

To try the protected routes here: run **POST /auth/login** with the demo account (\`${DEMO_USER.email}\` / \`${DEMO_USER.password}\`), copy \`data.token\`, then click **Authorize**.

### Responses
Every JSON response uses one envelope, with snake_case field names:

- Success: \`{ "success": true, "data": ..., "meta"?: ..., "message"?: ... }\`
- Error: \`{ "success": false, "error": { "code", "message", "details"?, "requestId" } }\`

Each response has an \`X-Request-Id\` header (repeated as \`requestId\` in error bodies) to quote when reporting a problem.

### Limits
300 requests per 15 minutes per IP across the API; 10 failed sign-in or sign-up attempts per 15 minutes per IP. JSON bodies are limited to 10 kB.
`.trim();

export const openApiDocument: OpenAPIV3_1.Document = {
  openapi: '3.1.0',
  info: {
    title: 'Layora API',
    version: '1.0.0',
    summary: 'Mini SaaS Template Store API',
    description,
    license: { name: 'MIT', identifier: 'MIT' },
  },
  servers: [{ url: '/api', description: 'This server' }],
  tags: [
    { name: 'Health', description: 'Liveness and readiness.' },
    { name: 'Auth', description: 'Sign up, sign in and the current user.' },
    { name: 'Templates', description: 'The public template catalogue.' },
    { name: 'Favorites', description: 'Templates saved by the signed-in user.' },
  ],
  paths,
  components: {
    schemas,
    parameters,
    headers,
    responses,
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'The `token` returned by sign-up or sign-in.',
      },
    },
  },
};
