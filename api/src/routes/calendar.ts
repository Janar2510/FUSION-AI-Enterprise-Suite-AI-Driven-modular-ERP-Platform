import { Router } from 'express';
import prisma from '../lib/prisma';
import { asyncHandler, getPagination, paginatedResponse } from '../lib/utils';

export const calendarRoutes = Router();

calendarRoutes.get('/', asyncHandler(async (req, res) => {
    const start = req.query.start ? new Date(req.query.start as string) : new Date(new Date().setMonth(new Date().getMonth() - 1));
    const stop = req.query.stop ? new Date(req.query.stop as string) : new Date(new Date().setMonth(new Date().getMonth() + 1));

    const events = await prisma.calendarEvent.findMany({
        where: { start: { gte: start }, stop: { lte: stop } },
        orderBy: { start: 'asc' },
        include: { attendees: { include: { partner: true } } },
    });
    res.json(events);
}));

calendarRoutes.get('/:id', asyncHandler(async (req, res) => {
    const ev = await prisma.calendarEvent.findUnique({ where: { id: parseInt(req.params.id) }, include: { attendees: { include: { partner: true } } } });
    if (!ev) { res.status(404).json({ error: 'Event not found' }); return; }
    res.json(ev);
}));

calendarRoutes.post('/', asyncHandler(async (req, res) => {
    const { attendeeIds, ...data } = req.body;
    const ev = await prisma.calendarEvent.create({
        data: { ...data, attendees: attendeeIds ? { create: attendeeIds.map((pid: number) => ({ partnerId: pid })) } : undefined },
        include: { attendees: { include: { partner: true } } },
    });
    res.status(201).json(ev);
}));

calendarRoutes.put('/:id', asyncHandler(async (req, res) => {
    const ev = await prisma.calendarEvent.update({ where: { id: parseInt(req.params.id) }, data: req.body });
    res.json(ev);
}));

calendarRoutes.delete('/:id', asyncHandler(async (req, res) => {
    await prisma.calendarEvent.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ success: true });
}));
