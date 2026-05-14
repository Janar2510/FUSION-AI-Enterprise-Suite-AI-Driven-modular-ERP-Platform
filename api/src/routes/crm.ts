import { Router, type Request, type Response } from 'express';
import type { Prisma } from '@prisma/client';
import prisma from '../lib/prisma';
import { asyncHandler, getPagination, paginatedResponse } from '../lib/utils';
import { qualifyLead, markWon, createQuotationFromLead } from '../core/flow.service';
import { requireAuth, type JwtPayload } from '../core/auth';
import { crmLeadFilter, crmOwnerQueryFilter, isManager } from '../core/auth/recordRules';
import { createChatterRouter } from '../core/chatter';

export const crmRoutes = Router();
crmRoutes.use(requireAuth);

function parseTeamIdParam(query: Record<string, unknown>): string | undefined {
    const raw = query.team_id ?? query.teamId;
    if (raw === undefined || raw === null || raw === '') return undefined;
    const s = typeof raw === 'string' ? raw.trim() : String(raw).trim();
    return s || undefined;
}

function httpError(status: number, message: string): Error & { status: number } {
    return Object.assign(new Error(message), { status });
}

/**
 * CRM lead visibility: org + role filter, optional `user_id` drill-down, optional `team_id` (all leads in team for members/managers).
 */
async function buildCrmLeadScopeWhere(
    user: JwtPayload,
    query: Record<string, unknown>,
): Promise<Prisma.CrmLeadWhereInput> {
    const teamId = parseTeamIdParam(query);
    const uidRaw = query.user_id ?? query.userId;
    const hasUserFilter =
        uidRaw !== undefined && uidRaw !== null && String(uidRaw).trim() !== '';
    const ownerClause = crmOwnerQueryFilter(user, uidRaw);

    if (hasUserFilter && ownerClause === null && !isManager(user)) {
        throw httpError(403, 'Forbidden');
    }

    const orgScope: Prisma.CrmLeadWhereInput = { organizationId: user.orgId };

    if (!teamId) {
        const andParts: Prisma.CrmLeadWhereInput[] = [];
        const rf = crmLeadFilter(user);
        if (Object.keys(rf).length > 0) andParts.push(rf);
        if (ownerClause && Object.keys(ownerClause).length > 0) andParts.push(ownerClause);
        if (andParts.length === 0) return orgScope;
        if (andParts.length === 1) return { ...orgScope, ...andParts[0] };
        return { ...orgScope, AND: andParts };
    }

    const team = await prisma.crmTeam.findFirst({
        where: { id: teamId, organizationId: user.orgId },
        include: { members: { where: { userId: user.sub } } },
    });
    if (!team) throw httpError(404, 'Team not found');
    if (!isManager(user) && team.members.length === 0) throw httpError(403, 'Forbidden');

    const andParts: Prisma.CrmLeadWhereInput[] = [{ teamId: team.id }];
    if (ownerClause && Object.keys(ownerClause).length > 0) andParts.push(ownerClause);
    if (andParts.length === 1) return { ...orgScope, ...andParts[0] };
    return { ...orgScope, AND: andParts };
}

async function crmLeadScope(req: Request): Promise<Prisma.CrmLeadWhereInput> {
    return buildCrmLeadScopeWhere(req.user!, req.query as Record<string, unknown>);
}

function handleScopeError(res: Response, e: unknown): boolean {
    if (
        e &&
        typeof e === 'object' &&
        'status' in e &&
        typeof (e as { status: unknown }).status === 'number'
    ) {
        const err = e as Error & { status: number };
        res.status(err.status).json({ error: err.message });
        return true;
    }
    return false;
}

