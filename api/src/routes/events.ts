import { Router } from 'express';
import prisma from '../lib/prisma';
import { asyncHandler, getPagination, paginatedResponse } from '../lib/utils';

export const eventRoutes = Router();

eventRoutes.get('/', asyncHandler(async (req, res) => {
    const { skip, page, limit } = getPagination(req.query);
    const [data, total] = await Promise.all([
        prisma.eventEvent.findMany({ skip, take: limit, orderBy: { dateBegin: 'desc' }, include: { _count: { select: { registrations: true } } } }),
        prisma.eventEvent.count(),
    ]);
    res.json(paginatedResponse(data, total, page, limit));
}));

eventRoutes.get('/:id', asyncHandler(async (req, res) => {
    const ev = await prisma.eventEvent.findUnique({ where: { id: parseInt(req.params.id) }, include: { registrations: true } });
    if (!ev) { res.status(404).json({ error: 'Event not found' }); return; }
    res.json(ev);
}));

eventRoutes.post('/', asyncHandler(async (req, res) => {
    const ev = await prisma.eventEvent.create({ data: req.body });
    res.status(201).json(ev);
}));

eventRoutes.put('/:id', asyncHandler(async (req, res) => {
    const ev = await prisma.eventEvent.update({ where: { id: parseInt(req.params.id) }, data: req.body });
    res.json(ev);
}));

eventRoutes.delete('/:id', asyncHandler(async (req, res) => {
    await prisma.eventEvent.delete({ where: { id: parseInt(req.params.id) } });
    res.status(204).send();
}));

// Registrations
eventRoutes.post('/:id/register', asyncHandler(async (req, res) => {
    const reg = await prisma.eventRegistration.create({ data: { ...req.body, eventId: parseInt(req.params.id) } });
    res.status(201).json(reg);
}));
