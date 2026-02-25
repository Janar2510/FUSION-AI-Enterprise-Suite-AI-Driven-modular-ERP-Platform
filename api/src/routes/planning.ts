import { Router } from 'express';
import prisma from '../lib/prisma';
import { asyncHandler, getPagination, paginatedResponse } from '../lib/utils';
import { PlanningIntelligence } from '../lib/planning_intelligence';

export const planningRoutes = Router();

planningRoutes.get('/', asyncHandler(async (req, res) => {
    const { page, limit, skip } = getPagination(req.query);
    const [data, total] = await Promise.all([
        prisma.planningSlot.findMany({
            skip,
            take: limit,
            include: {
                employee: {
                    select: {
                        id: true,
                        name: true,
                        skills: { include: { skill: true } }
                    }
                },
                project: { select: { id: true, name: true } }
            },
            orderBy: { startDate: 'asc' }
        }),
        prisma.planningSlot.count(),
    ]);
    res.json(paginatedResponse(data, total, page, limit));
}));

planningRoutes.get('/recommendations', asyncHandler(async (req, res) => {
    const { skillIds, startDate, endDate } = req.query;
    if (!skillIds || !startDate || !endDate) {
        res.status(400).json({ error: 'skillIds, startDate, and endDate required' });
        return;
    }

    const ids = (skillIds as string).split(',').map(id => +id);
    const recommendations = await PlanningIntelligence.findRecommendedResources(
        ids,
        new Date(startDate as string),
        new Date(endDate as string)
    );
    res.json(recommendations);
}));

planningRoutes.get('/:id', asyncHandler(async (req, res) => {
    const slot = await prisma.planningSlot.findUniqueOrThrow({ where: { id: +req.params.id }, include: { employee: true, project: true } });
    res.json(slot);
}));

planningRoutes.post('/', asyncHandler(async (req, res) => {
    const { employeeId, startDate, endDate } = req.body;

    if (employeeId) {
        const conflict = await PlanningIntelligence.checkConflicts(employeeId, new Date(startDate), new Date(endDate));
        if (conflict.hasConflict) {
            res.status(409).json({
                error: 'Conflict detected',
                conflicts: conflict.conflictingSlots
            });
            return;
        }
    }

    const slot = await prisma.planningSlot.create({ data: req.body });
    res.status(201).json(slot);
}));

planningRoutes.put('/:id', asyncHandler(async (req, res) => {
    const { employeeId, startDate, endDate } = req.body;

    if (employeeId && startDate && endDate) {
        const conflict = await PlanningIntelligence.checkConflicts(employeeId, new Date(startDate), new Date(endDate), +req.params.id);
        if (conflict.hasConflict) {
            res.status(409).json({
                error: 'Conflict detected',
                conflicts: conflict.conflictingSlots
            });
            return;
        }
    }

    const slot = await prisma.planningSlot.update({ where: { id: +req.params.id }, data: req.body });
    res.json(slot);
}));

planningRoutes.delete('/:id', asyncHandler(async (req, res) => {
    await prisma.planningSlot.delete({ where: { id: +req.params.id } });
    res.json({ success: true });
}));