async function resolveTeamIdOnWrite(user: JwtPayload, teamIdRaw: unknown): Promise<string | null | undefined> {
    if (teamIdRaw === undefined) return undefined;
    if (teamIdRaw === null || teamIdRaw === '') return null;
    const id = String(teamIdRaw).trim();
    if (!id || id === 'null') return null;
    const team = await prisma.crmTeam.findFirst({
        where: { id, organizationId: user.orgId },
        include: { members: { where: { userId: user.sub } } },
    });
    if (!team) throw httpError(404, 'Team not found');
    if (!isManager(user) && team.members.length === 0) throw httpError(403, 'Forbidden');
    return team.id;
}

// ── Teams (CRM Team Manager scope via `team_id` on list routes) ─────────────
crmRoutes.get('/teams', asyncHandler(async (req, res) => {
    const user = req.user!;
    const teams = await prisma.crmTeam.findMany({
        where: isManager(user)
            ? { organizationId: user.orgId }
            : { organizationId: user.orgId, members: { some: { userId: user.sub } } },
        include: {
            _count: { select: { leads: true } },
            members: {
                include: { user: { select: { id: true, name: true, email: true } } },
            },
        },
        orderBy: { name: 'asc' },
    });
    res.json(teams);
}));

crmRoutes.post('/teams', asyncHandler(async (req, res) => {
    if (!isManager(req.user!)) {
        res.status(403).json({ error: 'Only CRM managers can create teams' });
        return;
    }
    const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
    if (!name) {
        res.status(400).json({ error: 'name is required' });
        return;
    }
    const team = await prisma.crmTeam.create({
        data: { organizationId: req.user!.orgId, name },
    });
    res.status(201).json(team);
}));

// ── Stages ──────────────────────────────────────────────────
crmRoutes.get('/stages', asyncHandler(async (_req, res) => {
    const stages = await prisma.crmStage.findMany({
        orderBy: { sequence: 'asc' },
        include: { _count: { select: { leads: true } } },
    });
    res.json(stages);
}));

/** Create pipeline stage (managers / admins). */
crmRoutes.post('/stages', asyncHandler(async (req, res) => {
    if (!isManager(req.user!)) {
        res.status(403).json({ error: 'Only CRM managers can create stages' });
        return;
    }
    const body = req.body as { name?: string; sequence?: number };
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    if (!name) {
        res.status(400).json({ error: 'name is required' });
        return;
    }
    let sequence = 10;
    if (body.sequence !== undefined) {
        const seq = typeof body.sequence === 'number' ? body.sequence : parseInt(String(body.sequence), 10);
        if (!Number.isFinite(seq)) {
            res.status(400).json({ error: 'sequence must be a number' });
            return;
        }
        sequence = seq;
    } else {
        const agg = await prisma.crmStage.aggregate({ _max: { sequence: true } });
        sequence = (agg._max.sequence ?? 0) + 10;
    }
    const stage = await prisma.crmStage.create({
        data: { name, sequence, foldedKanban: false },
    });
    res.status(201).json(stage);
}));

/** Delete stage; when leads exist, require `move_to_stage_id` in JSON body. */
crmRoutes.delete('/stages/:id', asyncHandler(async (req, res) => {
    if (!isManager(req.user!)) {
        res.status(403).json({ error: 'Only CRM managers can delete stages' });
        return;
    }
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
        res.status(400).json({ error: 'Invalid stage id' });
        return;
    }
    const moveToRaw = (req.body as { move_to_stage_id?: unknown })?.move_to_stage_id;
    const moveTo =
        moveToRaw === undefined || moveToRaw === null ? null : parseInt(String(moveToRaw), 10);

    const existing = await prisma.crmStage.findUnique({
        where: { id },
        include: { _count: { select: { leads: true } } },
    });
    if (!existing) {
        res.status(404).json({ error: 'Stage not found' });
        return;
    }

    if (existing._count.leads > 0) {
        if (moveTo === null || Number.isNaN(moveTo)) {
            res.status(400).json({
                error: 'move_to_stage_id required when stage has leads',
                leadCount: existing._count.leads,
            });
            return;
        }
        if (moveTo === id) {
            res.status(400).json({ error: 'move_to_stage_id must differ from deleted stage' });
            return;
        }
        const target = await prisma.crmStage.findUnique({ where: { id: moveTo } });
        if (!target) {
            res.status(404).json({ error: 'Target stage not found' });
            return;
        }
        await prisma.crmLead.updateMany({ where: { stageId: id }, data: { stageId: moveTo } });
    }

    await prisma.crmStage.delete({ where: { id } });
    res.status(204).send();
}));

