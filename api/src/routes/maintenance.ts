import { Router } from 'express';
import prisma from '../lib/prisma';
import { asyncHandler, getPagination, paginatedResponse } from '../lib/utils';

export const maintenanceRoutes = Router();

// Equipment
maintenanceRoutes.get('/equipment', asyncHandler(async (req, res) => {
    const { skip, page, limit } = getPagination(req.query);
    const [data, total] = await Promise.all([
        prisma.maintenanceEquipment.findMany({ where: { active: true }, skip, take: limit, orderBy: { name: 'asc' } }),
        prisma.maintenanceEquipment.count({ where: { active: true } }),
    ]);
    res.json(paginatedResponse(data, total, page, limit));
}));

maintenanceRoutes.post('/equipment', asyncHandler(async (req, res) => {
    const eq = await prisma.maintenanceEquipment.create({ data: req.body });
    res.status(201).json(eq);
}));

// Maintenance requests
maintenanceRoutes.get('/requests', asyncHandler(async (req, res) => {
    const { skip, page, limit } = getPagination(req.query);
    const [data, total] = await Promise.all([
        prisma.maintenanceRequest.findMany({ skip, take: limit, orderBy: { requestDate: 'desc' }, include: { equipment: true } }),
        prisma.maintenanceRequest.count(),
    ]);
    res.json(paginatedResponse(data, total, page, limit));
}));

maintenanceRoutes.post('/requests', asyncHandler(async (req, res) => {
    const mr = await prisma.maintenanceRequest.create({ data: req.body });
    res.status(201).json(mr);
}));

maintenanceRoutes.put('/requests/:id', asyncHandler(async (req, res) => {
    const mr = await prisma.maintenanceRequest.update({ where: { id: parseInt(req.params.id) }, data: req.body });
    res.json(mr);
}));
