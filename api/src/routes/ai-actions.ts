/**
 * POST /api/ai/run           — run a named agent
 * GET  /api/ai/actions       — list AiActions (filterable by entityType/entityId/status)
 * GET  /api/ai/actions/:id   — get one AiAction
 * POST /api/ai/actions/:id/approve — approve (sets status APPROVED)
 * POST /api/ai/actions/:id/reject  — reject
 * POST /api/ai/actions/:id/apply   — apply (status APPLIED; agent-specific side effect)
 * POST /api/ai/actions/:id/rollback
 */

import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { requireAuth } from '../core/auth';
import { AppError } from '../core/errors';
import { audit } from '../core/audit';
import {
    runAgent,
    approveAction,
    rejectAction,
    markApplied,
    rollbackAction,
    getPendingActions,
} from '../core/ai';

// Register agents so they self-register into the registry
import '../core/ai/agents/helpdeskTriage';
import '../core/ai/agents/customerSummary';

import prisma from '../lib/prisma';

const router = Router();

// ── Run agent ─────────────────────────────────────────────────────────────────

const RunSchema = z.object({
    agentKey: z.string().min(1),
    entityType: z.string().min(1),
    entityId: z.string().min(1),
    input: z.record(z.string(), z.unknown()).optional(),
});

router.post('/run', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const body = RunSchema.parse(req.body);
        const result = await runAgent(
            body.agentKey,
            { entityType: body.entityType, entityId: body.entityId, ...body.input },
            { userId: req.user!.sub, orgId: req.user!.orgId },
        );
        res.status(202).json(result);
    } catch (err) {
        next(err);
    }
});

// ── List actions ──────────────────────────────────────────────────────────────

router.get('/actions', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { entityType, entityId, status, limit = '50' } = req.query as Record<string, string>;
        const actions = await (prisma as any).aiAction?.findMany?.({
            where: {
                ...(entityType ? { entityType } : {}),
                ...(entityId ? { entityId } : {}),
                ...(status ? { status } : {}),
            },
            orderBy: { createdAt: 'desc' },
            take: Math.min(parseInt(limit, 10) || 50, 200),
        }) ?? [];
        res.json({ data: actions, total: actions.length });
    } catch (err) {
        next(err);
    }
});

// ── Get one ───────────────────────────────────────────────────────────────────

router.get('/actions/:id', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const action = await (prisma as any).aiAction?.findUnique?.({ where: { id: req.params.id } });
        if (!action) throw AppError.notFound('AiAction not found');
        res.json(action);
    } catch (err) {
        next(err);
    }
});

// ── Approve ───────────────────────────────────────────────────────────────────

router.post('/actions/:id/approve', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const action = await approveAction(req.params.id, req.user!.sub);
        await audit({ organizationId: req.user!.orgId, userId: req.user!.sub, action: 'ai_action.approve', model: 'AiAction', recordId: req.params.id });
        res.json(action);
    } catch (err) {
        next(err);
    }
});

// ── Reject ────────────────────────────────────────────────────────────────────

router.post('/actions/:id/reject', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const action = await rejectAction(req.params.id, req.user!.sub);
        await audit({ organizationId: req.user!.orgId, userId: req.user!.sub, action: 'ai_action.reject', model: 'AiAction', recordId: req.params.id });
        res.json(action);
    } catch (err) {
        next(err);
    }
});

// ── Apply (execute the suggestion) ───────────────────────────────────────────

router.post('/actions/:id/apply', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const action = await (prisma as any).aiAction?.findUnique?.({ where: { id: req.params.id } });
        if (!action) throw AppError.notFound('AiAction not found');
        if (action.status !== 'APPROVED') {
            throw AppError.badRequest('Action must be APPROVED before it can be applied');
        }

        // Apply is agent-specific; for now we just mark applied and let the client
        // use the output.suggestions to render the proposed changes.
        // Finance-sensitive agents must never have an auto-apply path here.
        const updated = await markApplied(req.params.id);
        await audit({ organizationId: req.user!.orgId, userId: req.user!.sub, action: 'ai_action.apply', model: 'AiAction', recordId: req.params.id });
        res.json(updated);
    } catch (err) {
        next(err);
    }
});

// ── Rollback ──────────────────────────────────────────────────────────────────

router.post('/actions/:id/rollback', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const updated = await rollbackAction(req.params.id);
        await audit({ organizationId: req.user!.orgId, userId: req.user!.sub, action: 'ai_action.rollback', model: 'AiAction', recordId: req.params.id });
        res.json(updated);
    } catch (err) {
        next(err);
    }
});

// ── Pending for an entity ─────────────────────────────────────────────────────

router.get('/pending', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { entityType, entityId } = req.query as Record<string, string>;
        const actions = await getPendingActions(entityType, entityId);
        res.json({ data: actions ?? [], total: actions?.length ?? 0 });
    } catch (err) {
        next(err);
    }
});

export default router;