/** Update pipeline stage (name, order, folded in kanban). */
crmRoutes.patch('/stages/:id', asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
        res.status(400).json({ error: 'Invalid stage id' });
        return;
    }
    const body = req.body as { name?: string; sequence?: number; foldedKanban?: boolean };
    const data: { name?: string; sequence?: number; foldedKanban?: boolean } = {};
    if (typeof body.name === 'string' && body.name.trim()) {
        data.name = body.name.trim();
    }
    if (body.sequence !== undefined) {
        const seq = typeof body.sequence === 'number' ? body.sequence : parseInt(String(body.sequence), 10);
        if (!Number.isFinite(seq)) {
            res.status(400).json({ error: 'sequence must be a number' });
            return;
        }
        data.sequence = seq;
    }
    if (typeof body.foldedKanban === 'boolean') {
        data.foldedKanban = body.foldedKanban;
    }
    if (Object.keys(data).length === 0) {
        res.status(400).json({ error: 'No valid fields to update' });
        return;
    }
    try {
        const stage = await prisma.crmStage.update({ where: { id }, data });
        res.json(stage);
    } catch {
        res.status(404).json({ error: 'Stage not found' });
    }
}));

// ── Leads / Opportunities ───────────────────────────────────
crmRoutes.get('/leads', asyncHandler(async (req, res) => {
    let scope: Prisma.CrmLeadWhereInput;
    try {
        scope = await crmLeadScope(req);
    } catch (e: unknown) {
        if (handleScopeError(res, e)) return;
        throw e;
    }
    const { skip, page, limit } = getPagination(req.query);
    const type = (req.query.type as string) || undefined;
    const stageId = req.query.stage_id ? parseInt(req.query.stage_id as string, 10) : undefined;

    const where: Prisma.CrmLeadWhereInput = { active: true, ...scope };
    if (type) where.type = type;
    if (stageId && !Number.isNaN(stageId)) where.stageId = stageId;

    const [data, total] = await Promise.all([
        prisma.crmLead.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: { stage: true, partner: true, tags: true },
        }),
        prisma.crmLead.count({ where }),
    ]);
    res.json(paginatedResponse(data, total, page, limit));
}));

crmRoutes.get('/leads/:id', asyncHandler(async (req, res) => {
    let scope: Prisma.CrmLeadWhereInput;
    try {
        scope = await crmLeadScope(req);
    } catch (e: unknown) {
        if (handleScopeError(res, e)) return;
        throw e;
    }
    const lead = await prisma.crmLead.findFirst({
        where: { id: parseInt(req.params.id, 10), ...scope },
        include: { stage: true, partner: true, tags: true, saleOrders: true },
    });
    if (!lead) {
        res.status(404).json({ error: 'Lead not found' });
        return;
    }
    res.json(lead);
}));

crmRoutes.post('/leads', asyncHandler(async (req, res) => {
    const user = req.user!;
    const body = { ...(req.body as Record<string, unknown>) };
    try {
        if ('teamId' in body) {
            body.teamId = await resolveTeamIdOnWrite(user, body.teamId);
        }
        if (body.organizationId === undefined || body.organizationId === null || body.organizationId === '') {
            body.organizationId = user.orgId;
        }
    } catch (e: unknown) {
        if (handleScopeError(res, e)) return;
        throw e;
    }
    const lead = await prisma.crmLead.create({
        data: body as Prisma.CrmLeadUncheckedCreateInput,
    });
    res.status(201).json(lead);
}));

