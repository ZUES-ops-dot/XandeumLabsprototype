import { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { ZodError } from 'zod';

const DB_NETWORK_ERRORS = new Set([
  'ECONNREFUSED',
  'ENOTFOUND',
  'ETIMEDOUT',
  'ECONNRESET',
  'EHOSTUNREACH'
]);

const DB_SCHEMA_ERRORS = new Set(['42P01']);

function getErrorCode(err: unknown): string | undefined {
  if (typeof err === 'object' && err !== null && 'code' in err) {
    const code = (err as { code: unknown }).code;
    return typeof code === 'string' ? code : undefined;
  }
  return undefined;
}

function checkNestedErrors(err: unknown, checker: (code: string) => boolean): boolean {
  const code = getErrorCode(err);
  if (code && checker(code)) return true;

  if (typeof err === 'object' && err !== null) {
    const record = err as Record<string, unknown>;
    const children = Array.isArray(record.errors)
      ? record.errors
      : Array.isArray(record.aggregateErrors)
        ? record.aggregateErrors
        : [];
    for (const child of children) {
      if (checkNestedErrors(child, checker)) return true;
    }
  }
  return false;
}

function isDbConnectionError(err: unknown): boolean {
  return checkNestedErrors(err, (code) => DB_NETWORK_ERRORS.has(code));
}

function isDbSchemaError(err: unknown): boolean {
  return checkNestedErrors(err, (code) => DB_SCHEMA_ERRORS.has(code));
}

export function errorHandler(
  err: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply
) {
  if (err instanceof ZodError) {
    reply.code(400);
    return reply.send({
      error: 'validation_error',
      message: 'Invalid request parameters',
      details: err.errors
    });
  }

  if (isDbConnectionError(err)) {
    reply.code(503);
    return reply.send({
      error: 'db_unavailable',
      message: 'Database connection unavailable'
    });
  }

  if (isDbSchemaError(err)) {
    reply.code(503);
    return reply.send({
      error: 'db_not_initialized',
      message: 'Database schema not initialized. Run migrations first.'
    });
  }

  request.log.error(err);
  reply.code(500);
  return reply.send({
    error: 'internal_error',
    message: 'An unexpected error occurred'
  });
}
