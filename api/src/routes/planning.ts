import { Router } from 'express';
import prisma from '../lib/prisma';
import { asyncHandler, getPagination, paginatedResponse } from '../lib/utils';

export const planningRoutes = Router();

planningRoutes.get('/', asyncHandler(async (req, res) => {
    const { page, limit, skip } = getPagination(req.query);
    const [data, total] = await Promise.all([
        prisma.planningSlot.findMany({ skip, take: limit, include: { employee: { select: { id: true, name: true } }, project: { select: { id: true, name: true } } }, orderBy: { startDate: 'asc' } }),
        prisma.planningSlot.count(),
    ]);
    res.json(paginatedResponse(data, total, page, limit));
}));

planningRoutes.get('/:id', asyncHandler(async (req, res) => {
    const slot = await prisma.planningSlot.findUniqueOrThrow({ where: { id: +req.params.id }, include: { employee: true, project: true } });
    res.json(slot);
}));

planningRoutes.post('/', asyncHandler(async (req, res) => {
    const slot = await prisma.planningSlot.create({ data: req.body });
    res.status(201).json(slot);
}));

planningRoutes.put('/:id', asyncHandler(async (req, res) => {
    const slot = await prisma.planningSlot.update({ where: { id: +req.params.id }, data: req.body });
    res.json(slot);
}));

planningRoutes.delete('/:id', asyncHandler(async (req, res) => {
    await prisma.planningSlot.delete({ where: { id: +req.params.id } });
    res.json({ success: true });
}));