crmRoutes.put('/leads/:id', asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id, 10);
    let scope: Prisma.CrmLeadWhereInput;
    try {
        scope = await crmLeadScope(req);
    } catch (e: unknown) {
        if (handleScopeError(res, e)) return;
        throw e;
    }
    const existing = await prisma.crmLead.findFirst({ where: { id, ...scope } });
    if (!existing) {
        res.status(404).json({ error: 'Lead not found' });
        return;
    }
    const user = req.user!;
    const body = { ...(req.body as Record<string, unknown>) };
    try {
        if ('teamId' in body) {
            body.teamId = await resolveTeamIdOnWrite(user, body.teamId);
        }
    } catch (e: unknown) {
        if (handleScopeError(res, e)) return;
        throw e;
    }
    const lead = await prisma.crmLead.update({
        where: { id },
        data: body as Prisma.CrmLeadUncheckedUpdateInput,
    });
    res.json(lead);
}));

// Move lead to stage (kanban drag)
crmRoutes.patch('/leads/:id/stage', asyncHandler(async (req, res) => {
    let scope: Prisma.CrmLeadWhereInput;
    try {
        scope = await crmLeadScope(req);
    } catch (e: unknown) {
        if (handleScopeError(res, e)) return;
        throw e;
    }
    const id = parseInt(req.params.id, 10);
    const n = await prisma.crmLead.count({ where: { id, ...scope } });
    if (!n) {
        res.status(404).json({ error: 'Lead not found' });
        return;
    }
    const lead = await prisma.crmLead.update({ where: { id }, data: { stageId: req.body.stageId } });
    res.json(lead);
}));

// Convert lead to opportunity (basic – keeps existing behaviour)
crmRoutes.post('/leads/:id/convert', asyncHandler(async (req, res) => {
    let scope: Prisma.CrmLeadWhereInput;
    try {
        scope = await crmLeadScope(req);
    } catch (e: unknown) {
        if (handleScopeError(res, e)) return;
        throw e;
    }
    const id = parseInt(req.params.id, 10);
    const n = await prisma.crmLead.count({ where: { id, ...scope } });
    if (!n) {
        res.status(404).json({ error: 'Lead not found' });
        return;
    }
    const lead = await prisma.crmLead.update({ where: { id }, data: { type: 'opportunity' } });
    res.json(lead);
}));

// Flow A – qualify a lead (raises probability, sets type=opportunity)
crmRoutes.post('/leads/:id/qualify', asyncHandler(async (req, res) => {
    const lead = await qualifyLead(parseInt(req.params.id, 10));
    res.json(lead);
}));

// Flow A – mark opportunity as won
crmRoutes.post('/leads/:id/mark-won', asyncHandler(async (req, res) => {
    const lead = await markWon(parseInt(req.params.id, 10));
    res.json(lead);
}));

// Mark lead as lost with an optional reason
crmRoutes.patch('/leads/:id/lost', asyncHandler(async (req, res) => {
    const { lostReason } = req.body as { lostReason?: string };
    const lead = await prisma.crmLead.update({
        where: { id: parseInt(req.params.id, 10) },
        data: { active: false, ...(lostReason !== undefined && { lostReason }) },
    });
    res.json(lead);
}));

// Flow A – create a draft quotation (SaleOrder) from a lead/opportunity
crmRoutes.post('/leads/:id/new-quotation', asyncHandler(async (req, res) => {
    const { lines, idempotencyKey } = req.body;
    const order = await createQuotationFromLead(parseInt(req.params.id, 10), { lines, idempotencyKey });
    res.status(201).json(order);
}));

crmRoutes.delete('/leads/:id', asyncHandler(async (req, res) => {
    await prisma.crmLead.update({ where: { id: parseInt(req.params.id, 10) }, data: { active: false } });
    res.json({ success: true });
}));

