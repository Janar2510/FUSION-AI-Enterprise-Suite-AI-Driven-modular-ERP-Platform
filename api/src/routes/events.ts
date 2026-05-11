import { Router } from 'express';
import prisma from '../lib/prisma';
import { asyncHandler, getPagination, paginatedResponse } from '../lib/utils';
import { requireAuth } from '../core/auth';
import { AppError } from '../core/errors';

export const eventRoutes = Router();
eventRoutes.use(requireAuth);

// ── Events CRUD ───────────────────────────────────────────────────────────────

eventRoutes.get('/', asyncHandler(async (req, res) => {
    const { skip, page, limit } = getPagination(req.query);
    const state = req.query.state as string | undefined;
    const where: any = {};
    if (state) where.state = state;
    const [data, total] = await Promise.all([
        prisma.eventEvent.findMany({
            where,
            skip,
            take: limit,
            orderBy: { dateBegin: 'desc' },
            include: {
                _count: { select: { registrations: true } },
                tickets: { select: { id: true, name: true, price: true, seatsAvail: true } },
            },
        }),
        prisma.eventEvent.count({ where }),
    ]);
    res.json(paginatedResponse(data, total, page, limit));
}));

eventRoutes.get('/:id', asyncHandler(async (req, res) => {
    const ev = await prisma.eventEvent.findUnique({
        where: { id: parseInt(req.params.id) },
        include: {
            registrations: { include: { ticket: { select: { id: true, name: true, price: true } } } },
            tickets: true,
        },
    });
    if (!ev) throw AppError.notFound('Event');
    res.json(ev);
}));

eventRoutes.post('/', asyncHandler(async (req, res) => {
    const ev = await prisma.eventEvent.create({ data: req.body });
    res.status(201).json(ev);
}));

eventRoutes.put('/:id', asyncHandler(async (req, res) => {
    const ev = await prisma.eventEvent.update({ where: { id: parseInt(req.params.id) }, data: req.body });
    res.json(ev);
}));

eventRoutes.delete('/:id', asyncHandler(async (req, res) => {
    await prisma.eventEvent.delete({ where: { id: parseInt(req.params.id) } });
    res.status(204).send();
}));

// ── Stage pipeline transition ─────────────────────────────────────────────────

const VALID_STATES = ['draft', 'confirmed', 'cancelled', 'done'] as const;

eventRoutes.patch('/:id/state', asyncHandler(async (req, res) => {
    const { state } = req.body;
    if (!VALID_STATES.includes(state)) {
        throw AppError.validation(`state must be one of: ${VALID_STATES.join(', ')}`);
    }
    const ev = await prisma.eventEvent.update({
        where: { id: parseInt(req.params.id) },
        data: { state },
    });
    res.json(ev);
}));

// ── Ticket tiers ──────────────────────────────────────────────────────────────

eventRoutes.get('/:id/tickets', asyncHandler(async (req, res) => {
    const tickets = await prisma.eventTicket.findMany({
        where: { eventId: parseInt(req.params.id) },
        orderBy: { price: 'asc' },
    });
    res.json(tickets);
}));

eventRoutes.post('/:id/tickets', asyncHandler(async (req, res) => {
    const ticket = await prisma.eventTicket.create({
        data: { ...req.body, eventId: parseInt(req.params.id), seatsAvail: req.body.availability ?? 0 },
    });
    res.status(201).json(ticket);
}));

eventRoutes.put('/:eventId/tickets/:ticketId', asyncHandler(async (req, res) => {
    const ticket = await prisma.eventTicket.update({
        where: { id: parseInt(req.params.ticketId) },
        data: req.body,
    });
    res.json(ticket);
}));

eventRoutes.delete('/:eventId/tickets/:ticketId', asyncHandler(async (req, res) => {
    await prisma.eventTicket.delete({ where: { id: parseInt(req.params.ticketId) } });
    res.status(204).send();
}));

// ── Registrations ─────────────────────────────────────────────────────────────

eventRoutes.get('/:id/registrations', asyncHandler(async (req, res) => {
    const { skip, page, limit } = getPagination(req.query);
    const eventId = parseInt(req.params.id);
    const [data, total] = await Promise.all([
        prisma.eventRegistration.findMany({
            where: { eventId },
            skip,
            take: limit,
            orderBy: { id: 'asc' },
            include: { ticket: { select: { id: true, name: true, price: true } } },
        }),
        prisma.eventRegistration.count({ where: { eventId } }),
    ]);
    res.json(paginatedResponse(data, total, page, limit));
}));

eventRoutes.post('/:id/register', asyncHandler(async (req, res) => {
    const eventId = parseInt(req.params.id);
    const ev = await prisma.eventEvent.findUnique({ where: { id: eventId } });
    if (!ev) throw AppError.notFound('Event');
    if (ev.state !== 'confirmed') {
        throw AppError.validation('Registrations are only accepted for confirmed events');
    }
    const reg = await prisma.eventRegistration.create({
        data: { ...req.body, eventId, state: 'confirmed' },
    });
    res.status(201).json(reg);
}));

eventRoutes.patch('/:eventId/registrations/:regId', asyncHandler(async (req, res) => {
    const reg = await prisma.eventRegistration.update({
        where: { id: parseInt(req.params.regId) },
        data: req.body,
    });
    res.json(reg);
}));

eventRoutes.delete('/:eventId/registrations/:regId', asyncHandler(async (req, res) => {
    await prisma.eventRegistration.delete({ where: { id: parseInt(req.params.regId) } });
    res.status(204).send();
}));
