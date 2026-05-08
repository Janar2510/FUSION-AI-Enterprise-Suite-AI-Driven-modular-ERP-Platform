import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import {
    validate,
    validateQuery,
    parseBody,
    PaginationSchema,
    IdParamSchema,
    EmailSchema,
    PasswordSchema,
} from '../validation';
import { AppError } from '../errors';

function makeReq(body?: unknown, query?: unknown): Request {
    return { body, query } as unknown as Request;
}
function makeRes(): Response {
    return {} as Response;
}

// ── validate() middleware ─────────────────────────────────────────────────────

describe('validate()', () => {
    const Schema = z.object({ name: z.string().min(1), age: z.number().int().positive() });

    test('calls next() and replaces req.body on valid input', () => {
        const req = makeReq({ name: 'Alice', age: 30, extra: 'stripped' });
        const next = jest.fn();
        validate(Schema)(req, makeRes(), next);

        expect(next).toHaveBeenCalledWith(/* no error */);
        expect((req as any).body).toEqual({ name: 'Alice', age: 30 });
    });

    test('calls next(AppError) on invalid input', () => {
        const req = makeReq({ name: '', age: -1 });
        const next = jest.fn();
        validate(Schema)(req, makeRes(), next);

        expect(next).toHaveBeenCalledTimes(1);
        const err = (next as jest.Mock).mock.calls[0][0];
        expect(err).toBeInstanceOf(AppError);
        expect(err.status).toBe(422);
        expect(err.fields.length).toBeGreaterThan(0);
    });

    test('calls next(AppError) when body is missing entirely', () => {
        const req = makeReq(undefined);
        const next = jest.fn();
        validate(Schema)(req, makeRes(), next);

        const err = (next as jest.Mock).mock.calls[0][0];
        expect(err).toBeInstanceOf(AppError);
    });
});

// ── validateQuery() middleware ────────────────────────────────────────────────

describe('validateQuery()', () => {
    test('attaches parsed query to req.validatedQuery on success', () => {
        const req = makeReq(undefined, { page: '2', limit: '10' });
        const next = jest.fn();
        validateQuery(PaginationSchema)(req, makeRes(), next);

        expect(next).toHaveBeenCalledWith();
        expect((req as any).validatedQuery).toMatchObject({ page: 2, limit: 10 });
    });

    test('calls next(AppError) with query prefix on invalid input', () => {
        const req = makeReq(undefined, { page: 'abc' });
        const next = jest.fn();
        validateQuery(PaginationSchema)(req, makeRes(), next);

        const err = (next as jest.Mock).mock.calls[0][0];
        expect(err).toBeInstanceOf(AppError);
        // Field names should be prefixed with "query."
        expect(err.fields.some((f: { field: string }) => f.field.startsWith('query.'))).toBe(true);
    });
});

// ── parseBody() inline helper ─────────────────────────────────────────────────

describe('parseBody()', () => {
    const Schema = z.object({ email: z.string().email() });

    test('returns parsed data on valid input', () => {
        const req = makeReq({ email: 'user@example.com' });
        const result = parseBody(req, Schema);
        expect(result).toEqual({ email: 'user@example.com' });
    });

    test('throws AppError on invalid input', () => {
        const req = makeReq({ email: 'not-an-email' });
        expect(() => parseBody(req, Schema)).toThrow(AppError);
    });
});

// ── PaginationSchema ──────────────────────────────────────────────────────────

describe('PaginationSchema', () => {
    test('coerces strings to numbers', () => {
        const result = PaginationSchema.parse({ page: '3', limit: '50' });
        expect(result).toEqual({ page: 3, limit: 50 });
    });

    test('applies defaults', () => {
        const result = PaginationSchema.parse({});
        expect(result.page).toBe(1);
        expect(result.limit).toBe(20);
    });

    test('rejects limit > 100', () => {
        expect(() => PaginationSchema.parse({ limit: '200' })).toThrow();
    });

    test('rejects page < 1', () => {
        expect(() => PaginationSchema.parse({ page: '0' })).toThrow();
    });

    test('passes optional search field', () => {
        const result = PaginationSchema.parse({ search: 'acme' });
        expect(result.search).toBe('acme');
    });
});

// ── IdParamSchema ─────────────────────────────────────────────────────────────

describe('IdParamSchema', () => {
    test('accepts a non-empty string ID', () => {
        expect(IdParamSchema.parse({ id: '123' })).toEqual({ id: '123' });
    });

    test('rejects empty string', () => {
        expect(() => IdParamSchema.parse({ id: '' })).toThrow();
    });
});

// ── EmailSchema ───────────────────────────────────────────────────────────────

describe('EmailSchema', () => {
    test('accepts a valid email', () => {
        expect(EmailSchema.parse('User@Example.COM')).toBe('user@example.com');
    });

    test('rejects invalid email', () => {
        expect(() => EmailSchema.parse('not-email')).toThrow();
    });
});

// ── PasswordSchema ────────────────────────────────────────────────────────────

describe('PasswordSchema', () => {
    test('accepts a valid password', () => {
        expect(() => PasswordSchema.parse('SecurePass1')).not.toThrow();
    });

    test('rejects password shorter than 8 chars', () => {
        expect(() => PasswordSchema.parse('Ab1')).toThrow();
    });

    test('rejects password without uppercase', () => {
        expect(() => PasswordSchema.parse('alllower1')).toThrow();
    });

    test('rejects password without number', () => {
        expect(() => PasswordSchema.parse('NoNumbers!')).toThrow();
    });

    test('rejects password longer than 128 chars', () => {
        expect(() => PasswordSchema.parse('A1' + 'a'.repeat(128))).toThrow();
    });
});
