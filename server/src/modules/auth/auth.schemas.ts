import { z } from 'zod';
import { byteLength, cleanText } from '../../utils/text.js';

/** Letters from any script (Tamil, Telugu, Latin…), spaces, apostrophes, hyphens, periods. */
const NAME_PATTERN = /^[\p{L}\p{M}][\p{L}\p{M} .'-]*$/u;

export const nameSchema = z
  .string({ error: 'Enter your name' })
  .transform(cleanText)
  .pipe(
    z
      .string()
      .min(2, 'Name must be at least 2 characters')
      .max(50, 'Name must be at most 50 characters')
      .regex(
        NAME_PATTERN,
        'Name can only contain letters, spaces, apostrophes, hyphens and periods',
      ),
  );

export const emailSchema = z
  .string({ error: 'Enter your email' })
  .trim()
  .toLowerCase()
  .max(254, 'Email must be at most 254 characters')
  .pipe(z.email('Enter a valid email address, like name@example.com'));

/** Passwords are never trimmed or altered. bcrypt only uses the first 72 bytes. */
export const newPasswordSchema = z
  .string({ error: 'Enter a password' })
  .min(8, 'Password must be at least 8 characters')
  .refine((value) => byteLength(value) <= 72, 'Password must be at most 72 bytes')
  .regex(/[a-z]/, 'Password needs a lowercase letter')
  .regex(/[A-Z]/, 'Password needs an uppercase letter')
  .regex(/\d/, 'Password needs a number');

export const registerSchema = z.strictObject({
  name: nameSchema,
  email: emailSchema,
  password: newPasswordSchema,
});

export const loginSchema = z.strictObject({
  email: emailSchema,
  password: z
    .string({ error: 'Enter your password' })
    .min(1, 'Enter your password')
    .refine((value) => byteLength(value) <= 72, 'Password must be at most 72 bytes'),
});

export type RegisterInput = z.output<typeof registerSchema>;
export type LoginInput = z.output<typeof loginSchema>;
