/**
 * core/errors — Standard error envelope
 *
 * Every API error is shaped as:
 *   { error: { code, message, fields?, requestId } }
 *
 * Usage:
 *   throw new AppError('VALIDATION_ERROR', 'Invalid input', 400, fieldErrors);
 *   throw AppError.notFound('Partner');
 *   throw AppError.unauthorized();
 */

import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import { ZodError } from 'zod';

// ── Error codes ────────────────────────────────────────────────────────────────

export type ErrorCode =
    | 'VALIDATION_ERROR'
    | 'UNAUTHORIZED'
    | 'FORBIDDEN'
    | 'NOT_FOUND'
    | 'CONFLICT'
    | 'RATE_LIMITED'
    | 'INTERNAL_ERROR'
    | 'BAD_REQUEST'
    | 'TENANT_MISMATCH';

export interface FieldError {
    field: string;
    message: string;
}

export interface ErrorEnvelope {
    error: {
        code: ErrorCode;
        message: string;
        fields?: FieldError[];
        requestId: string;
    };
}

// ── AppError class ─────────────────────────────────────────────────────────────

export class AppError extends Error {
    constructor(
        public readonly code: ErrorCode,
        message: string,
        public readonly status: number = 500,
        public readonly fields?: FieldError[],
    ) {
        super(message);
        this.name = 'AppError';
    }

    static notFound(entity = 'Resource'): AppError {
        return new AppError('NOT_FOUND', `${entity} not found`, 404);
    }

    static unauthorized(msg = 'Authentication required'): AppError {
        return new AppError('UNAUTHORIZED', msg, 401);
    }

    static forbidden(msg = 'You do not have permission for this action'): AppError {
        return new AppError('FORBIDDEN', msg, 403);
    }

    static conflict(msg: string): AppError {
        return new AppError('CONFLICT', msg, 409);
    }

    static validation(msg: string, fields?: FieldError[]): AppError {
        return new AppError('VALIDATION_ERROR', msg, 422, fields);
    }

    static badRequest(msg: string): AppError {
        return new AppError('BAD_REQUEST', msg, 400);
    }

    static tenantMismatch(): AppError {
        return new AppError('TENANT_MISMATCH', 'Cross-tenant access denied', 403);
    }
}

// ── Express error handler middleware ──────────────────────────────────────────

export function errorHandler(
    err: unknown,
    req: Request,
    res: Response,
    _next: NextFunction,
): void {
    const requestId = (req as any).id ?? randomUUID();

    // Zod validation error
    if (err instanceof ZodError) {
        const fields: FieldError[] = err.issues.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
        }));
        const body: ErrorEnvelope = {
            error: { code: 'VALIDATION_ERROR', message: 'Validation failed', fields, requestId },
        };
        res.status(422).json(body);
        return;
    }

    // Known application error
    if (err instanceof AppError) {
        const body: ErrorEnvelope = {
            error: {
                code: err.code,
                message: err.message,
                fields: err.fields,
                requestId,
            },
        };
        res.status(err.status).json(body);
        return;
    }

    // Prisma unique constraint violation
    if (
        typeof err === 'object' &&
        err !== null &&
        (err as any).code === 'P2002'
    ) {
        const body: ErrorEnvelope = {
            error: {
                code: 'CONFLICT',
                message: 'A record with this value already exists',
                requestId,
            },
        };
        res.status(409).json(body);
        return;
    }

    // Unknown error — log + generic 500
    console.error('[ERROR]', err);
    const body: ErrorEnvelope = {
        error: {
            code: 'INTERNAL_ERROR',
            message: 'An unexpected error occurred',
            requestId,
        },
    };
    res.status(500).json(body);
}

/** Attach a unique request ID to every incoming request */
export function requestIdMiddleware(req: Request, _res: Response, next: NextFunction): void {
    (req as any).id = randomUUID();
    next();
}
