import { Router } from 'express';
import prisma from '../lib/prisma';
import { asyncHandler, getPagination, paginatedResponse } from '../lib/utils';

export const helpdeskRoutes = Router();

helpdeskRoutes.get('/stages', asyncHandler(async (_req, res) => {
    const stages = await prisma.helpdeskStage.findMany({ orderBy: { sequence: 'asc' }, include: { _count: { select: { tickets: true } } } });
    res.json(stages);
}));

helpdeskRoutes.get('/tickets', asyncHandler(async (req, res) => {
    const { skip, page, limit } = getPagination(req.query);
    const [data, total] = await Promise.all([
        prisma.helpdeskTicket.findMany({ where: { active: true }, skip, take: limit, orderBy: { createdAt: 'desc' }, include: { stage: true, partner: true } }),
        prisma.helpdeskTicket.count({ where: { active: true } }),
    ]);
    res.json(paginatedResponse(data, total, page, limit));
}));

helpdeskRoutes.get('/tickets/:id', asyncHandler(async (req, res) => {
    const ticket = await prisma.helpdeskTicket.findUnique({ where: { id: parseInt(req.params.id) }, include: { stage: true, partner: true } });
    if (!ticket) { res.status(404).json({ error: 'Ticket not found' }); return; }
    res.json(ticket);
}));

helpdeskRoutes.post('/tickets', asyncHandler(async (req, res) => {
    const ticket = await prisma.helpdeskTicket.create({ data: req.body });
    res.status(201).json(ticket);
}));

helpdeskRoutes.put('/tickets/:id', asyncHandler(async (req, res) => {
    const ticket = await prisma.helpdeskTicket.update({ where: { id: parseInt(req.params.id) }, data: req.body });
    res.json(ticket);
}));

helpdeskRoutes.patch('/tickets/:id/stage', asyncHandler(async (req, res) => {
    const ticket = await prisma.helpdeskTicket.update({ where: { id: parseInt(req.params.id) }, data: { stageId: req.body.stageId } });
    res.json(ticket);
}));

helpdeskRoutes.delete('/tickets/:id', asyncHandler(async (req, res) => {
    await prisma.helpdeskTicket.update({ where: { id: parseInt(req.params.id) }, data: { active: false } });
    res.json({ success: true });
}));

// Pipeline view (kanban)
helpdeskRoutes.get('/pipeline', asyncHandler(async (_req, res) => {
    const stages = await prisma.helpdeskStage.findMany({
        orderBy: { sequence: 'asc' },
        include: { tickets: { where: { active: true }, include: { partner: true }, orderBy: { createdAt: 'desc' } } },
    });
    res.json(stages);
}));
