import { Router } from 'express';
import prisma from '../lib/prisma';
import { asyncHandler, getPagination, paginatedResponse } from '../lib/utils';
import { qualifyLead, markWon, createQuotationFromLead } from '../core/flow.service';
import { requireAuth } from '../core/auth';
import { crmLeadFilter } from '../core/auth/recordRules';

export const crmRoutes = Router();
crmRoutes.use(requireAuth);

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

    const recordFilter = crmLeadFilter(req.user!);
    const where: any = { active: true, ...recordFilter };
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
    const recordFilter = crmLeadFilter(req.user!);
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

    // Validate lead exists
    const lead = await prisma.crmLead.findUnique({ where: { id: leadId } });
    if (!lead) { res.status(404).json({ error: 'Lead not found' }); return; }

    const activity = await prisma.crmActivity.create({
        data: {
            leadId,
            organizationId: (req as any).user?.orgId ?? 'default',
            createdById: (req as any).user?.sub ?? 'system',
            type,
            summary,
            body,
            dueAt: dueAt ? new Date(dueAt) : null,
        },
    });
    res.status(201).json(activity);
}));

crmRoutes.patch('/activities/:id/done', asyncHandler(async (req, res) => {
    const activity = await prisma.crmActivity.update({
        where: { id: parseInt(req.params.id) },
        data: { doneAt: new Date() },
    });
    res.json(activity);
}));

crmRoutes.delete('/activities/:id', asyncHandler(async (req, res) => {
    await prisma.crmActivity.delete({ where: { id: parseInt(req.params.id) } });
    res.status(204).send();
}));

// ── CRM Analytics ───────────────────────────────────────────────────────────
crmRoutes.get('/analytics', asyncHandler(async (req, res) => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const recordFilter = crmLeadFilter(req.user!);
    const baseActive = { active: true as const, ...recordFilter };

    const [
        totalLeads,
        openOpportunities,
        newThisMonth,
        stageBreakdown,
        avgDeal,
        weightedRows,
        wonThisMonth,
        lostThisMonth,
    ] = await Promise.all([
        prisma.crmLead.count({ where: baseActive }),
        prisma.crmLead.count({ where: { ...baseActive, type: 'opportunity' } }),
        prisma.crmLead.count({ where: { createdAt: { gte: startOfMonth }, ...recordFilter } }),
        prisma.crmStage.findMany({
            orderBy: { sequence: 'asc' },
            include: {
                _count: {
                    select: {
                        leads: { where: baseActive },
                    },
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
                ...recordFilter,
                active: true,
                dateClosed: { gte: startOfMonth },
            },
        }),
        prisma.crmLead.count({
            where: {
                ...recordFilter,
                active: false,
                updatedAt: { gte: startOfMonth },
            },
        }),
    ]);

    const weightedPipeline = weightedRows.reduce(
        (sum, r) => sum + r.expectedRevenue * (r.probability / 100),
        0,
    );

    res.json({
        totalLeads,
        openOpportunities,
        newThisMonth,
        avgDealSize: Math.round((avgDeal._avg.expectedRevenue ?? 0) * 100) / 100,
        weightedPipeline: Math.round(weightedPipeline * 100) / 100,
        wonThisMonth,
        lostThisMonth,
        stageBreakdown: stageBreakdown.map(s => ({
            id: s.id,
            name: s.name,
            count: s._count.leads,
        })),
    });
}));

// ── Chatter (shared thread) ────────────────────────────────────────────────────
import { createChatterRouter } from '../core/chatter';
crmRoutes.use('/', createChatterRouter('crm.lead'));
