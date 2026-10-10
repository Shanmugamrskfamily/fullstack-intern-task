import type { Request, RequestHandler } from 'express';
import type { z, ZodType } from 'zod';
import { ApiError, type ErrorDetail } from '../utils/api-error.js';

type Location = 'params' | 'query' | 'body';
type Schemas = Partial<Record<Location, ZodType>>;

const LOCATIONS: Location[] = ['params', 'query', 'body'];

const toDetails = (error: z.ZodError, location: Location): ErrorDetail[] =>
  error.issues.map((issue) => ({
    field: issue.path.length ? issue.path.join('.') : location,
    message: issue.message,
  }));

/**
 * Validates and sanitises request input with Zod. All failures across params, query and
 * body are reported together. Parsed values are stored on `req.valid`; the raw input
 * is never used by controllers.
 */
export const validate =
  (schemas: Schemas): RequestHandler =>
  (req, _res, next) => {
    const details: ErrorDetail[] = [];
    const valid: NonNullable<Request['valid']> = {};

    for (const location of LOCATIONS) {
      const schema = schemas[location];
      if (!schema) continue;
      const result = schema.safeParse(req[location] ?? {});
      if (result.success) valid[location] = result.data;
      else details.push(...toDetails(result.error, location));
    }

    if (details.length) return next(ApiError.validation(details));
    req.valid = valid;
    next();
  };

/** Typed access to input that `validate()` already parsed with the same schema. */
export function validated<S extends ZodType>(req: Request, location: Location, _schema: S) {
  return req.valid?.[location] as z.output<S>;
}
