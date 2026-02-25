import { Router } from 'express';
import prisma from '../lib/prisma';
import { asyncHandler, getPagination, paginatedResponse } from '../lib/utils';

export const recruitmentRoutes = Router();

recruitmentRoutes.get('/', asyncHandler(async (req, res) => {
    const { skip, page, limit } = getPagination(req.query);
    const [data, total] = await Promise.all([
        prisma.hrApplicant.findMany({ where: { active: true }, skip, take: limit, orderBy: { createdAt: 'desc' }, include: { job: true, department: true } }),
        prisma.hrApplicant.count({ where: { active: true } }),
    ]);
    res.json(paginatedResponse(data, total, page, limit));
}));

recruitmentRoutes.get('/:id', asyncHandler(async (req, res) => {
    const a = await prisma.hrApplicant.findUnique({ where: { id: parseInt(req.params.id) }, include: { job: true, department: true } });
    if (!a) { res.status(404).json({ error: 'Applicant not found' }); return; }
    res.json(a);
}));

recruitmentRoutes.post('/', asyncHandler(async (req, res) => {
    const a = await prisma.hrApplicant.create({ data: req.body, include: { job: true, department: true } });
    res.status(201).json(a);
}));

recruitmentRoutes.put('/:id', asyncHandler(async (req, res) => {
    const a = await prisma.hrApplicant.update({ where: { id: parseInt(req.params.id) }, data: req.body });
    res.json(a);
}));

recruitmentRoutes.delete('/:id', asyncHandler(async (req, res) => {
    await prisma.hrApplicant.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ success: true });
}));
