import { Request, Response, NextFunction } from 'express';
import {
    hashPassword,
    verifyPassword,
    signAccessToken,
    verifyAccessToken,
    signRefreshToken,
    verifyRefreshToken,
    JwtPayload,
} from '../auth';
import { AppError } from '../errors';

// requireAuth/requirePermission import the module after env setup
process.env.JWT_SECRET = 'test-secret-at-least-32-characters-long';
process.env.JWT_REFRESH_SECRET = 'test-refresh-32-characters-minimum!!';

// Import middlewares after env is set
import { requireAuth, requirePermission, requireRole } from '../auth';

// ── hashPassword / verifyPassword ─────────────────────────────────────────────

describe('hashPassword() / verifyPassword()', function () {
    jest.setTimeout(30000); // argon2id is intentionally slow
    test('hashes and verifies a correct password', async () => {
        const hash = await hashPassword('MyPassword1!');
        expect(typeof hash).toBe('string');
        expect(hash).not.toBe('MyPassword1!');
        expect(await verifyPassword(hash, 'MyPassword1!')).toBe(true);
    });

    test('returns false for wrong password', async () => {
        const hash = await hashPassword('MyPassword1!');
        expect(await verifyPassword(hash, 'WrongPassword1!')).toBe(false);
    });

    test('produces different hashes for the same password (salt)', async () => {
        const h1 = await hashPassword('SamePass1');
        const h2 = await hashPassword('SamePass1');
        expect(h1).not.toBe(h2);
    });

    test('verifyPassword returns false for a malformed hash', async () => {
        expect(await verifyPassword('not-a-hash', 'anything')).toBe(false);
    });
});

// ── JWT helpers ───────────────────────────────────────────────────────────────

const PAYLOAD: JwtPayload = {
    sub: 'user-001',
    email: 'alice@example.com',
    orgId: 'org-001',
    companyId: 'co-001',
    roles: ['admin'],
    permissions: ['partners.read', 'partners.write'],
};

describe('signAccessToken() / verifyAccessToken()', () => {
    test('signs and verifies a valid access token', () => {
        const token = signAccessToken(PAYLOAD);
        const decoded = verifyAccessToken(token);

        expect(decoded.sub).toBe(PAYLOAD.sub);
        expect(decoded.email).toBe(PAYLOAD.email);
        expect(decoded.orgId).toBe(PAYLOAD.orgId);
        expect(decoded.roles).toEqual(PAYLOAD.roles);
        expect(decoded.permissions).toEqual(PAYLOAD.permissions);
    });

    test('throws AppError for a tampered token', () => {
        const token = signAccessToken(PAYLOAD) + 'tampered';
        expect(() => verifyAccessToken(token)).toThrow(AppError);
    });

    test('throws AppError for completely invalid token', () => {
        expect(() => verifyAccessToken('not.a.jwt')).toThrow(AppError);
    });
});

describe('signRefreshToken() / verifyRefreshToken()', () => {
    test('signs and verifies a refresh token', () => {
        const token = signRefreshToken('user-001');
        const decoded = verifyRefreshToken(token);
        expect(decoded.sub).toBe('user-001');
    });

    test('throws AppError for invalid refresh token', () => {
        expect(() => verifyRefreshToken('bad.token')).toThrow(AppError);
    });
});

// ── requireAuth middleware ────────────────────────────────────────────────────

function makeRes(): Response {
    return {} as Response;
}

function makeReqWithToken(token?: string): Request {
    return {
        headers: token ? { authorization: `Bearer ${token}` } : {},
        user: undefined,
    } as unknown as Request;
}

