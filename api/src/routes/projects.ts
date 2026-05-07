import { Router } from 'express';
import prisma from '../lib/prisma';
import { asyncHandler, getPagination, paginatedResponse } from '../lib/utils';
import { requireAuth } from '../core/auth';

export const projectRoutes = Router();
projectRoutes.use(requireAuth);

// Stages
projectRoutes.get('/stages', asyncHandler(async (_req, res) => {
    const stages = await prisma.projectStage.findMany({ orderBy: { sequence: 'asc' } });
    res.json(stages);
}));

// Projects
projectRoutes.get('/', asyncHandler(async (req, res) => {
    const { skip, page, limit } = getPagination(req.query);
    const [data, total] = await Promise.all([
        prisma.projectProject.findMany({ where: { active: true }, skip, take: limit, orderBy: { name: 'asc' }, include: { _count: { select: { tasks: true } } } }),
        prisma.projectProject.count({ where: { active: true } }),
    ]);
    res.json(paginatedResponse(data, total, page, limit));
}));

projectRoutes.get('/:id', asyncHandler(async (req, res) => {
    const proj = await prisma.projectProject.findUnique({ where: { id: parseInt(req.params.id) }, include: { tasks: { include: { stage: true } } } });
    if (!proj) { res.status(404).json({ error: 'Project not found' }); return; }
    res.json(proj);
}));

projectRoutes.post('/', asyncHandler(async (req, res) => {
    const proj = await prisma.projectProject.create({ data: req.body });
    res.status(201).json(proj);
}));

projectRoutes.put('/:id', asyncHandler(async (req, res) => {
    const proj = await prisma.projectProject.update({ where: { id: parseInt(req.params.id) }, data: req.body });
    res.json(proj);
}));

// Tasks
projectRoutes.get('/:projectId/tasks', asyncHandler(async (req, res) => {
    const { skip, page, limit } = getPagination(req.query);
    const projectId = parseInt(req.params.projectId);
    const [data, total] = await Promise.all([
        prisma.projectTask.findMany({ where: { projectId, active: true }, skip, take: limit, orderBy: { sequence: 'asc' }, include: { stage: true } }),
        prisma.projectTask.count({ where: { projectId, active: true } }),
    ]);
    res.json(paginatedResponse(data, total, page, limit));
}));

projectRoutes.post('/:projectId/tasks', asyncHandler(async (req, res) => {
    const task = await prisma.projectTask.create({ data: { ...req.body, projectId: parseInt(req.params.projectId) } });
    res.status(201).json(task);
}));

projectRoutes.patch('/tasks/:id/stage', asyncHandler(async (req, res) => {
    const task = await prisma.projectTask.update({ where: { id: parseInt(req.params.id) }, data: { stageId: req.body.stageId } });
    res.json(task);
}));