// ── Pipeline summary ────────────────────────────────────────
crmRoutes.get('/pipeline', asyncHandler(async (req, res) => {
    let recordFilter: Prisma.CrmLeadWhereInput;
    try {
        recordFilter = await crmLeadScope(req);
    } catch (e: unknown) {
        if (handleScopeError(res, e)) return;
        throw e;
    }
    const now = new Date();
    const stages = await prisma.crmStage.findMany({
        orderBy: { sequence: 'asc' },
        include: {
            leads: {
                where: { active: true, ...recordFilter },
                include: {
                    partner: true,
                    activities: {
                        where: { doneAt: null },
                        select: { dueAt: true },
                    },
                },
                orderBy: { createdAt: 'desc' },
            },
        },
    });

    const body = stages.map(stage => ({
        ...stage,
        leads: stage.leads.map(lead => {
            const openActs = lead.activities;
            let overdueCount = 0;
            let nextDueAt: string | null = null;
            let minFuture: Date | null = null;
            for (const a of openActs) {
                if (!a.dueAt) continue;
                if (a.dueAt < now) overdueCount++;
                else if (!minFuture || a.dueAt < minFuture) minFuture = a.dueAt;
            }
            if (minFuture) nextDueAt = minFuture.toISOString();
            const { activities: _pipelineActivities, ...rest } = lead;
            return {
                ...rest,
                activitySummary: {
                    openCount: openActs.length,
                    overdueCount,
                    nextDueAt,
                },
            };
        }),
    }));

    res.json(body);
}));

// ── CRM Activities (calls, emails, meetings) ────────────────────────────────

/** Open activities with dueAt in [from, to], scoped to visible leads (same as pipeline). */
crmRoutes.get('/activities/calendar', asyncHandler(async (req, res) => {
    let scope: Prisma.CrmLeadWhereInput;
    try {
        scope = await crmLeadScope(req);
    } catch (e: unknown) {
        if (handleScopeError(res, e)) return;
        throw e;
    }
    const leadScope: Prisma.CrmLeadWhereInput = { active: true, ...scope };

    const now = new Date();
    const defaultFrom = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    const defaultTo = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const parseBound = (q: unknown, fallback: Date): Date => {
        if (typeof q !== 'string' || Number.isNaN(Date.parse(q))) return fallback;
        return new Date(q);
    };

    let from = parseBound(req.query.from, defaultFrom);
    let to = parseBound(req.query.to, defaultTo);
    if (from > to) {
        const t = from;
        from = to;
        to = t;
    }

    const activities = await prisma.crmActivity.findMany({
        where: {
            doneAt: null,
            dueAt: { not: null, gte: from, lte: to },
            lead: { is: leadScope },
        },
        orderBy: [{ dueAt: 'asc' }, { id: 'asc' }],
        include: { lead: { select: { id: true, name: true } } },
    });

    res.json(activities);
}));

crmRoutes.get('/leads/:id/activities', asyncHandler(async (req, res) => {
    const leadId = parseInt(req.params.id, 10);
    const activities = await prisma.crmActivity.findMany({
        where: { leadId },
        orderBy: [{ doneAt: 'asc' }, { dueAt: 'asc' }],
    });
    res.json(activities);
}));

