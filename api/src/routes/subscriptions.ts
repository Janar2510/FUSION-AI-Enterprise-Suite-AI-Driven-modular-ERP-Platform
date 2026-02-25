import { Router } from 'express';
import prisma from '../lib/prisma';
import { asyncHandler, getPagination, paginatedResponse } from '../lib/utils';

export const subscriptionRoutes = Router();

subscriptionRoutes.get('/', asyncHandler(async (req, res) => {
    const { page, limit, skip } = getPagination(req.query);
    const [data, total] = await Promise.all([
        prisma.subscription.findMany({ skip, take: limit, include: { partner: { select: { id: true, name: true } } }, orderBy: { createdAt: 'desc' } }),
        prisma.subscription.count(),
    ]);
    res.json(paginatedResponse(data, total, page, limit));
}));

subscriptionRoutes.get('/:id', asyncHandler(async (req, res) => {
    const sub = await prisma.subscription.findUniqueOrThrow({ where: { id: +req.params.id }, include: { partner: true } });
    res.json(sub);
}));

subscriptionRoutes.post('/', asyncHandler(async (req, res) => {
    const sub = await prisma.subscription.create({ data: req.body });
    res.status(201).json(sub);
}));

subscriptionRoutes.put('/:id', asyncHandler(async (req, res) => {
    const sub = await prisma.subscription.update({ where: { id: +req.params.id }, data: req.body });
    res.json(sub);
}));

subscriptionRoutes.delete('/:id', asyncHandler(async (req, res) => {
    await prisma.subscription.delete({ where: { id: +req.params.id } });
    res.json({ success: true });
}));
