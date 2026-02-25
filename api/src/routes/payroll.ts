import { Router } from 'express';
import prisma from '../lib/prisma';
import { asyncHandler, getPagination, paginatedResponse } from '../lib/utils';

export const payrollRoutes = Router();

payrollRoutes.get('/', asyncHandler(async (req, res) => {
    const { skip, page, limit } = getPagination(req.query);
    const [data, total] = await Promise.all([
        prisma.hrPayslip.findMany({ skip, take: limit, orderBy: { dateFrom: 'desc' }, include: { employee: true } }),
        prisma.hrPayslip.count(),
    ]);
    res.json(paginatedResponse(data, total, page, limit));
}));

payrollRoutes.post('/', asyncHandler(async (req, res) => {
    const p = await prisma.hrPayslip.create({ data: req.body });
    res.status(201).json(p);
}));

payrollRoutes.put('/:id', asyncHandler(async (req, res) => {
    const p = await prisma.hrPayslip.update({ where: { id: parseInt(req.params.id) }, data: req.body });
    res.json(p);
}));

payrollRoutes.patch('/:id/confirm', asyncHandler(async (req, res) => {
    const p = await prisma.hrPayslip.update({ where: { id: parseInt(req.params.id) }, data: { state: 'done' } });
    res.json(p);
}));

payrollRoutes.delete('/:id', asyncHandler(async (req, res) => {
    await prisma.hrPayslip.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ success: true });
}));
