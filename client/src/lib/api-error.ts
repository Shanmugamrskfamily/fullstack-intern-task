import { isAxiosError } from 'axios';

export interface FieldError {
  field: string;
  message: string;
}

/** One error shape for the whole client, whatever went wrong. */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details: FieldError[];
  readonly requestId?: string;

  constructor(
    status: number,
    code: string,
    message: string,
    details: FieldError[] = [],
    requestId?: string,
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
    this.requestId = requestId;
  }

  get isNetworkError() {
    return this.status === 0;
  }
}

interface ErrorEnvelope {
  error?: { code?: string; message?: string; details?: FieldError[]; requestId?: string };
}

export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;

  if (isAxiosError<ErrorEnvelope>(error)) {
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      return new ApiError(0, 'TIMEOUT', 'The server took too long to respond. Please try again.');
    }
    if (!error.response) {
      return new ApiError(
        0,
        'NETWORK_ERROR',
        "Can't reach the server. Check your connection and try again.",
      );
    }
    const { status, data } = error.response;
    const body = data?.error;
    return new ApiError(
      status,
      body?.code ?? 'HTTP_ERROR',
      body?.message ?? 'Something went wrong. Please try again.',
      Array.isArray(body?.details) ? body.details : [],
      body?.requestId,
    );
  }

  return new ApiError(0, 'UNKNOWN', 'Something unexpected happened. Please try again.');
}

export const getErrorMessage = (error: unknown) => toApiError(error).message;
