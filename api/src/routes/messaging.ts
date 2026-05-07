import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { asyncHandler, getPagination, paginatedResponse } from '../lib/utils';
import { requireAuth } from '../core/auth';

export const messagingRoutes = Router();
messagingRoutes.use(requireAuth);

// ── Chatter — polymorphic record-level messages + activities ─────────────────
// ownerType = 'SaleOrder' | 'HelpdeskTicket' | 'AccountMove' | 'PurchaseOrder' | …
// ownerId   = the record's ID as a string

messagingRoutes.get('/chatter', asyncHandler(async (req: Request, res: Response) => {
    const ownerType = req.query.ownerType as string;
    const ownerId = req.query.ownerId as string;
    if (!ownerType || !ownerId) { res.status(400).json({ error: 'ownerType and ownerId required' }); return; }

    const [messages, timeline] = await Promise.all([
        (prisma as any).chatterMessage?.findMany?.({
            where: { ownerType, ownerId },
            orderBy: { createdAt: 'asc' },
        }) ?? [],
        (prisma as any).timelineEvent?.findMany?.({
            where: { ownerType, ownerId },
            orderBy: { createdAt: 'asc' },
            take: 50,
        }) ?? [],
    ]);

    res.json({ messages: messages ?? [], timeline: timeline ?? [] });
}));

messagingRoutes.post('/chatter', asyncHandler(async (req: Request, res: Response) => {
    const { ownerType, ownerId, body, isInternal = true } = req.body;
    if (!ownerType || !ownerId || !body) {
        res.status(400).json({ error: 'ownerType, ownerId, body required' });
        return;
    }

    const msg = await (prisma as any).chatterMessage?.create?.({
        data: {
            ownerType,
            ownerId: String(ownerId),
            body,
            isInternal,
            authorId: req.user?.sub ?? null,
            organizationId: req.user?.orgId ?? 'default',
        },
    });
    res.status(201).json(msg);
}));

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