crmRoutes.post('/leads/:id/activities', asyncHandler(async (req, res) => {
    const leadId = parseInt(req.params.id, 10);
    let scope: Prisma.CrmLeadWhereInput;
    try {
        scope = await crmLeadScope(req);
    } catch (e: unknown) {
        if (handleScopeError(res, e)) return;
        throw e;
    }
    const { type, summary, body, dueAt } = req.body as {
        type: string; summary: string; body?: string; dueAt?: string;
    };

    const lead = await prisma.crmLead.findFirst({
        where: { id: leadId, ...scope },
    });
    if (!lead) {
        res.status(404).json({ error: 'Lead not found' });
        return;
    }

    const orgId = req.user?.orgId ?? 'default';
    const createdById = req.user?.sub ?? 'system';
    const due = dueAt && String(dueAt).trim() ? new Date(String(dueAt)) : null;
    const hasValidDue = due !== null && !Number.isNaN(due!.getTime());

    const activity = await prisma.$transaction(async (tx) => {
        const act = await tx.crmActivity.create({
            data: {
                leadId,
                organizationId: orgId,
                createdById,
                type,
                summary,
                body,
                dueAt: hasValidDue ? due : null,
            },
        });

        if (hasValidDue && due) {
            const start = new Date(due);
            if (start.getUTCHours() === 0 && start.getUTCMinutes() === 0 && start.getUTCSeconds() === 0) {
                start.setUTCHours(9, 0, 0, 0);
            }
            const stop = new Date(start.getTime() + 60 * 60 * 1000);
            const ev = await tx.calendarEvent.create({
                data: {
                    name: `[CRM] ${lead.name}: ${summary}`,
                    description: `crmActivityId=${act.id}; leadId=${leadId}`,
                    start,
                    stop,
                    allday: false,
                },
            });
            return tx.crmActivity.update({
                where: { id: act.id },
                data: { calendarEventId: ev.id },
            });
        }

        return act;
    });

    res.status(201).json(activity);
}));

crmRoutes.patch('/activities/:id/done', asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id, 10);
    const activity = await prisma.crmActivity.findUnique({ where: { id } });
    if (!activity) {
        res.status(404).json({ error: 'Activity not found' });
        return;
    }
    let scope: Prisma.CrmLeadWhereInput;
    try {
        scope = await crmLeadScope(req);
    } catch (e: unknown) {
        if (handleScopeError(res, e)) return;
        throw e;
    }
    const visible = await prisma.crmLead.count({
        where: { id: activity.leadId, ...scope },
    });
    if (!visible) {
        res.status(404).json({ error: 'Activity not found' });
        return;
    }
    const updated = await prisma.crmActivity.update({
        where: { id },
        data: { doneAt: new Date() },
    });
    res.json(updated);
}));

crmRoutes.delete('/activities/:id', asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
        res.status(400).json({ error: 'Invalid activity id' });
        return;
    }

    const activity = await prisma.crmActivity.findUnique({ where: { id } });
    if (!activity) {
        res.status(404).json({ error: 'Activity not found' });
        return;
    }

    let scope: Prisma.CrmLeadWhereInput;
    try {
        scope = await crmLeadScope(req);
    } catch (e: unknown) {
        if (handleScopeError(res, e)) return;
        throw e;
    }

    const visible = await prisma.crmLead.count({
        where: { id: activity.leadId, ...scope },
    });
    if (!visible) {
        res.status(404).json({ error: 'Activity not found' });
        return;
    }

    await prisma.$transaction(async (tx) => {
        if (activity.calendarEventId) {
            await tx.calendarEvent.deleteMany({ where: { id: activity.calendarEventId } });
        }
        await tx.crmActivity.delete({ where: { id } });
    });
    res.status(204).send();
}));

// ── CRM Analytics ───────────────────────────────────────────────────────────
crmRoutes.get('/salespeople', asyncHandler(async (req, res) => {
    if (!isManager(req.user!)) {
        res.status(403).json({ error: 'Only CRM managers and admins can list salespeople' });
        return;
    }
    const users = await prisma.spineUser.findMany({
        where: { organizationId: req.user!.orgId, active: true },
        select: { id: true, name: true, email: true },
        orderBy: { name: 'asc' },
    });
    res.json(users);
}));

