import { Router } from 'express';
import prisma from '../lib/prisma';
import { asyncHandler, getPagination, paginatedResponse } from '../lib/utils';
import { requireAuth } from '../core/auth';
import { AppError } from '../core/errors';

export const appraisalRoutes = Router();
appraisalRoutes.use(requireAuth);

// ── Appraisals ────────────────────────────────────────────────────────────────

appraisalRoutes.get('/', asyncHandler(async (req, res) => {
    const { skip, page, limit } = getPagination(req.query);
    const employeeId = req.query.employeeId ? parseInt(req.query.employeeId as string) : undefined;
    const where = employeeId ? { employeeId } : {};
    const [data, total] = await Promise.all([
        prisma.hrAppraisal.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: { employee: { select: { id: true, name: true } }, goals: true },
        }),
        prisma.hrAppraisal.count({ where }),
    ]);
    res.json(paginatedResponse(data, total, page, limit));
}));

appraisalRoutes.get('/:id', asyncHandler(async (req, res) => {
    const a = await prisma.hrAppraisal.findUnique({
        where: { id: parseInt(req.params.id) },
        include: { employee: { select: { id: true, name: true } }, goals: true },
    });
    if (!a) throw AppError.notFound('Appraisal');
    res.json(a);
}));

appraisalRoutes.post('/', asyncHandler(async (req, res) => {
    const a = await prisma.hrAppraisal.create({
        data: req.body,
        include: { employee: { select: { id: true, name: true } }, goals: true },
    });
    res.status(201).json(a);
}));

appraisalRoutes.put('/:id', asyncHandler(async (req, res) => {
    const a = await prisma.hrAppraisal.update({ where: { id: parseInt(req.params.id) }, data: req.body });
    res.json(a);
}));

appraisalRoutes.patch('/:id/confirm', asyncHandler(async (req, res) => {
    const a = await prisma.hrAppraisal.update({
        where: { id: parseInt(req.params.id) },
        data: { state: 'confirmed' },
    });
    res.json(a);
}));

appraisalRoutes.patch('/:id/done', asyncHandler(async (req, res) => {
    const { overallRating, managerFeedback, employeeFeedback } = req.body;
    const a = await prisma.hrAppraisal.update({
        where: { id: parseInt(req.params.id) },
        data: { state: 'done', overallRating, managerFeedback, employeeFeedback },
    });
    res.json(a);
}));

appraisalRoutes.delete('/:id', asyncHandler(async (req, res) => {
    await prisma.hrAppraisal.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ success: true });
}));

// ── Goals ─────────────────────────────────────────────────────────────────────

appraisalRoutes.get('/:id/goals', asyncHandler(async (req, res) => {
    const goals = await prisma.appraisalGoal.findMany({
        where: { appraisalId: parseInt(req.params.id) },
        orderBy: { createdAt: 'asc' },
    });
    res.json(goals);
}));

appraisalRoutes.post('/:id/goals', asyncHandler(async (req, res) => {
    const appraisalId = parseInt(req.params.id);
    const { name, description, weight, deadline, progress, tag, employeeId } = req.body;
    if (!name || !employeeId) throw AppError.validation('name and employeeId required');
    const goal = await prisma.appraisalGoal.create({
        data: {
            appraisalId,
            name,
            description,
            weight: weight ?? 1,
            deadline: deadline ? new Date(deadline) : undefined,
            progress: progress ?? 0,
            tag,
            employeeId: parseInt(employeeId),
        },
    });
    res.status(201).json(goal);
}));

appraisalRoutes.put('/:id/goals/:goalId', asyncHandler(async (req, res) => {
    const goal = await prisma.appraisalGoal.update({
        where: { id: parseInt(req.params.goalId) },
        data: req.body,
    });
    res.json(goal);
}));

appraisalRoutes.delete('/:id/goals/:goalId', asyncHandler(async (req, res) => {
    await prisma.appraisalGoal.delete({ where: { id: parseInt(req.params.goalId) } });
    res.json({ success: true });
}));
