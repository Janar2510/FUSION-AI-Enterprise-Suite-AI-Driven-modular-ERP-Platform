import { Router } from 'express';
import prisma from '../lib/prisma';
import { asyncHandler, getPagination, paginatedResponse } from '../lib/utils';

export const qualityRoutes = Router();

// --- Quality Points ---
qualityRoutes.get('/points', asyncHandler(async (req, res) => {
    const { skip, page, limit } = getPagination(req.query);
    const [data, total] = await Promise.all([
        prisma.qualityPoint.findMany({
            skip, take: limit,
            include: { product: { select: { id: true, name: true } } }
        }),
        prisma.qualityPoint.count()
    ]);
    res.json(paginatedResponse(data, total, page, limit));
}));

qualityRoutes.post('/points', asyncHandler(async (req, res) => {
    const point = await prisma.qualityPoint.create({ data: req.body });
    res.status(201).json(point);
}));

qualityRoutes.put('/points/:id', asyncHandler(async (req, res) => {
    const point = await prisma.qualityPoint.update({ where: { id: parseInt(req.params.id) }, data: req.body });
    res.json(point);
}));

qualityRoutes.delete('/points/:id', asyncHandler(async (req, res) => {
    await prisma.qualityPoint.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ success: true });
}));

// --- Quality Checks ---
qualityRoutes.get('/checks', asyncHandler(async (req, res) => {
    const { skip, page, limit } = getPagination(req.query);
    const [data, total] = await Promise.all([
        prisma.qualityCheck.findMany({
            skip, take: limit, orderBy: { createdAt: 'desc' },
            include: {
                point: true,
                product: { select: { id: true, name: true } },
                production: { select: { id: true, name: true } },
                picking: { select: { id: true, name: true } }
            }
        }),
        prisma.qualityCheck.count()
    ]);
    res.json(paginatedResponse(data, total, page, limit));
}));

qualityRoutes.post('/checks', asyncHandler(async (req, res) => {
    const check = await prisma.qualityCheck.create({ data: req.body });
    res.status(201).json(check);
}));

qualityRoutes.put('/checks/:id', asyncHandler(async (req, res) => {
    const check = await prisma.qualityCheck.update({ where: { id: parseInt(req.params.id) }, data: req.body });
    res.json(check);
}));

qualityRoutes.delete('/checks/:id', asyncHandler(async (req, res) => {
    await prisma.qualityCheck.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ success: true });
}));
