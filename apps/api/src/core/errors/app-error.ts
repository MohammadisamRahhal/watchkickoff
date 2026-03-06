import { ErrorCode, ERROR_CODES } from './error-codes.js';

export class AppError extends Error {
  readonly httpStatus: number;
  readonly code: ErrorCode;
  readonly details: Record<string, unknown> | undefined;

  constructor(
    message: string,
    code: ErrorCode,
    httpStatus: number,
    details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = this.constructor.name;
    this.httpStatus = httpStatus;
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * Generic provider error used throughout infrastructure/http/.
 * Takes an ErrorCode string + message + optional HTTP status.
 */
export class ProviderError extends AppError {
  constructor(code: ErrorCode, message: string, httpStatus = 502) {
    super(message, code, httpStatus);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, ERROR_CODES.VALIDATION_BODY, 400, details);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id: string) {
    super(`${resource} not found: ${id}`, ERROR_CODES.NOT_FOUND_RESOURCE, 404);
  }
}

export class ProviderAuthError extends AppError {
  constructor() {
    super(
      'Data provider authentication failed.',
      ERROR_CODES.PROVIDER_AUTH_FAILURE,
      503,
    );
  }
}

export class ProviderRateLimitError extends AppError {
  constructor(readonly retryAfterSeconds?: number) {
    super(
      'Data provider rate limit reached.',
      ERROR_CODES.PROVIDER_RATE_LIMITED,
      503,
      retryAfterSeconds != null ? { retryAfterSeconds } : undefined,
    );
  }
}

export class ProviderUnavailableError extends AppError {
  constructor(cause?: string) {
    super(
      'Data provider temporarily unavailable.',
      ERROR_CODES.PROVIDER_UNAVAILABLE,
      503,
      cause ? { cause } : undefined,
    );
  }
}

export class ProviderInvalidResponseError extends AppError {
  constructor(details?: Record<string, unknown>) {
    super(
      'Data provider returned an unexpected response shape.',
      ERROR_CODES.PROVIDER_INVALID_RESPONSE,
      502,
      details,
    );
  }
}

export class DatabaseError extends AppError {
  constructor(message: string) {
    super(message, ERROR_CODES.DATABASE_QUERY_FAILED, 500);
  }
}
