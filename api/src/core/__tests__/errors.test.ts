import { Request, Response, NextFunction } from 'express';
import { ZodError, ZodIssue } from 'zod';
import {
    AppError,
    errorHandler,
    requestIdMiddleware,
    ErrorCode,
} from '../errors';

// ── AppError ──────────────────────────────────────────────────────────────────

describe('AppError', () => {
    test('constructs with code, message, status, fields', () => {
        const err = new AppError('NOT_FOUND', 'Entity missing', 404, [{ field: 'id', message: 'required' }]);
        expect(err.code).toBe('NOT_FOUND');
        expect(err.message).toBe('Entity missing');
        expect(err.status).toBe(404);
        expect(err.fields).toEqual([{ field: 'id', message: 'required' }]);
        expect(err.name).toBe('AppError');
        expect(err instanceof Error).toBe(true);
    });

    test('notFound() returns 404 with entity name', () => {
        const err = AppError.notFound('Partner');
        expect(err.status).toBe(404);
        expect(err.code).toBe('NOT_FOUND');
        expect(err.message).toContain('Partner');
    });

    test('notFound() defaults entity to "Resource"', () => {
        const err = AppError.notFound();
        expect(err.message).toContain('Resource');
    });

    test('unauthorized() returns 401', () => {
        const err = AppError.unauthorized();
        expect(err.status).toBe(401);
        expect(err.code).toBe('UNAUTHORIZED');
    });

    test('unauthorized() accepts custom message', () => {
        const err = AppError.unauthorized('Token expired');
        expect(err.message).toBe('Token expired');
    });

    test('forbidden() returns 403', () => {
        const err = AppError.forbidden();
        expect(err.status).toBe(403);
        expect(err.code).toBe('FORBIDDEN');
    });

    test('conflict() returns 409', () => {
        const err = AppError.conflict('Duplicate email');
        expect(err.status).toBe(409);
        expect(err.message).toBe('Duplicate email');
    });

    test('validation() returns 422 with fields', () => {
        const fields = [{ field: 'email', message: 'Invalid email' }];
        const err = AppError.validation('Validation failed', fields);
        expect(err.status).toBe(422);
        expect(err.code).toBe('VALIDATION_ERROR');
        expect(err.fields).toEqual(fields);
    });

    test('badRequest() returns 400', () => {
        const err = AppError.badRequest('Missing body');
        expect(err.status).toBe(400);
        expect(err.code).toBe('BAD_REQUEST');
    });

    test('tenantMismatch() returns 403 TENANT_MISMATCH', () => {
        const err = AppError.tenantMismatch();
        expect(err.status).toBe(403);
        expect(err.code).toBe('TENANT_MISMATCH');
    });
});

// ── errorHandler middleware ───────────────────────────────────────────────────

function makeRes() {
    const res = { status: jest.fn(), json: jest.fn() } as unknown as Response;
    (res.status as jest.Mock).mockReturnValue(res);
    return res;
}

function makeReq(overrides?: Partial<Request>): Request {
    return { id: 'req-123', ip: '127.0.0.1', headers: {} as any, ...overrides } as unknown as Request;
}

describe('errorHandler', () => {
    const next: NextFunction = jest.fn();

    test('handles AppError with correct status and envelope', () => {
        const err = AppError.notFound('Invoice');
        const req = makeReq();
        const res = makeRes();

        errorHandler(err, req, res, next);

        expect(res.status).toHaveBeenCalledWith(404);
        const body = (res.json as jest.Mock).mock.calls[0][0];
        expect(body.error.code).toBe('NOT_FOUND');
        expect(body.error.message).toContain('Invoice');
        expect(body.error.requestId).toBe('req-123');
    });

    test('handles AppError with fields', () => {
        const fields = [{ field: 'name', message: 'required' }];
        const err = AppError.validation('Bad input', fields);
        const req = makeReq();
        const res = makeRes();

        errorHandler(err, req, res, next);

        const body = (res.json as jest.Mock).mock.calls[0][0];
        expect(body.error.fields).toEqual(fields);
        expect(res.status).toHaveBeenCalledWith(422);
    });

    test('handles ZodError with 422 and field list', () => {
        const issues = [
            { code: 'invalid_type', expected: 'string', received: 'undefined', path: ['email'], message: 'Required' },
        ] as any;
        const err = new ZodError(issues);
        const req = makeReq();
        const res = makeRes();

        errorHandler(err, req, res, next);

        expect(res.status).toHaveBeenCalledWith(422);
        const body = (res.json as jest.Mock).mock.calls[0][0];
        expect(body.error.code).toBe('VALIDATION_ERROR');
        expect(body.error.fields[0].field).toBe('email');
    });

    test('handles Prisma P2002 unique constraint as 409 CONFLICT', () => {
        const err = { code: 'P2002', message: 'Unique constraint failed' };
        const req = makeReq();
        const res = makeRes();

        errorHandler(err, req, res, next);

        expect(res.status).toHaveBeenCalledWith(409);
        const body = (res.json as jest.Mock).mock.calls[0][0];
        expect(body.error.code).toBe('CONFLICT');
    });

    test('handles unknown error as 500 INTERNAL_ERROR', () => {
        const err = new Error('Something exploded');
        const req = makeReq();
        const res = makeRes();

        errorHandler(err, req, res, next);

        expect(res.status).toHaveBeenCalledWith(500);
        const body = (res.json as jest.Mock).mock.calls[0][0];
        expect(body.error.code).toBe('INTERNAL_ERROR');
    });

    test('generates a requestId when req.id is absent', () => {
        const err = AppError.badRequest('test');
        const req = makeReq({ id: undefined as any });
        const res = makeRes();

        errorHandler(err, req, res, next);

        const body = (res.json as jest.Mock).mock.calls[0][0];
        expect(typeof body.error.requestId).toBe('string');
        expect(body.error.requestId.length).toBeGreaterThan(0);
    });
});

// ── requestIdMiddleware ───────────────────────────────────────────────────────

describe('requestIdMiddleware', () => {
    test('attaches a UUID to req.id and calls next', () => {
        const req = makeReq({ id: undefined as any });
        const res = makeRes();
        const next = jest.fn();

        requestIdMiddleware(req, res, next);

        expect(typeof (req as any).id).toBe('string');
        expect((req as any).id.length).toBe(36); // UUID v4
        expect(next).toHaveBeenCalledTimes(1);
    });
});
