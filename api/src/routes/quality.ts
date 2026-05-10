import { Router } from 'express';
import prisma from '../lib/prisma';
import { requireAuth } from '../core/auth';
import { asyncHandler, getPagination, paginatedResponse } from '../lib/utils';

export const qualityRoutes = Router();
qualityRoutes.use(requireAuth);

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

// Auto-evaluate measure checks against tolerance bounds from the quality point
qualityRoutes.patch('/checks/:id/measure', asyncHandler(async (req, res) => {
    const { measureValue } = req.body as { measureValue: number };
    const id = parseInt(req.params.id);

    const existing = await prisma.qualityCheck.findUnique({
        where: { id },
        include: { point: { select: { toleranceMin: true, toleranceMax: true } } },
    });
    if (!existing) { res.status(404).json({ error: 'Check not found' }); return; }

    // Determine pass/fail from tolerance bounds
    let state = 'pass';
    if (existing.point) {
        const { toleranceMin, toleranceMax } = existing.point;
        if (toleranceMin !== null && measureValue < toleranceMin) state = 'fail';
        if (toleranceMax !== null && measureValue > toleranceMax) state = 'fail';
    }

    const check = await prisma.qualityCheck.update({
        where: { id },
        data: { measureValue, state },
    });
    res.json(check);
}));

// --- Quality Alerts ---
qualityRoutes.get('/alerts', asyncHandler(async (req, res) => {
    const { skip, page, limit } = getPagination(req.query);
    const stage = req.query.stage as string | undefined;
    const where = stage ? { stage } : {};
    const [data, total] = await Promise.all([
        prisma.qualityAlert.findMany({
            where,
            skip, take: limit, orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
            include: {
                product: { select: { id: true, name: true } },
                workcenter: { select: { id: true, name: true } },
                check: { select: { id: true, name: true, state: true } },
            }
        }),
        prisma.qualityAlert.count({ where }),
    ]);
    res.json(paginatedResponse(data, total, page, limit));
}));

qualityRoutes.get('/alerts/:id', asyncHandler(async (req, res) => {
    const alert = await prisma.qualityAlert.findUnique({
        where: { id: parseInt(req.params.id) },
        include: {
            product: { select: { id: true, name: true } },
            workcenter: { select: { id: true, name: true } },
            check: { select: { id: true, name: true, state: true } },
        }
    });
    if (!alert) { res.status(404).json({ error: 'Alert not found' }); return; }
    res.json(alert);
}));

qualityRoutes.post('/alerts', asyncHandler(async (req, res) => {
    const alert = await prisma.qualityAlert.create({ data: req.body });
    res.status(201).json(alert);
}));

qualityRoutes.put('/alerts/:id', asyncHandler(async (req, res) => {
    const alert = await prisma.qualityAlert.update({ where: { id: parseInt(req.params.id) }, data: req.body });
    res.json(alert);
}));

qualityRoutes.patch('/alerts/:id/stage', asyncHandler(async (req, res) => {
    const { stage } = req.body as { stage: string };
    const doneDate = stage === 'done' ? new Date() : undefined;
    const alert = await prisma.qualityAlert.update({
        where: { id: parseInt(req.params.id) },
        data: { stage, ...(doneDate ? { doneDate } : {}) }
    });
    res.json(alert);
}));

qualityRoutes.delete('/alerts/:id', asyncHandler(async (req, res) => {
    await prisma.qualityAlert.delete({ where: { id: parseInt(req.params.id) } });
    res.status(204).send();
}));
