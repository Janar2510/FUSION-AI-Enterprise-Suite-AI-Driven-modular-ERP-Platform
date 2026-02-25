import { Router } from 'express';
import prisma from '../lib/prisma';
import { asyncHandler, getPagination, paginatedResponse } from '../lib/utils';

export const surveyRoutes = Router();

surveyRoutes.get('/', asyncHandler(async (req, res) => {
    const { skip, page, limit } = getPagination(req.query);
    const [data, total] = await Promise.all([
        prisma.survey.findMany({ skip, take: limit, orderBy: { createdAt: 'desc' }, include: { _count: { select: { questions: true, responses: true } } } }),
        prisma.survey.count(),
    ]);
    res.json(paginatedResponse(data, total, page, limit));
}));

surveyRoutes.get('/:id', asyncHandler(async (req, res) => {
    const s = await prisma.survey.findUnique({ where: { id: parseInt(req.params.id) }, include: { questions: { orderBy: { sequence: 'asc' }, include: { answers: true } }, responses: true } });
    if (!s) { res.status(404).json({ error: 'Survey not found' }); return; }
    res.json(s);
}));

surveyRoutes.post('/', asyncHandler(async (req, res) => {
    const s = await prisma.survey.create({ data: req.body });
    res.status(201).json(s);
}));

surveyRoutes.put('/:id', asyncHandler(async (req, res) => {
    const s = await prisma.survey.update({ where: { id: parseInt(req.params.id) }, data: req.body });
    res.json(s);
}));

// Add question to survey
surveyRoutes.post('/:id/questions', asyncHandler(async (req, res) => {
    const q = await prisma.surveyQuestion.create({ data: { ...req.body, surveyId: parseInt(req.params.id) } });
    res.status(201).json(q);
}));

// Submit survey response
surveyRoutes.post('/:id/respond', asyncHandler(async (req, res) => {
    const r = await prisma.surveyUserInput.create({ data: { ...req.body, surveyId: parseInt(req.params.id) } });
    res.status(201).json(r);
}));
