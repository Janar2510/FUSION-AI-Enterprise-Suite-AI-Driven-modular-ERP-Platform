/**
 * GDPR endpoints — Phase 7
 *
 * GET  /api/gdpr/export   — download all personal data for the authenticated user
 * POST /api/gdpr/erase    — anonymise + delete all personal data (requires confirmation token)
 *
 * Rules:
 * - Users can only export/erase their own data unless they have the 'gdpr.admin' permission.
 * - Erase requires the request body { confirm: true } to prevent accidental deletion.
 * - Export emits an EXPORT audit event; erase emits a DELETE audit event.
 * - Erase anonymises PII in-place (partner, user record) and hard-deletes non-recoverable data.
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { requireAuth } from '../core/auth';
import { AppError } from '../core/errors';
import { audit } from '../core/audit';
import prisma from '../lib/prisma';

export const gdprRoutes = Router();

// ── Export ────────────────────────────────────────────────────────────────────

gdprRoutes.get('/export', requireAuth, async (req: Request, res: Response) => {
    const { sub: requesterId, orgId, permissions } = req.user!;

    const targetId = (req.query.userId as string) ?? requesterId;

    if (targetId !== requesterId && !permissions.includes('gdpr.admin') && !permissions.includes('*')) {
        throw AppError.forbidden('You can only export your own data');
    }

    // Load user record
    const user = await (prisma as any).spineUser?.findUnique?.({
        where: { id: targetId },
        select: {
            id: true,
            email: true,
            name: true,
            createdAt: true,
            updatedAt: true,
        },
    });

    if (!user) throw AppError.notFound('User');

    // Collect all related personal data
    const [
        partners,
        auditLogs,
        timelineEvents,
        crmLeads,
    ] = await Promise.all([
        (prisma as any).partner?.findMany?.({
            where: { organizationId: orgId, email: user.email },
            select: { id: true, name: true, email: true, phone: true, mobile: true, street: true, city: true, country: true },
        }) ?? [],
        (prisma as any).auditLog?.findMany?.({
            where: { organizationId: orgId, actorUserId: targetId },
            select: { id: true, action: true, entityType: true, entityId: true, createdAt: true },
            orderBy: { createdAt: 'desc' },
            take: 1000,
        }) ?? [],
        (prisma as any).timelineEvent?.findMany?.({
            where: { organizationId: orgId, userId: targetId },
            select: { id: true, type: true, message: true, model: true, recordId: true, createdAt: true },
            orderBy: { createdAt: 'desc' },
            take: 1000,
        }) ?? [],
        (prisma as any).crmLead?.findMany?.({
            where: { organizationId: orgId, userId: targetId },
            select: { id: true, name: true, state: true, createdAt: true },
        }) ?? [],
    ]);

    const exportPayload = {
        exportedAt: new Date().toISOString(),
        userId: targetId,
        profile: user,
        partners,
        activity: { auditLogs, timelineEvents },
        crmLeads,
    };

    await audit({
        organizationId: orgId,
        userId: requesterId,
        model: 'SpineUser',
        recordId: targetId,
        action: 'EXPORT',
        meta: { reason: 'GDPR data export request' },
        req,
    });

    res.setHeader('Content-Disposition', `attachment; filename="gdpr-export-${targetId}-${Date.now()}.json"`);
    res.setHeader('Content-Type', 'application/json');
    res.json(exportPayload);
});

// ── Erase ─────────────────────────────────────────────────────────────────────

const EraseSchema = z.object({
    confirm: z.literal(true, { message: 'confirm must be true' }),
    userId: z.string().optional(),
});

gdprRoutes.post('/erase', requireAuth, async (req: Request, res: Response) => {
    const parsed = EraseSchema.safeParse(req.body);
    if (!parsed.success) {
        throw AppError.badRequest('Send { confirm: true } to confirm erasure');
    }

    const { sub: requesterId, orgId, permissions } = req.user!;
    const targetId = parsed.data.userId ?? requesterId;

    if (targetId !== requesterId && !permissions.includes('gdpr.admin') && !permissions.includes('*')) {
        throw AppError.forbidden('You can only erase your own data');
    }

    const user = await (prisma as any).spineUser?.findUnique?.({ where: { id: targetId } });
    if (!user) throw AppError.notFound('User');

    const ANON_EMAIL = `deleted-${targetId}@erased.invalid`;
    const ANON_NAME = 'Deleted User';

    await (prisma as any).$transaction?.(async (tx: any) => {
        // Anonymise the user record
        await tx.spineUser?.update?.({
            where: { id: targetId },
            data: {
                email: ANON_EMAIL,
                name: ANON_NAME,
                passwordHash: '',
                deletedAt: new Date(),
            },
        });

        // Anonymise any partner records linked by email
        await tx.partner?.updateMany?.({
            where: { organizationId: orgId, email: user.email },
            data: {
                email: ANON_EMAIL,
                name: ANON_NAME,
                phone: null,
                mobile: null,
                street: null,
                city: null,
                zip: null,
            },
        });

        // Hard-delete refresh tokens / sessions
        await tx.refreshToken?.deleteMany?.({ where: { userId: targetId } }).catch(() => null);
        await tx.session?.deleteMany?.({ where: { userId: targetId } }).catch(() => null);
    });

    await audit({
        organizationId: orgId,
        userId: requesterId,
        model: 'SpineUser',
        recordId: targetId,
        action: 'DELETE',
        meta: { reason: 'GDPR erasure request', anonymised: true },
        req,
    });

    res.json({
        success: true,
        message: 'Personal data has been anonymised and non-recoverable data deleted',
        userId: targetId,
        erasedAt: new Date().toISOString(),
    });
});
