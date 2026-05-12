/**
 * core/auth — Authentication service
 *
 * - Password hashing with argon2id
 * - JWT access tokens (15 min) + refresh tokens (30 days)
 * - requireAuth middleware
 * - requirePermission(key) middleware
 *
 * Environment variables:
 *   JWT_SECRET        — HS256 signing key (min 32 chars)
 *   JWT_REFRESH_SECRET — refresh signing key (min 32 chars, optional, falls back to JWT_SECRET)
 */

import { Request, Response, NextFunction } from 'express';
import * as argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import { AppError } from '../errors';
import prisma from '../../lib/prisma';

// ── Config ────────────────────────────────────────────────────────────────────

const JWT_SECRET = process.env.JWT_SECRET ?? 'change-me-in-production-32-chars-minimum';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET ?? JWT_SECRET;
const ACCESS_TOKEN_TTL = '15m';
const REFRESH_TOKEN_TTL = '30d';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface JwtPayload {
    sub: string;        // User ID (SpineUser.id)
    email: string;
    orgId: string;
    companyId?: string;
    roles: string[];
    permissions: string[];
}

// Augment Express Request to carry the decoded user
declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace Express {
        interface Request {
            user?: JwtPayload;
        }
    }
}

// ── Password hashing ──────────────────────────────────────────────────────────

/** Hash a plain-text password with argon2id */
export async function hashPassword(plain: string): Promise<string> {
    return argon2.hash(plain, {
        type: argon2.argon2id,
        memoryCost: 65536,   // 64 MiB
        timeCost: 3,
        parallelism: 1,
    });
}

/** Verify a plain-text password against an argon2id hash */
export async function verifyPassword(hash: string, plain: string): Promise<boolean> {
    try {
        return await argon2.verify(hash, plain);
    } catch {
        return false;
    }
}

// ── JWT helpers ───────────────────────────────────────────────────────────────

export function signAccessToken(payload: JwtPayload): string {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_TOKEN_TTL });
}

export function signRefreshToken(userId: string): string {
    return jwt.sign({ sub: userId }, JWT_REFRESH_SECRET, { expiresIn: REFRESH_TOKEN_TTL });
}

export function verifyAccessToken(token: string): JwtPayload {
    try {
        return jwt.verify(token, JWT_SECRET) as JwtPayload;
    } catch {
        throw AppError.unauthorized('Token is invalid or expired');
    }
}

export function verifyRefreshToken(token: string): { sub: string } {
    try {
        return jwt.verify(token, JWT_REFRESH_SECRET) as { sub: string };
    } catch {
        throw AppError.unauthorized('Refresh token is invalid or expired');
    }
}

// ── Middleware ────────────────────────────────────────────────────────────────

/**
 * requireAuth — attaches req.user from the Bearer token.
 * Throws 401 if no valid token is present.
 */
export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        next(AppError.unauthorized());
        return;
    }
    const token = authHeader.slice(7);
    try {
        req.user = verifyAccessToken(token);
        next();
    } catch (err) {
        next(err);
    }
}

/**
 * optionalAuth — attaches req.user if a valid token exists, but does NOT reject
 * unauthenticated requests. Useful for public endpoints that optionally use auth.
 */
export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
        try {
            req.user = verifyAccessToken(authHeader.slice(7));
        } catch {
            // silently ignore invalid tokens for optional auth
        }
    }
    next();
}

/**
 * requirePermission — returns a middleware that verifies the user has
 * the specified permission key in their JWT claims.
 *
 * Example:
 *   router.delete('/:id', requireAuth, requirePermission('partners.delete'), handler)
 */
export function requirePermission(key: string) {
    return (req: Request, _res: Response, next: NextFunction): void => {
        if (!req.user) {
            next(AppError.unauthorized());
            return;
        }
        const hasPerm =
            req.user.permissions.includes(key) ||
            req.user.permissions.includes('*') ||
            req.user.roles.some((r) => r === 'admin' || r === 'Administrator');
        if (!hasPerm) {
            next(AppError.forbidden(`Missing permission: ${key}`));
            return;
        }
        next();
    };
}

/**
 * requireRole — returns a middleware that verifies the user has the given role.
 */
export function requireRole(role: string) {
    return (req: Request, _res: Response, next: NextFunction): void => {
        if (!req.user) {
            next(AppError.unauthorized());
            return;
        }
        const hasPrivilegedRole = req.user.roles.some(
            (r) => r === 'admin' || r === 'Administrator',
        );
        if (!req.user.roles.includes(role) && !hasPrivilegedRole) {
            next(AppError.forbidden(`Required role: ${role}`));
            return;
        }
        next();
    };
}

// ── User permission loader ────────────────────────────────────────────────────

/**
 * Load the roles and permission keys for a SpineUser by their ID.
 * Used at login time to build the JWT payload.
 */
export async function loadUserPermissions(
    userId: string,
): Promise<{ roles: string[]; permissions: string[] }> {
    const user = await (prisma as any).spineUser?.findUnique?.({
        where: { id: userId },
        include: {
            userRoles: {
                include: {
                    role: {
                        include: { rolePermissions: { include: { permission: true } } },
                    },
                },
            },
        },
    });

    if (!user) return { roles: [], permissions: [] };

    const roles: string[] = [];
    const permSet = new Set<string>();

    for (const ur of user.userRoles ?? []) {
        if (ur.role?.key) roles.push(ur.role.key);
        for (const rp of ur.role?.rolePermissions ?? []) {
            if (rp.permission?.key) permSet.add(rp.permission.key);
        }
    }

    return { roles, permissions: Array.from(permSet) };
}
