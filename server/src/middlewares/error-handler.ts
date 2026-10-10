import type { ErrorRequestHandler, RequestHandler } from 'express';
import mongoose from 'mongoose';
import { ZodError } from 'zod';
import { ApiError } from '../utils/api-error.js';
import { logger } from '../utils/logger.js';
import { isDuplicateKeyError } from '../utils/mongo.js';

/** Errors raised by Express's body parser carry an HTTP status and a `type`. */
interface HttpLikeError {
  status: number;
  type?: string;
}

const isHttpLikeError = (error: unknown): error is HttpLikeError =>
  typeof error === 'object' &&
  error !== null &&
  'status' in error &&
  typeof (error as { status: unknown }).status === 'number';

/** Maps any thrown value to a safe, client-facing ApiError. */
export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;

  if (error instanceof ZodError) {
    return ApiError.validation(
      error.issues.map((issue) => ({ field: issue.path.join('.'), message: issue.message })),
    );
  }

  if (error instanceof mongoose.Error.CastError) {
    return ApiError.badRequest(`The value for "${error.path}" is not valid`);
  }

  if (error instanceof mongoose.Error.ValidationError) {
    return ApiError.validation(
      Object.values(error.errors).map((issue) => ({ field: issue.path, message: issue.message })),
    );
  }

  if (isDuplicateKeyError(error)) return ApiError.conflict('This resource already exists');

  if (isHttpLikeError(error) && error.status < 500) {
    if (error.type === 'entity.parse.failed') {
      return ApiError.badRequest('The request body must be valid JSON', 'INVALID_JSON');
    }
    if (error.type === 'entity.too.large') {
      return new ApiError(413, 'PAYLOAD_TOO_LARGE', 'The request body is too large');
    }
    return new ApiError(error.status, 'BAD_REQUEST', 'The request could not be processed');
  }

  return ApiError.internal();
}

export const errorHandler: ErrorRequestHandler = (error, req, res, _next) => {
  const apiError = toApiError(error);
  const log = req.log ?? logger;

  if (apiError.status >= 500) log.error({ err: error }, 'Unhandled error');
  else log.warn({ code: apiError.code, status: apiError.status }, apiError.message);

  if (apiError.status === 429) res.setHeader('Retry-After', '900');

  res.status(apiError.status).json({
    success: false,
    error: {
      code: apiError.code,
      message: apiError.message,
      ...(apiError.details?.length ? { details: apiError.details } : {}),
      requestId: req.id ? String(req.id) : undefined,
    },
  });
};

export const notFound: RequestHandler = (_req, _res, next) => {
  next(ApiError.notFound('This route does not exist'));
};
