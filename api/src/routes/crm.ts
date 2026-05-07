import { Router } from 'express';
import prisma from '../lib/prisma';
import { asyncHandler, getPagination, paginatedResponse } from '../lib/utils';
import { qualifyLead, markWon, createQuotationFromLead } from '../core/flow.service';
import { requireAuth } from '../core/auth';

export const crmRoutes = Router();
crmRoutes.use(requireAuth);

// ── Stages ──────────────────────────────────────────────────
crmRoutes.get('/stages', asyncHandler(async (_req, res) => {
    const stages = await prisma.crmStage.findMany({ orderBy: { sequence: 'asc' }, include: { _count: { select: { leads: true } } } });
    res.json(stages);
}));

// ── Leads / Opportunities ───────────────────────────────────
crmRoutes.get('/leads', asyncHandler(async (req, res) => {
    const { skip, page, limit } = getPagination(req.query);
    const type = (req.query.type as string) || undefined;
    const stageId = req.query.stage_id ? parseInt(req.query.stage_id as string) : undefined;

    const where: any = { active: true };
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
crmRoutes.get('/pipeline', asyncHandler(async (_req, res) => {
    const stages = await prisma.crmStage.findMany({
        orderBy: { sequence: 'asc' },
        include: {
            leads: { where: { active: true }, include: { partner: true }, orderBy: { createdAt: 'desc' } },
        },
    });
    res.json(stages);
}));