/** Per-stage funnel / forecast: counts, pipeline, weighted value, avg probability, 30d deadline bucket. */
crmRoutes.get('/forecast', asyncHandler(async (req, res) => {
    let scope: Prisma.CrmLeadWhereInput;
    try {
        scope = await crmLeadScope(req);
    } catch (e: unknown) {
        if (handleScopeError(res, e)) return;
        throw e;
    }
    const baseActive: Prisma.CrmLeadWhereInput = { active: true, ...scope };

    const now = new Date();
    const in30 = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const stages = await prisma.crmStage.findMany({
        orderBy: { sequence: 'asc' },
        select: {
            id: true,
            name: true,
            sequence: true,
            leads: {
                where: baseActive,
                select: {
                    type: true,
                    expectedRevenue: true,
                    probability: true,
                    dateDeadline: true,
                },
            },
        },
    });

    let weightedPipeline = 0;
    const funnelStages = stages.map(s => {
        const rows = s.leads;
        const opportunityCount = rows.filter(l => l.type === 'opportunity').length;
        const pipelineValue = rows.reduce((sum, l) => sum + l.expectedRevenue, 0);
        const stageWeighted = rows.reduce((sum, l) => sum + l.expectedRevenue * (l.probability / 100), 0);
        weightedPipeline += stageWeighted;
        const avgProbability =
            rows.length > 0 ? rows.reduce((sum, l) => sum + l.probability, 0) / rows.length : 0;
        const closingRows = rows.filter(
            l =>
                l.dateDeadline != null &&
                l.dateDeadline >= now &&
                l.dateDeadline <= in30,
        );
        const closingWithin30DaysCount = closingRows.length;
        const closingWithin30DaysValue = closingRows.reduce((sum, l) => sum + l.expectedRevenue, 0);
        const closingWithin30DaysWeighted = closingRows.reduce(
            (sum, l) => sum + l.expectedRevenue * (l.probability / 100),
            0,
        );
        return {
            stageId: s.id,
            name: s.name,
            sequence: s.sequence,
            leadCount: rows.length,
            opportunityCount,
            pipelineValue: Math.round(pipelineValue * 100) / 100,
            weightedPipeline: Math.round(stageWeighted * 100) / 100,
            avgProbability: Math.round(avgProbability * 10) / 10,
            closingWithin30DaysCount,
            closingWithin30DaysValue: Math.round(closingWithin30DaysValue * 100) / 100,
            closingWithin30DaysWeighted: Math.round(closingWithin30DaysWeighted * 100) / 100,
        };
    });

    res.json({
        weightedPipeline: Math.round(weightedPipeline * 100) / 100,
        stages: funnelStages,
    });
}));

