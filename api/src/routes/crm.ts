import { Router, type Request } from 'express';
import prisma from '../lib/prisma';
import { asyncHandler, getPagination, paginatedResponse } from '../lib/utils';
import { qualifyLead, markWon, createQuotationFromLead } from '../core/flow.service';
import { requireAuth } from '../core/auth';
import { crmLeadFilter, crmOwnerQueryFilter, isManager } from '../core/auth/recordRules';
import { createChatterRouter } from '../core/chatter';

export const crmRoutes = Router();
crmRoutes.use(requireAuth);

function mergeCrmLeadWhere(req: Request, extra: Record<string, unknown>): Record<string, unknown> {
    const recordFilter = crmLeadFilter(req.user!);
    const ownerExtra = crmOwnerQueryFilter(req.user!, req.query.user_id);
    return { ...recordFilter, ...ownerExtra, ...extra };
}

// ── Stages ──────────────────────────────────────────────────
crmRoutes.get('/stages', asyncHandler(async (_req, res) => {
    const stages = await prisma.crmStage.findMany({ orderBy: { sequence: 'asc' }, include: { _count: { select: { leads: true } } } });
    res.json(stages);
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
    const { skip, page, limit } = getPagination(req.query);
    const type = (req.query.type as string) || undefined;
    const stageId = req.query.stage_id ? parseInt(req.query.stage_id as string) : undefined;

    const where: Record<string, unknown> = { active: true, ...mergeCrmLeadWhere(req, {}) };
    if (type) where.type = type;
    if (stageId) where.stageId = stageId;

    const [data, total] = await Promise.all([
        prisma.crmLead.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' }, include: { stage: true, partner: true, tags: true } }),
        prisma.crmLead.count({ where }),
    ]);
    res.json(paginatedResponse(data, total, page, limit));
}));

crmRoutes.get('/leads/:id', asyncHandler(async (req, res) => {
    const lead = await prisma.crmLead.findUnique({ where: { id: parseInt(req.params.id) }, include: { stage: true, partner: true, tags: true, saleOrders: true } });
    if (!lead) { res.status(404).json({ error: 'Lead not found' }); return; }
    res.json(lead);
}));

crmRoutes.post('/leads', asyncHandler(async (req, res) => {
    const lead = await prisma.crmLead.create({ data: req.body });
    res.status(201).json(lead);
}));

crmRoutes.put('/leads/:id', asyncHandler(async (req, res) => {
    const lead = await prisma.crmLead.update({ where: { id: parseInt(req.params.id) }, data: req.body });
    res.json(lead);
}));

// Move lead to stage (kanban drag)
crmRoutes.patch('/leads/:id/stage', asyncHandler(async (req, res) => {
    const lead = await prisma.crmLead.update({ where: { id: parseInt(req.params.id) }, data: { stageId: req.body.stageId } });
    res.json(lead);
}));

// Convert lead to opportunity (basic – keeps existing behaviour)
crmRoutes.post('/leads/:id/convert', asyncHandler(async (req, res) => {
    const lead = await prisma.crmLead.update({ where: { id: parseInt(req.params.id) }, data: { type: 'opportunity' } });
    res.json(lead);
}));

// Flow A – qualify a lead (raises probability, sets type=opportunity)
crmRoutes.post('/leads/:id/qualify', asyncHandler(async (req, res) => {
    const lead = await qualifyLead(parseInt(req.params.id));
    res.json(lead);
}));

// Flow A – mark opportunity as won
crmRoutes.post('/leads/:id/mark-won', asyncHandler(async (req, res) => {
    const lead = await markWon(parseInt(req.params.id));
    res.json(lead);
}));

// Mark lead as lost with an optional reason
crmRoutes.patch('/leads/:id/lost', asyncHandler(async (req, res) => {
    const { lostReason } = req.body as { lostReason?: string };
    const lead = await prisma.crmLead.update({
        where: { id: parseInt(req.params.id) },
        data: { active: false, ...(lostReason !== undefined && { lostReason }) },
    });
    res.json(lead);
}));

// Flow A – create a draft quotation (SaleOrder) from a lead/opportunity
crmRoutes.post('/leads/:id/new-quotation', asyncHandler(async (req, res) => {
    const { lines, idempotencyKey } = req.body;
    const order = await createQuotationFromLead(parseInt(req.params.id), { lines, idempotencyKey });
    res.status(201).json(order);
}));

crmRoutes.delete('/leads/:id', asyncHandler(async (req, res) => {
    await prisma.crmLead.update({ where: { id: parseInt(req.params.id) }, data: { active: false } });
    res.json({ success: true });
}));

// ── Pipeline summary ────────────────────────────────────────
crmRoutes.get('/pipeline', asyncHandler(async (req, res) => {
    const recordFilter = mergeCrmLeadWhere(req, {});
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
    const leadScope = { active: true as const, ...mergeCrmLeadWhere(req, {}) };

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
    const leadId = parseInt(req.params.id);
    const activities = await prisma.crmActivity.findMany({
        where: { leadId },
        orderBy: [{ doneAt: 'asc' }, { dueAt: 'asc' }],
    });
    res.json(activities);
}));

crmRoutes.post('/leads/:id/activities', asyncHandler(async (req, res) => {
    const leadId = parseInt(req.params.id);
    const { type, summary, body, dueAt } = req.body as {
        type: string; summary: string; body?: string; dueAt?: string;
    };

    const lead = await prisma.crmLead.findFirst({
        where: { id: leadId, ...crmLeadFilter(req.user!) },
    });
    if (!lead) { res.status(404).json({ error: 'Lead not found' }); return; }

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
    const visible = await prisma.crmLead.count({
        where: { id: activity.leadId, ...crmLeadFilter(req.user!) },
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

    const visible = await prisma.crmLead.count({
        where: { id: activity.leadId, ...crmLeadFilter(req.user!) },
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

crmRoutes.get('/analytics', asyncHandler(async (req, res) => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const scope = mergeCrmLeadWhere(req, {});
    const baseActive = { active: true as const, ...scope };

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
