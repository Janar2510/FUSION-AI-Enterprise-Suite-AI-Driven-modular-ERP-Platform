import { Router } from 'express';
import prisma from '../lib/prisma';
import { asyncHandler, getPagination, paginatedResponse } from '../lib/utils';

export const fleetRoutes = Router();

fleetRoutes.get('/vehicles', asyncHandler(async (req, res) => {
    const { skip, page, limit } = getPagination(req.query);
    const [data, total] = await Promise.all([
        prisma.fleetVehicle.findMany({ skip, take: limit, orderBy: { name: 'asc' }, include: { _count: { select: { logs: true } } } }),
        prisma.fleetVehicle.count(),
    ]);
    res.json(paginatedResponse(data, total, page, limit));
}));

fleetRoutes.get('/vehicles/:id', asyncHandler(async (req, res) => {
    const v = await prisma.fleetVehicle.findUnique({ where: { id: parseInt(req.params.id) }, include: { logs: { orderBy: { date: 'desc' }, take: 20 } } });
    if (!v) { res.status(404).json({ error: 'Vehicle not found' }); return; }
    res.json(v);
}));

fleetRoutes.post('/vehicles', asyncHandler(async (req, res) => {
    const v = await prisma.fleetVehicle.create({ data: req.body });
    res.status(201).json(v);
}));

fleetRoutes.put('/vehicles/:id', asyncHandler(async (req, res) => {
    const v = await prisma.fleetVehicle.update({ where: { id: parseInt(req.params.id) }, data: req.body });
    res.json(v);
}));

// Vehicle logs
fleetRoutes.post('/vehicles/:id/logs', asyncHandler(async (req, res) => {
    const log = await prisma.fleetVehicleLog.create({ data: { ...req.body, vehicleId: parseInt(req.params.id) } });
    res.status(201).json(log);
}));
