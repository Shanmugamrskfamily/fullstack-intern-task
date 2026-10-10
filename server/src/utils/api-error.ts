export interface ErrorDetail {
  field: string;
  message: string;
}

/**
 * An expected, client-facing error. Anything thrown that is not an ApiError is treated as
 * an unexpected 500 and its details are never sent to the client.
 */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details: ErrorDetail[] | undefined;

  constructor(status: number, code: string, message: string, details?: ErrorDetail[]) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }

  static badRequest(message = 'The request is not valid', code = 'BAD_REQUEST'): ApiError {
    return new ApiError(400, code, message);
  }

  static validation(details: ErrorDetail[], message = 'Some fields need your attention'): ApiError {
    return new ApiError(400, 'VALIDATION_ERROR', message, details);
  }

  static unauthorized(message = 'Please sign in to continue', code = 'UNAUTHORIZED'): ApiError {
    return new ApiError(401, code, message);
  }

  static notFound(message = 'Resource not found'): ApiError {
    return new ApiError(404, 'NOT_FOUND', message);
  }

  static conflict(message: string, details?: ErrorDetail[]): ApiError {
    return new ApiError(409, 'CONFLICT', message, details);
  }

  static tooManyRequests(message = 'Too many attempts. Please wait a few minutes and try again.') {
    return new ApiError(429, 'TOO_MANY_REQUESTS', message);
  }

  static internal(): ApiError {
    return new ApiError(
      500,
      'INTERNAL_ERROR',
      'Something went wrong on our side. Please try again.',
    );
  }
}
