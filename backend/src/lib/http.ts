import { Prisma } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import type { ErrorRequestHandler, RequestHandler, Response } from 'express';
import { ZodError } from 'zod';

export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string) { super(message); }
}

export function success(res: Response, data: unknown, status = 200, extra: object = {}) {
  return res.status(status).json({ data, ...extra });
}

export function pagination(page: number, pageSize: number, totalItems: number) {
  return { page, pageSize, totalItems, totalPages: Math.ceil(totalItems / pageSize) };
}

export const requestContext: RequestHandler = (_req, res, next) => {
  res.locals.requestId = randomUUID();
  res.setHeader('X-Request-Id', res.locals.requestId as string);
  res.setHeader('Cache-Control', 'no-store');
  next();
};

export const errorHandler: ErrorRequestHandler = (error: unknown, _req, res, _next) => {
  let status = 500;
  let code = 'INTERNAL_ERROR';
  let message = 'An unexpected error occurred';
  let details: unknown;
  if (error instanceof ApiError) {
    ({ status, code, message } = error);
  } else if (error instanceof ZodError) {
    status = 422; code = 'VALIDATION_ERROR'; message = 'Request validation failed';
    details = error.issues.map(issue => ({ field: issue.path.join('.'), message: issue.message }));
  } else if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') { status = 409; code = 'DUPLICATE_VALUE'; message = 'A unique value already exists'; }
    if (error.code === 'P2003') { status = 409; code = 'REFERENCE_CONFLICT'; message = 'A referenced record is missing or linked'; }
    if (error.code === 'P2025') { status = 404; code = 'NOT_FOUND'; message = 'Record not found'; }
    if (error.code === 'P2034') { status = 409; code = 'CONCURRENT_UPDATE'; message = 'Data changed concurrently; refresh before retrying'; }
  } else if (error instanceof SyntaxError && 'body' in error) {
    status = 400; code = 'INVALID_JSON'; message = 'Malformed JSON body';
  } else if (typeof error === 'object' && error !== null && 'type' in error && error.type === 'entity.too.large') {
    status = 413; code = 'PAYLOAD_TOO_LARGE'; message = 'JSON body exceeds 32 KB';
  }
  if (status === 500) console.error(JSON.stringify({ event: 'request_failed', requestId: res.locals.requestId, errorType: error instanceof Error ? error.name : 'Unknown' }));
  res.status(status).json({ error: { code, message, ...(details ? { details } : {}), requestId: res.locals.requestId } });
};
