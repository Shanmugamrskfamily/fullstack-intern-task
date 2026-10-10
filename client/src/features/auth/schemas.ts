import { z } from 'zod';
import { cleanText } from '@/lib/security';

/**
 * Mirrors the server's Zod rules (server/src/modules/auth/auth.schemas.ts) for instant
 * feedback. The server re-validates everything; it is the source of truth.
 */
const NAME_PATTERN = /^[\p{L}\p{M}][\p{L}\p{M} .'-]*$/u;
const byteLength = (value: string) => new TextEncoder().encode(value).length;

export const PASSWORD_RULES = [
  { id: 'length', label: '8+ characters', test: (v: string) => v.length >= 8 },
  { id: 'lower', label: 'lowercase', test: (v: string) => /[a-z]/.test(v) },
  { id: 'upper', label: 'uppercase', test: (v: string) => /[A-Z]/.test(v) },
  { id: 'number', label: 'number', test: (v: string) => /\d/.test(v) },
] as const;

const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, 'Enter your email')
  .max(254, 'Email must be at most 254 characters')
  .pipe(z.email('Enter an email like name@example.com'));

export const loginSchema = z.object({
  email: emailSchema,
  password: z
    .string()
    .min(1, 'Enter your password')
    .refine((v) => byteLength(v) <= 72, 'Password must be at most 72 bytes'),
});

export const registerSchema = z
  .object({
    name: z
      .string()
      .transform((v) => cleanText(v))
      .pipe(
        z
          .string()
          .min(2, 'Name must be at least 2 characters')
          .max(50, 'Name must be at most 50 characters')
          .regex(NAME_PATTERN, 'Use letters, spaces, apostrophes, hyphens or periods only'),
      ),
    email: emailSchema,
    password: z
      .string()
      .min(8, 'Password needs at least 8 characters')
      .refine((v) => byteLength(v) <= 72, 'Password must be at most 72 bytes')
      .regex(/[a-z]/, 'Add a lowercase letter')
      .regex(/[A-Z]/, 'Add an uppercase letter')
      .regex(/\d/, 'Add a number'),
    confirmPassword: z.string().min(1, 'Re-enter your password'),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ['confirmPassword'],
    message: "Passwords don't match",
  });

export type LoginFormInput = z.input<typeof loginSchema>;
export type LoginValues = z.output<typeof loginSchema>;
export type RegisterFormInput = z.input<typeof registerSchema>;
export type RegisterValues = z.output<typeof registerSchema>;
/** The API's register body is strict: confirmPassword is never sent. */
export type RegisterPayload = Omit<RegisterValues, 'confirmPassword'>;

export const DEMO_ACCOUNT = { email: 'demo@example.com', password: 'Demo@1234' } as const;
