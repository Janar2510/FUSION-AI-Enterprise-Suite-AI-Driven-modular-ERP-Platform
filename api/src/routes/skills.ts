import { Router } from 'express';
import prisma from '../lib/prisma';
import { asyncHandler, getPagination, paginatedResponse } from '../lib/utils';
import { requireAuth } from '../core/auth';

export const skillsRoutes = Router();
skillsRoutes.use(requireAuth);

skillsRoutes.get('/', asyncHandler(async (req, res) => {
    const { page, limit, skip } = getPagination(req.query);
    const [data, total] = await Promise.all([
        prisma.hrSkill.findMany({ skip, take: limit, include: { _count: { select: { employees: true } } } }),
        prisma.hrSkill.count(),
    ]);
    res.json(paginatedResponse(data, total, page, limit));
}));

skillsRoutes.post('/', asyncHandler(async (req, res) => {
    const skill = await prisma.hrSkill.create({ data: req.body });
    res.status(201).json(skill);
}));

skillsRoutes.post('/assign', asyncHandler(async (req, res) => {
    const { employeeId, skillId, level } = req.body;
    const assignment = await prisma.hrEmployeeSkill.create({
        data: { employeeId, skillId, level }
    });
    res.status(201).json(assignment);
}));

skillsRoutes.delete('/assign/:id', asyncHandler(async (req, res) => {
    await prisma.hrEmployeeSkill.delete({ where: { id: +req.params.id } });
    res.json({ success: true });
}));
