import { Router } from 'express';
import prisma from '../lib/prisma';
import { asyncHandler, getPagination, paginatedResponse } from '../lib/utils';

export const appraisalRoutes = Router();

appraisalRoutes.get('/', asyncHandler(async (req, res) => {
    const { skip, page, limit } = getPagination(req.query);
    const [data, total] = await Promise.all([
        prisma.hrAppraisal.findMany({ skip, take: limit, orderBy: { createdAt: 'desc' }, include: { employee: true } }),
        prisma.hrAppraisal.count(),
    ]);
    res.json(paginatedResponse(data, total, page, limit));
}));

appraisalRoutes.post('/', asyncHandler(async (req, res) => {
    const a = await prisma.hrAppraisal.create({ data: req.body });
    res.status(201).json(a);
}));

appraisalRoutes.put('/:id', asyncHandler(async (req, res) => {
    const a = await prisma.hrAppraisal.update({ where: { id: parseInt(req.params.id) }, data: req.body });
    res.json(a);
}));

appraisalRoutes.delete('/:id', asyncHandler(async (req, res) => {
    await prisma.hrAppraisal.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ success: true });
}));
