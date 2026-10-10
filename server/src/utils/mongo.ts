import { z } from 'zod';

const OBJECT_ID = /^[a-f\d]{24}$/i;

export const isObjectId = (value: unknown): value is string =>
  typeof value === 'string' && OBJECT_ID.test(value);

/** Zod schema for a MongoDB ObjectId in a URL parameter. */
export const objectIdSchema = (label = 'id') =>
  z.string().regex(OBJECT_ID, `The ${label} is not valid`);

/** MongoDB duplicate-key error (unique index violation). */
export const isDuplicateKeyError = (error: unknown): boolean =>
  typeof error === 'object' &&
  error !== null &&
  'code' in error &&
  (error as { code?: unknown }).code === 11000;