crmRoutes.get('/analytics', asyncHandler(async (req, res) => {
    let scope: Prisma.CrmLeadWhereInput;
    try {
        scope = await crmLeadScope(req);
    } catch (e: unknown) {
        if (handleScopeError(res, e)) return;
        throw e;
    }
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const baseActive: Prisma.CrmLeadWhereInput = { active: true, ...scope };

    const trendFrom = new Date(now.getFullYear(), now.getMonth() - 11, 1);

    const monthKeys: string[] = [];
    for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        monthKeys.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    }

    const [
        totalLeads,
        openOpportunities,
        newThisMonth,
        stageRows,
        avgDeal,
        weightedRows,
        wonThisMonth,
        lostThisMonth,
        wonTrendRows,
        lostTrendRows,
        ownerLeads,
    ] = await Promise.all([
        prisma.crmLead.count({ where: baseActive }),
        prisma.crmLead.count({ where: { ...baseActive, type: 'opportunity' } }),
        prisma.crmLead.count({ where: { createdAt: { gte: startOfMonth }, ...scope } }),
        prisma.crmStage.findMany({
            orderBy: { sequence: 'asc' },
            include: {
                leads: {
                    where: baseActive,
                    select: { expectedRevenue: true, probability: true },
                },
            },
        }),
        prisma.crmLead.aggregate({
            where: { ...baseActive, expectedRevenue: { gt: 0 } },
            _avg: { expectedRevenue: true },
        }),
        prisma.crmLead.findMany({
            where: { ...baseActive, expectedRevenue: { gt: 0 } },
            select: { expectedRevenue: true, probability: true },
        }),
        prisma.crmLead.count({
            where: {
                ...scope,
                active: true,
                dateClosed: { gte: startOfMonth },
            },
        }),
        prisma.crmLead.count({
            where: {
                ...scope,
                active: false,
                updatedAt: { gte: startOfMonth },
            },
        }),
        prisma.crmLead.findMany({
            where: { ...scope, active: true, dateClosed: { gte: trendFrom } },
            select: { dateClosed: true },
        }),
        prisma.crmLead.findMany({
            where: { ...scope, active: false, updatedAt: { gte: trendFrom } },
            select: { updatedAt: true },
        }),
        prisma.crmLead.findMany({
            where: baseActive,
            select: { userId: true, expectedRevenue: true, probability: true },
        }),
    ]);

    const weightedPipeline = weightedRows.reduce(
        (sum, r) => sum + r.expectedRevenue * (r.probability / 100),
        0,
    );

    const wonByMonth = new Map(monthKeys.map(k => [k, 0]));
    const lostByMonth = new Map(monthKeys.map(k => [k, 0]));
    for (const r of wonTrendRows) {
        if (!r.dateClosed) continue;
        const d = r.dateClosed;
        const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        if (wonByMonth.has(k)) wonByMonth.set(k, (wonByMonth.get(k) ?? 0) + 1);
    }
    for (const r of lostTrendRows) {
        const d = r.updatedAt;
        const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        if (lostByMonth.has(k)) lostByMonth.set(k, (lostByMonth.get(k) ?? 0) + 1);
    }
    const wonLostTrend = monthKeys.map(month => ({
        month,
        won: wonByMonth.get(month) ?? 0,
        lost: lostByMonth.get(month) ?? 0,
    }));

    const ownerAgg = new Map<string | null, { count: number; value: number; weighted: number }>();
    for (const l of ownerLeads) {
        const key = l.userId ?? null;
        const cur = ownerAgg.get(key) ?? { count: 0, value: 0, weighted: 0 };
        cur.count += 1;
        cur.value += l.expectedRevenue;
        cur.weighted += l.expectedRevenue * (l.probability / 100);
        ownerAgg.set(key, cur);
    }
    const ownerIds = [...ownerAgg.keys()].filter((id): id is string => id !== null);
    const users = ownerIds.length
        ? await prisma.spineUser.findMany({
            where: { id: { in: ownerIds } },
            select: { id: true, name: true, email: true },
        })
        : [];
    const userMap = new Map(users.map(u => [u.id, u]));
    const revenueByOwner = [...ownerAgg.entries()]
        .map(([userId, s]) => ({
            userId,
            name: userId ? userMap.get(userId)?.name ?? null : 'Unassigned',
            email: userId ? userMap.get(userId)?.email ?? null : null,
            leadCount: s.count,
            pipelineValue: Math.round(s.value * 100) / 100,
            weightedPipeline: Math.round(s.weighted * 100) / 100,
        }))
        .sort((a, b) => b.weightedPipeline - a.weightedPipeline);

    const stageBreakdown = stageRows.map(s => {
        const leads = s.leads;
        const count = leads.length;
        const pipelineValue = leads.reduce((sum, l) => sum + l.expectedRevenue, 0);
        const weighted = leads.reduce((sum, l) => sum + l.expectedRevenue * (l.probability / 100), 0);
        return {
            id: s.id,
            name: s.name,
            count,
            pipelineValue: Math.round(pipelineValue * 100) / 100,
            weightedPipeline: Math.round(weighted * 100) / 100,
        };
    });

    res.json({
        totalLeads,
        openOpportunities,
        newThisMonth,
        avgDealSize: Math.round((avgDeal._avg.expectedRevenue ?? 0) * 100) / 100,
        weightedPipeline: Math.round(weightedPipeline * 100) / 100,
        wonThisMonth,
        lostThisMonth,
        stageBreakdown,
        wonLostTrend,
        revenueByOwner,
    });
}));

crmRoutes.use('/', createChatterRouter('crm.lead'));
