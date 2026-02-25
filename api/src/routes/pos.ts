import { Router } from 'express';
import prisma from '../lib/prisma';
import { asyncHandler, getPagination, paginatedResponse } from '../lib/utils';

export const posRoutes = Router();

// POS Configs
posRoutes.get('/configs', asyncHandler(async (_req, res) => {
    const configs = await prisma.posConfig.findMany({ where: { active: true } });
    res.json(configs);
}));

// Sessions
posRoutes.get('/sessions', asyncHandler(async (req, res) => {
    const state = req.query.state as string;
    const where: any = {};
    if (state) where.state = state;
    const sessions = await prisma.posSession.findMany({ where, orderBy: { startAt: 'desc' }, include: { config: true, _count: { select: { orders: true } } } });
    res.json(sessions);
}));

posRoutes.post('/sessions', asyncHandler(async (req, res) => {
    const count = await prisma.posSession.count();
    const session = await prisma.posSession.create({
        data: { ...req.body, name: `POS/${String(count + 1).padStart(5, '0')}`, state: 'opened' },
        include: { config: true },
    });
    res.status(201).json(session);
}));

posRoutes.post('/sessions/:id/close', asyncHandler(async (req, res) => {
    const session = await prisma.posSession.update({ where: { id: parseInt(req.params.id) }, data: { state: 'closed', stopAt: new Date() } });
    res.json(session);
}));

// Orders
posRoutes.get('/orders', asyncHandler(async (req, res) => {
    const { skip, page, limit } = getPagination(req.query);
    const sessionId = req.query.session_id ? parseInt(req.query.session_id as string) : undefined;
    const where: any = {};
    if (sessionId) where.sessionId = sessionId;

    const [data, total] = await Promise.all([
        prisma.posOrder.findMany({ where, skip, take: limit, orderBy: { dateOrder: 'desc' }, include: { session: true, lines: { include: { product: true } } } }),
        prisma.posOrder.count({ where }),
    ]);
    res.json(paginatedResponse(data, total, page, limit));
}));

posRoutes.post('/orders', asyncHandler(async (req, res) => {
    const { lines, ...data } = req.body;
    const count = await prisma.posOrder.count();
    const order = await prisma.posOrder.create({
        data: { ...data, name: `POS-ORDER/${String(count + 1).padStart(5, '0')}`, lines: lines ? { create: lines } : undefined },
        include: { lines: true },
    });
    res.status(201).json(order);
}));

posRoutes.post('/orders/:id/pay', asyncHandler(async (req, res) => {
    const order = await prisma.posOrder.update({ where: { id: parseInt(req.params.id) }, data: { state: 'paid', amountPaid: req.body.amount } });
    res.json(order);
}));
