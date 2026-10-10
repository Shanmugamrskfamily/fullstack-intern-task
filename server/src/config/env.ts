import { randomBytes } from 'node:crypto';
import { isIP } from 'node:net';
import { z } from 'zod';

/** Empty strings from .env files count as "not set". */
const optionalString = z.preprocess(
  (v) => (v === '' ? undefined : v),
  z.string().trim().optional(),
);
const optionalUrl = z.preprocess((v) => (v === '' ? undefined : v), z.url().optional());

const EnvSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().min(1).max(65_535).default(5000),
    MONGODB_URI: optionalString,
    MONGODB_DB_NAME: z
      .string()
      .regex(/^[\w-]+$/)
      .default('layora'),
    JWT_SECRET: z.preprocess(
      (v) => (v === '' ? undefined : v),
      z.string().min(32, 'JWT_SECRET must be at least 32 characters').optional(),
    ),
    JWT_EXPIRES_IN: z
      .string()
      .regex(/^\d+[smhd]$/, 'Use a duration like 15m, 12h or 1d')
      .default('1d'),
    CLIENT_ORIGINS: z.string().default('http://localhost:5173,http://127.0.0.1:5173'),
    CLIENT_ORIGIN_PATTERN: optionalString,
    PUBLIC_BASE_URL: optionalUrl,
    RENDER_EXTERNAL_URL: optionalUrl,
    SEED_ON_BOOT: z
      .enum(['true', 'false'])
      .default('true')
      .transform((v) => v === 'true'),
    LOG_LEVEL: z.preprocess(
      (v) => (v === '' ? undefined : v),
      z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).optional(),
    ),
    TRUST_PROXY: z.coerce.number().int().min(0).max(5).default(1),
    // Optional resolvers for networks that refuse the SRV lookups mongodb+srv:// needs.
    DNS_SERVERS: z.preprocess(
      (v) => (v === '' ? undefined : v),
      z
        .string()
        .refine(
          (v) => v.split(',').every((ip) => isIP(ip.trim()) !== 0),
          'Use comma-separated IP addresses, e.g. 8.8.8.8,1.1.1.1',
        )
        .optional(),
    ),
  })
  .superRefine((env, ctx) => {
    if (env.NODE_ENV !== 'production') return;
    if (!env.MONGODB_URI) {
      ctx.addIssue({ code: 'custom', path: ['MONGODB_URI'], message: 'Required in production' });
    }
    if (!env.JWT_SECRET) {
      ctx.addIssue({ code: 'custom', path: ['JWT_SECRET'], message: 'Required in production' });
    }
  });

const parsed = EnvSchema.safeParse(process.env);

if (!parsed.success) {
  // Fail fast with a readable message instead of crashing later with a vague error.
  console.error(`\nInvalid environment configuration:\n${z.prettifyError(parsed.error)}\n`);
  process.exit(1);
}

const raw = parsed.data;

const clientOriginPattern = raw.CLIENT_ORIGIN_PATTERN
  ? new RegExp(raw.CLIENT_ORIGIN_PATTERN)
  : undefined;

export const env = {
  ...raw,
  isProduction: raw.NODE_ENV === 'production',
  isTest: raw.NODE_ENV === 'test',
  /** Development and tests get a random per-process secret, so tokens reset on restart. */
  jwtSecret: raw.JWT_SECRET ?? randomBytes(48).toString('base64url'),
  clientOrigins: raw.CLIENT_ORIGINS.split(',')
    .map((origin) => origin.trim().replace(/\/$/, ''))
    .filter(Boolean),
  clientOriginPattern,
  dnsServers: (raw.DNS_SERVERS ?? '')
    .split(',')
    .map((ip) => ip.trim())
    .filter(Boolean),
  publicBaseUrl: (raw.PUBLIC_BASE_URL ?? raw.RENDER_EXTERNAL_URL ?? `http://localhost:${raw.PORT}`)
    .toString()
    .replace(/\/$/, ''),
} as const;

export type Env = typeof env;
