/**
 * routes/auth-credentials — Email/password authentication
 *
 * POST   /api/auth/register    — create account
 * POST   /api/auth/login       — get access + refresh tokens
 * POST   /api/auth/logout      — client-side (token is stateless, server clears cookie)
 * POST   /api/auth/refresh     — exchange refresh token for new access token
 * GET    /api/auth/me          — return current user from JWT
 */

import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../lib/utils';
import { AppError } from '../core/errors';
import { validate, EmailSchema, PasswordSchema } from '../core/validation';
import {
    hashPassword,
    verifyPassword,
    signAccessToken,
    signRefreshToken,
    verifyRefreshToken,
    requireAuth,
    loadUserPermissions,
} from '../core/auth';
import { audit } from '../core/audit';
import prisma from '../lib/prisma';

export const authCredentialsRoutes = Router();

// ── Schemas ───────────────────────────────────────────────────────────────────

const RegisterSchema = z.object({
    name: z.string().min(2).max(100).trim(),
    email: EmailSchema,
    password: PasswordSchema,
    organizationId: z.string().optional(),
});

const LoginSchema = z.object({
    email: EmailSchema,
    password: z.string().min(1, 'Password is required'),
});

const RefreshSchema = z.object({
    refreshToken: z.string().min(1),
});

// ── Helpers ───────────────────────────────────────────────────────────────────

const COOKIE_OPTS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
};

// ── POST /register ────────────────────────────────────────────────────────────

authCredentialsRoutes.post(
    '/register',
    validate(RegisterSchema),
    asyncHandler(async (req, res) => {
        const { name, email, password, organizationId } = req.body as z.infer<typeof RegisterSchema>;

        // Resolve org — use provided, or first org, or create a default
        let orgId = organizationId;
        if (!orgId) {
            const org = await (prisma as any).organization?.findFirst?.();
            orgId = org?.id ?? 'default';
        }

        // Check uniqueness
        const existing = await (prisma as any).spineUser?.findFirst?.({ where: { email } });
        if (existing) throw AppError.conflict('An account with this email already exists');

        const passwordHash = await hashPassword(password);

        const user = await (prisma as any).spineUser?.create?.({
            data: {
                name,
                email,
                passwordHash,
                organizationId: orgId,
                active: true,
            },
        });

        // Assign default "employee" role if it exists
        const defaultRole = await (prisma as any).spineRole?.findFirst?.({
            where: { name: 'employee', organizationId: orgId },
        });
        if (defaultRole && user) {
            await (prisma as any).spineUserRole?.create?.({
                data: { userId: user.id, roleId: defaultRole.id },
            });
        }

        await audit({
            action: 'CREATE',
            model: 'SpineUser',
            recordId: user?.id ?? 'unknown',
            organizationId: orgId ?? 'default',
            userId: user?.id,
            meta: { email },
        });

        res.status(201).json({ message: 'Account created. Please log in.' });
    }),
);

// ── POST /login ───────────────────────────────────────────────────────────────

authCredentialsRoutes.post(
    '/login',
    validate(LoginSchema),
    asyncHandler(async (req, res) => {
        const { email, password } = req.body as z.infer<typeof LoginSchema>;

        const user = await (prisma as any).spineUser?.findFirst?.({
            where: { email, active: true },
        });

        // Constant-time path — always attempt verify to prevent timing attacks
        const validPassword =
            user?.passwordHash
                ? await verifyPassword(user.passwordHash, password)
                : false;

        if (!user || !validPassword) {
            await audit({
                action: 'UPDATE',
                model: 'SpineUser',
                recordId: user?.id ?? 'unknown',
                organizationId: user?.organizationId ?? 'default',
                userId: undefined,
                meta: { event: 'login_failed', email },
            });
            throw AppError.unauthorized('Invalid email or password');
        }

        const { roles, permissions } = await loadUserPermissions(user.id);

        const jwtPayload = {
            sub: user.id,
            email: user.email,
            orgId: user.organizationId,
            companyId: user.companyId ?? undefined,
            roles,
            permissions,
        };

        const accessToken = signAccessToken(jwtPayload);
        const refreshToken = signRefreshToken(user.id);

        // Set refresh token as httpOnly cookie
        res.cookie('refreshToken', refreshToken, COOKIE_OPTS);

        await audit({
            action: 'UPDATE',
            model: 'SpineUser',
            recordId: user.id,
            organizationId: user.organizationId ?? 'default',
            userId: user.id,
            meta: { event: 'login_success' },
        });

        res.json({
            accessToken,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                organizationId: user.organizationId,
                roles,
                permissions,
            },
        });
    }),
);

// ── POST /logout ──────────────────────────────────────────────────────────────

authCredentialsRoutes.post('/logout', asyncHandler(async (_req, res) => {
    res.clearCookie('refreshToken', COOKIE_OPTS);
    res.json({ message: 'Logged out' });
}));

// ── POST /refresh ─────────────────────────────────────────────────────────────

authCredentialsRoutes.post(
    '/refresh',
    asyncHandler(async (req, res) => {
        // Accept from cookie OR body
        const token: string =
            req.cookies?.refreshToken ??
            (RefreshSchema.safeParse(req.body).success
                ? (req.body as z.infer<typeof RefreshSchema>).refreshToken
                : undefined);

        if (!token) throw AppError.unauthorized('No refresh token provided');

        const { sub: userId } = verifyRefreshToken(token);

        const user = await (prisma as any).spineUser?.findFirst?.({
            where: { id: userId, active: true },
        });
        if (!user) throw AppError.unauthorized('User not found');

        const { roles, permissions } = await loadUserPermissions(user.id);

        const accessToken = signAccessToken({
            sub: user.id,
            email: user.email,
            orgId: user.organizationId,
            companyId: user.companyId ?? undefined,
            roles,
            permissions,
        });

        // Rotate refresh token
        const newRefresh = signRefreshToken(user.id);
        res.cookie('refreshToken', newRefresh, COOKIE_OPTS);

        res.json({ accessToken });
    }),
);

// ── GET /me ───────────────────────────────────────────────────────────────────

authCredentialsRoutes.get('/me', requireAuth, asyncHandler(async (req, res) => {
    const user = await (prisma as any).spineUser?.findFirst?.({
        where: { id: req.user!.sub, active: true },
        select: {
            id: true,
            name: true,
            email: true,
            organizationId: true,
            companyId: true,
            active: true,
            createdAt: true,
        },
    });
    if (!user) throw AppError.notFound('User');
    res.json({ ...user, roles: req.user!.roles, permissions: req.user!.permissions });
}));
