import { Router } from 'express';
import prisma from '../lib/prisma';
import { asyncHandler, getPagination, paginatedResponse } from '../lib/utils';

export const messagingRoutes = Router();

// Channels
messagingRoutes.get('/channels', asyncHandler(async (_req, res) => {
    const channels = await prisma.mailChannel.findMany({ where: { active: true }, orderBy: { updatedAt: 'desc' } });
    res.json(channels);
}));

messagingRoutes.post('/channels', asyncHandler(async (req, res) => {
    const ch = await prisma.mailChannel.create({ data: req.body });
    res.status(201).json(ch);
}));

// Messages in a channel
messagingRoutes.get('/channels/:id/messages', asyncHandler(async (req, res) => {
    const { skip, page, limit } = getPagination(req.query);
    const channelId = parseInt(req.params.id);
    const [data, total] = await Promise.all([
        prisma.mailMessage.findMany({ where: { channelId }, skip, take: limit, orderBy: { date: 'desc' } }),
        prisma.mailMessage.count({ where: { channelId } }),
    ]);
    res.json(paginatedResponse(data, total, page, limit));
}));

messagingRoutes.post('/channels/:id/messages', asyncHandler(async (req, res) => {
    const msg = await prisma.mailMessage.create({ data: { ...req.body, channelId: parseInt(req.params.id) } });
    res.status(201).json(msg);
}));

// Activity messages on any record (polymorphic)
messagingRoutes.get('/messages', asyncHandler(async (req, res) => {
    const resModel = req.query.model as string;
    const resId = req.query.res_id ? parseInt(req.query.res_id as string) : undefined;
    const where: any = {};
    if (resModel) where.resModel = resModel;
    if (resId) where.resId = resId;
    const messages = await prisma.mailMessage.findMany({ where, orderBy: { date: 'desc' }, take: 50 });
    res.json(messages);
}));

messagingRoutes.post('/messages', asyncHandler(async (req, res) => {
    const msg = await prisma.mailMessage.create({ data: req.body });
    res.status(201).json(msg);
}));
