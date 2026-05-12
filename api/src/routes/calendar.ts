import { Router } from 'express';
import type { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { asyncHandler } from '../lib/utils';
import { requireAuth } from '../core/auth';

export const calendarRoutes = Router();
calendarRoutes.use(requireAuth);

/** Shared create handler: `POST /api/calendar` and `POST /api/calendar/events` (module adapter path). */
async function createCalendarEvent(req: Request, res: Response): Promise<void> {
    const { attendeeIds, ...data } = req.body;
    const ev = await prisma.calendarEvent.create({
        data: {
            ...data,
            attendees: attendeeIds
                ? { create: (attendeeIds as number[]).map((pid: number) => ({ partnerId: pid })) }
                : undefined,
        },
        include: { attendees: { include: { partner: true } } },
    });
    res.status(201).json(ev);
}

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

calendarRoutes.post('/', asyncHandler(createCalendarEvent));

/** Cross-module calendar integration (see docs/modules/00-master-gap-summary.md, docs/BUILD_ORCHESTRATION Track B). */
calendarRoutes.post('/events', asyncHandler(createCalendarEvent));

calendarRoutes.put('/:id', asyncHandler(async (req, res) => {
    const { attendeeIds, ...data } = req.body;
    const ev = await prisma.calendarEvent.update({
        where: { id: parseInt(req.params.id) },
        data,
        include: { attendees: { include: { partner: true } } },
    });
    res.json(ev);
}));

calendarRoutes.delete('/:id', asyncHandler(async (req, res) => {
    await prisma.calendarEvent.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ success: true });
}));