describe('requireAuth middleware', () => {
    test('attaches req.user for a valid Bearer token', () => {
        const token = signAccessToken(PAYLOAD);
        const req = makeReqWithToken(token);
        const next = jest.fn();

        requireAuth(req, makeRes(), next);

        expect(next).toHaveBeenCalledWith();
        expect(req.user).toBeDefined();
        expect(req.user!.sub).toBe(PAYLOAD.sub);
    });

    test('calls next(AppError 401) when no Authorization header', () => {
        const req = makeReqWithToken();
        const next = jest.fn();

        requireAuth(req, makeRes(), next);

        const err = (next as jest.Mock).mock.calls[0][0];
        expect(err).toBeInstanceOf(AppError);
        expect(err.status).toBe(401);
    });

    test('calls next(AppError 401) for an invalid token', () => {
        const req = makeReqWithToken('invalid.token.here');
        const next = jest.fn();

        requireAuth(req, makeRes(), next);

        const err = (next as jest.Mock).mock.calls[0][0];
        expect(err).toBeInstanceOf(AppError);
        expect(err.status).toBe(401);
    });
});

// ── requirePermission middleware ──────────────────────────────────────────────

function reqWithUser(permissions: string[], roles: string[] = []): Request {
    return {
        user: { ...PAYLOAD, permissions, roles },
        headers: {},
    } as unknown as Request;
}

describe('requirePermission()', () => {
    test('calls next() when user has the required permission', () => {
        const req = reqWithUser(['partners.read']);
        const next = jest.fn();

        requirePermission('partners.read')(req, makeRes(), next);

        expect(next).toHaveBeenCalledWith();
    });

    test('calls next() when user has wildcard *', () => {
        const req = reqWithUser(['*']);
        const next = jest.fn();

        requirePermission('any.permission')(req, makeRes(), next);

        expect(next).toHaveBeenCalledWith();
    });

    test('calls next(AppError 403) when permission is missing', () => {
        const req = reqWithUser(['partners.read']);
        const next = jest.fn();

        requirePermission('partners.delete')(req, makeRes(), next);

        const err = (next as jest.Mock).mock.calls[0][0];
        expect(err).toBeInstanceOf(AppError);
        expect(err.status).toBe(403);
    });

    test('calls next() when user has admin role but not the permission key', () => {
        const req = reqWithUser([], ['admin']);
        const next = jest.fn();

        requirePermission('settings.write')(req, makeRes(), next);

        expect(next).toHaveBeenCalledWith();
    });

    test('calls next() when user has legacy Administrator role', () => {
        const req = reqWithUser([], ['Administrator']);
        const next = jest.fn();

        requirePermission('settings.write')(req, makeRes(), next);

        expect(next).toHaveBeenCalledWith();
    });

    test('calls next(AppError 401) when req.user is absent', () => {
        const req = { user: undefined, headers: {} } as unknown as Request;
        const next = jest.fn();

        requirePermission('partners.read')(req, makeRes(), next);

        const err = (next as jest.Mock).mock.calls[0][0];
        expect(err.status).toBe(401);
    });
});

// ── requireRole middleware ────────────────────────────────────────────────────

describe('requireRole()', () => {
    test('calls next() when user has the required role', () => {
        const req = reqWithUser([], ['manager']);
        const next = jest.fn();

        requireRole('manager')(req, makeRes(), next);

        expect(next).toHaveBeenCalledWith();
    });

    test('calls next() when user is admin', () => {
        const req = reqWithUser([], ['admin']);
        const next = jest.fn();

        requireRole('any-role')(req, makeRes(), next);

        expect(next).toHaveBeenCalledWith();
    });

    test('calls next() when user has legacy Administrator role', () => {
        const req = reqWithUser([], ['Administrator']);
        const next = jest.fn();

        requireRole('any-role')(req, makeRes(), next);

        expect(next).toHaveBeenCalledWith();
    });

    test('calls next(AppError 403) when role is missing', () => {
        const req = reqWithUser([], ['viewer']);
        const next = jest.fn();

        requireRole('manager')(req, makeRes(), next);

        const err = (next as jest.Mock).mock.calls[0][0];
        expect(err.status).toBe(403);
    });
});
