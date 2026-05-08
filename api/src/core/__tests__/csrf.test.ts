import { Request, Response, NextFunction } from 'express';
import { csrfProtection } from '../../middleware/csrf';
import { AppError } from '../errors';

function makeReq(overrides: Partial<Request> = {}): Request {
    return {
        method: 'GET',
        path: '/api/partners',
        headers: {},
        ...overrides,
    } as unknown as Request;
}

function makeRes(): Response {
    return {} as Response;
}

describe('csrfProtection middleware', () => {
    test('allows GET requests without any headers', () => {
        const next = jest.fn();
        csrfProtection(makeReq({ method: 'GET' }), makeRes(), next);
        expect(next).toHaveBeenCalledWith(/* no args */);
    });

    test('allows HEAD and OPTIONS requests', () => {
        for (const method of ['HEAD', 'OPTIONS']) {
            const next = jest.fn();
            csrfProtection(makeReq({ method }), makeRes(), next);
            expect(next).toHaveBeenCalledWith();
        }
    });

    test('allows POST with valid Bearer token', () => {
        const next = jest.fn();
        csrfProtection(
            makeReq({ method: 'POST', headers: { authorization: 'Bearer eyJ.abc.xyz' } as any }),
            makeRes(),
            next,
        );
        expect(next).toHaveBeenCalledWith();
    });

    test('allows PUT with valid Bearer token', () => {
        const next = jest.fn();
        csrfProtection(
            makeReq({ method: 'PUT', headers: { authorization: 'Bearer eyJ.abc.xyz' } as any }),
            makeRes(),
            next,
        );
        expect(next).toHaveBeenCalledWith();
    });

    test('allows DELETE with valid Bearer token', () => {
        const next = jest.fn();
        csrfProtection(
            makeReq({ method: 'DELETE', headers: { authorization: 'Bearer eyJ.abc.xyz' } as any }),
            makeRes(),
            next,
        );
        expect(next).toHaveBeenCalledWith();
    });

    test('allows session-only POST with X-Requested-With: XMLHttpRequest', () => {
        const next = jest.fn();
        csrfProtection(
            makeReq({ method: 'POST', headers: { 'x-requested-with': 'XMLHttpRequest' } as any }),
            makeRes(),
            next,
        );
        expect(next).toHaveBeenCalledWith();
    });

    test('allows X-Requested-With case-insensitively', () => {
        const next = jest.fn();
        csrfProtection(
            makeReq({ method: 'POST', headers: { 'x-requested-with': 'xmlhttprequest' } as any }),
            makeRes(),
            next,
        );
        expect(next).toHaveBeenCalledWith();
    });

    test('blocks POST with no token and no X-Requested-With', () => {
        const next = jest.fn();
        csrfProtection(makeReq({ method: 'POST' }), makeRes(), next);
        const err = (next as jest.Mock).mock.calls[0][0];
        expect(err).toBeInstanceOf(AppError);
        expect(err.status).toBe(403);
    });

    test('blocks PATCH cross-site-style request', () => {
        const next = jest.fn();
        csrfProtection(makeReq({ method: 'PATCH' }), makeRes(), next);
        const err = (next as jest.Mock).mock.calls[0][0];
        expect(err.status).toBe(403);
    });

    test('skips /api/health regardless of method', () => {
        const next = jest.fn();
        csrfProtection(makeReq({ method: 'POST', path: '/api/health' }), makeRes(), next);
        expect(next).toHaveBeenCalledWith();
    });

    test('skips /metrics endpoint', () => {
        const next = jest.fn();
        csrfProtection(makeReq({ method: 'POST', path: '/metrics' }), makeRes(), next);
        expect(next).toHaveBeenCalledWith();
    });
});
