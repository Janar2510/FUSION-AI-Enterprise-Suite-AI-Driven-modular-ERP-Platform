import { Router } from 'express';
import prisma from '../lib/prisma';
import { asyncHandler, getPagination, paginatedResponse } from '../lib/utils';

export const fsRentalRoutes = Router();

// ============================================================================
// FIELD SERVICE TASKS
// ============================================================================
fsRentalRoutes.get('/tasks', asyncHandler(async (req, res) => {
    const { skip, page, limit } = getPagination(req.query);
    const [data, total] = await Promise.all([
        prisma.fsTask.findMany({ skip, take: limit, orderBy: { createdAt: 'desc' }, include: { partner: true, employee: true } }),
        prisma.fsTask.count(),
    ]);
    res.json(paginatedResponse(data, total, page, limit));
}));

fsRentalRoutes.post('/tasks', asyncHandler(async (req, res) => {
    const task = await prisma.fsTask.create({ data: req.body });
    res.status(201).json(task);
}));

fsRentalRoutes.put('/tasks/:id', asyncHandler(async (req, res) => {
    const task = await prisma.fsTask.update({ where: { id: parseInt(req.params.id) }, data: req.body });
    res.json(task);
}));

fsRentalRoutes.delete('/tasks/:id', asyncHandler(async (req, res) => {
    await prisma.fsTask.delete({ where: { id: parseInt(req.params.id) } });
    res.status(204).send();
}));

// ============================================================================
// RENTAL ORDERS
// ============================================================================
fsRentalRoutes.get('/rentals', asyncHandler(async (req, res) => {
    const { skip, page, limit } = getPagination(req.query);
    const [data, total] = await Promise.all([
        prisma.rentalOrder.findMany({ skip, take: limit, orderBy: { createdAt: 'desc' }, include: { partner: true, lines: { include: { product: true } } } }),
        prisma.rentalOrder.count(),
    ]);
    res.json(paginatedResponse(data, total, page, limit));
}));

fsRentalRoutes.post('/rentals', asyncHandler(async (req, res) => {
    const { lines, ...data } = req.body;
    const count = await prisma.rentalOrder.count();
    const order = await prisma.rentalOrder.create({
        data: {
            ...data,
            name: `RENTAL/${String(count + 1).padStart(5, '0')}`,
            lines: lines ? { create: lines } : undefined
        },
        include: { lines: true }
    });
    res.status(201).json(order);
}));

fsRentalRoutes.put('/rentals/:id', asyncHandler(async (req, res) => {
    const order = await prisma.rentalOrder.update({ where: { id: parseInt(req.params.id) }, data: req.body });
    res.json(order);
}));

fsRentalRoutes.delete('/rentals/:id', asyncHandler(async (req, res) => {
    await prisma.rentalOrder.delete({ where: { id: parseInt(req.params.id) } });
    res.status(204).send();
}));
