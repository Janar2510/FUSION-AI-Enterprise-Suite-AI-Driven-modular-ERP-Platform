import { Router } from 'express';
import prisma from '../lib/prisma';
import { requireAuth } from '../core/auth';
import { asyncHandler, getPagination, paginatedResponse } from '../lib/utils';

export const fleetRoutes = Router();
fleetRoutes.use(requireAuth);

// Vehicles
fleetRoutes.get('/vehicles', asyncHandler(async (req, res) => {
    const { skip, page, limit } = getPagination(req.query);
    const [data, total] = await Promise.all([
        prisma.fleetVehicle.findMany({ skip, take: limit, orderBy: { name: 'asc' }, include: { _count: { select: { logs: true, contracts: true } } } }),
        prisma.fleetVehicle.count(),
    ]);
    res.json(paginatedResponse(data, total, page, limit));
}));

fleetRoutes.get('/vehicles/:id', asyncHandler(async (req, res) => {
    const v = await prisma.fleetVehicle.findUnique({
        where: { id: parseInt(req.params.id) },
        include: { logs: { orderBy: { date: 'desc' }, take: 20 }, contracts: { orderBy: { startDate: 'desc' } } },
    });
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

fleetRoutes.delete('/vehicles/:id', asyncHandler(async (req, res) => {
    await prisma.fleetVehicle.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ success: true });
}));

// Vehicle logs
fleetRoutes.get('/vehicles/:id/logs', asyncHandler(async (req, res) => {
    const { skip, page, limit } = getPagination(req.query);
    const vehicleId = parseInt(req.params.id);
    const [data, total] = await Promise.all([
        prisma.fleetVehicleLog.findMany({ where: { vehicleId }, skip, take: limit, orderBy: { date: 'desc' } }),
        prisma.fleetVehicleLog.count({ where: { vehicleId } }),
    ]);
    res.json(paginatedResponse(data, total, page, limit));
}));

fleetRoutes.post('/vehicles/:id/logs', asyncHandler(async (req, res) => {
    const log = await prisma.fleetVehicleLog.create({ data: { ...req.body, vehicleId: parseInt(req.params.id) } });
    res.status(201).json(log);
}));

fleetRoutes.delete('/logs/:id', asyncHandler(async (req, res) => {
    await prisma.fleetVehicleLog.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ success: true });
}));

// Fleet contracts
fleetRoutes.get('/contracts', asyncHandler(async (req, res) => {
    const { skip, page, limit } = getPagination(req.query);
    const vehicleId = req.query.vehicle_id ? parseInt(req.query.vehicle_id as string) : undefined;
    const where: any = {};
    if (vehicleId) where.vehicleId = vehicleId;

    const [data, total] = await Promise.all([
        prisma.fleetContract.findMany({ where, skip, take: limit, orderBy: { expirationDate: 'asc' }, include: { vehicle: true } }),
        prisma.fleetContract.count({ where }),
    ]);
    res.json(paginatedResponse(data, total, page, limit));
}));

fleetRoutes.post('/contracts', asyncHandler(async (req, res) => {
    const c = await prisma.fleetContract.create({ data: req.body, include: { vehicle: true } });
    res.status(201).json(c);
}));

fleetRoutes.put('/contracts/:id', asyncHandler(async (req, res) => {
    const c = await prisma.fleetContract.update({ where: { id: parseInt(req.params.id) }, data: req.body });
    res.json(c);
}));

fleetRoutes.delete('/contracts/:id', asyncHandler(async (req, res) => {
    await prisma.fleetContract.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ success: true });
}));

// Analytics — cost rollup by log type + contract spend
fleetRoutes.get('/analytics', asyncHandler(async (_req, res) => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [totalVehicles, logsByType, recentSpend, expiringContracts, totalLogCost] = await Promise.all([
        prisma.fleetVehicle.count(),
        prisma.fleetVehicleLog.groupBy({ by: ['type'], _sum: { amount: true }, _count: true }),
        prisma.fleetVehicleLog.aggregate({
            where: { date: { gte: thirtyDaysAgo } },
            _sum: { amount: true },
        }),
        prisma.fleetContract.findMany({
            where: { expirationDate: { lte: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) }, state: 'open' },
            include: { vehicle: true },
            orderBy: { expirationDate: 'asc' },
        }),
        prisma.fleetVehicleLog.aggregate({ _sum: { amount: true } }),
    ]);

    res.json({
        totalVehicles,
        totalCost: totalLogCost._sum.amount ?? 0,
        last30DaysCost: recentSpend._sum.amount ?? 0,
        costByType: logsByType.map(g => ({ type: g.type, total: g._sum.amount ?? 0, count: g._count })),
        expiringContracts,
    });
}));
