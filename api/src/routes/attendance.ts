import { Router } from 'express';
import prisma from '../lib/prisma';
import { asyncHandler, getPagination, paginatedResponse } from '../lib/utils';

export const attendanceRoutes = Router();

attendanceRoutes.get('/', asyncHandler(async (req, res) => {
    const { skip, page, limit } = getPagination(req.query);
    const [data, total] = await Promise.all([
        prisma.hrAttendance.findMany({ skip, take: limit, orderBy: { checkIn: 'desc' }, include: { employee: true } }),
        prisma.hrAttendance.count(),
    ]);
    res.json(paginatedResponse(data, total, page, limit));
}));

attendanceRoutes.post('/', asyncHandler(async (req, res) => {
    const a = await prisma.hrAttendance.create({ data: req.body });
    res.status(201).json(a);
}));

attendanceRoutes.put('/:id', asyncHandler(async (req, res) => {
    const record = await prisma.hrAttendance.update({ where: { id: parseInt(req.params.id) }, data: req.body });
    res.json(record);
}));

attendanceRoutes.delete('/:id', asyncHandler(async (req, res) => {
    await prisma.hrAttendance.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ success: true });
}));
