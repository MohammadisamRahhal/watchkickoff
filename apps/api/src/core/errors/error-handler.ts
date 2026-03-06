import type { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { ZodError } from 'zod';
import { AppError, ValidationError } from './app-error.js';
import { ERROR_CODES } from './error-codes.js';
import { createLogger } from '../logger.js';

const logger = createLogger('error-handler');

interface ErrorResponse {
  error: {
    code: string;
    message: string;
    correlationId: string;
    timestamp: string;
    details?: Record<string, unknown>;
  };
}

export function buildErrorHandler() {
  return function errorHandler(
    error: FastifyError | AppError | ZodError | Error,
    request: FastifyRequest,
    reply: FastifyReply,
  ): void {
    const correlationId =
      (request.headers['x-correlation-id'] as string | undefined) ?? 'unknown';
    const timestamp = new Date().toISOString();

    if (error instanceof ZodError) {
      const details: Record<string, string> = {};
      for (const issue of error.issues) {
        const key = issue.path.join('.');
        details[key] = issue.message;
      }
      const appErr = new ValidationError('Request validation failed.', details);
      logger.warn({ correlationId, details }, appErr.message);
      void reply.status(400).send(buildResponse(appErr, correlationId, timestamp));
      return;
    }

    if (error instanceof AppError) {
      if (error.httpStatus >= 500) {
        logger.error({ correlationId, code: error.code, err: error }, error.message);
      } else {
        logger.warn({ correlationId, code: error.code }, error.message);
      }
      void reply.status(error.httpStatus).send(buildResponse(error, correlationId, timestamp));
      return;
    }

    const fastifyErr = error as FastifyError;
    if ('statusCode' in fastifyErr && fastifyErr.statusCode === 400) {
      const appErr = new ValidationError(error.message);
      logger.warn({ correlationId }, error.message);
      void reply.status(400).send(buildResponse(appErr, correlationId, timestamp));
      return;
    }

    logger.error({ correlationId, err: error }, 'Unhandled error');
    void reply.status(500).send({
      error: {
        code: ERROR_CODES.INTERNAL_ERROR,
        message: 'An unexpected error occurred.',
        correlationId,
        timestamp,
      },
    } satisfies ErrorResponse);
  };
}

function buildResponse(
  err: AppError,
  correlationId: string,
  timestamp: string,
): ErrorResponse {
  return {
    error: {
      code: err.code,
      message: err.message,
      correlationId,
      timestamp,
      ...(err.details != null ? { details: err.details } : {}),
    },
  };
}
