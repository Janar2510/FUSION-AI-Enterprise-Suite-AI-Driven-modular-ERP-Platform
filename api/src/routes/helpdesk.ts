import { Router } from 'express';
import prisma from '../lib/prisma';
import { asyncHandler, getPagination, paginatedResponse } from '../lib/utils';
import { createTaskFromTicket, addTimesheetToTask } from '../core/flow.service';
import { AppError } from '../core/errors';
import { requireAuth } from '../core/auth';
import { helpdeskTicketFilter } from '../core/auth/recordRules';

export const helpdeskRoutes = Router();
helpdeskRoutes.use(requireAuth);

// ── Teams ─────────────────────────────────────────────────────────────────────

helpdeskRoutes.get('/teams', asyncHandler(async (_req, res) => {
    const teams = await prisma.helpdeskTeam.findMany({
        where: { active: true },
        orderBy: { name: 'asc' },
        include: { _count: { select: { tickets: true } } },
    });
    res.json(teams);
}));

helpdeskRoutes.get('/teams/:id', asyncHandler(async (req, res) => {
    const team = await prisma.helpdeskTeam.findUnique({ where: { id: parseInt(req.params.id) } });
    if (!team) { res.status(404).json({ error: 'Team not found' }); return; }
    res.json(team);
}));

helpdeskRoutes.post('/teams', asyncHandler(async (req, res) => {
    const team = await prisma.helpdeskTeam.create({ data: req.body });
    res.status(201).json(team);
}));

helpdeskRoutes.put('/teams/:id', asyncHandler(async (req, res) => {
    const team = await prisma.helpdeskTeam.update({ where: { id: parseInt(req.params.id) }, data: req.body });
    res.json(team);
}));

helpdeskRoutes.delete('/teams/:id', asyncHandler(async (req, res) => {
    await prisma.helpdeskTeam.update({ where: { id: parseInt(req.params.id) }, data: { active: false } });
    res.json({ success: true });
}));

// ── Stages ────────────────────────────────────────────────────────────────────

helpdeskRoutes.get('/stages', asyncHandler(async (_req, res) => {
    const stages = await prisma.helpdeskStage.findMany({ orderBy: { sequence: 'asc' }, include: { _count: { select: { tickets: true } } } });
    res.json(stages);
}));

// ── Tickets ───────────────────────────────────────────────────────────────────

helpdeskRoutes.get('/tickets', asyncHandler(async (req, res) => {
    const { skip, page, limit } = getPagination(req.query);
    const recordFilter = helpdeskTicketFilter(req.user!);
    const teamId = req.query.teamId ? parseInt(req.query.teamId as string) : undefined;
    const where: any = { active: true, ...recordFilter };
    if (teamId) where.teamId = teamId;
    const [data, total] = await Promise.all([
        prisma.helpdeskTicket.findMany({
            where, skip, take: limit, orderBy: { createdAt: 'desc' },
            include: { stage: true, partner: true, team: { select: { id: true, name: true } } },
        }),
        prisma.helpdeskTicket.count({ where }),
    ]);
    // Compute SLA exceeded flag at query time
    const now = new Date();
    const enriched = data.map(t => ({
        ...t,
        slaExceeded: t.slaDeadline ? now > t.slaDeadline && !t.dateClosed : false,
    }));
    res.json(paginatedResponse(enriched, total, page, limit));
}));

helpdeskRoutes.get('/tickets/:id', asyncHandler(async (req, res) => {
    const ticket = await prisma.helpdeskTicket.findUnique({
        where: { id: parseInt(req.params.id) },
        include: { stage: true, partner: true, team: { select: { id: true, name: true } } },
    });
    if (!ticket) { res.status(404).json({ error: 'Ticket not found' }); return; }
    res.json(ticket);
}));

helpdeskRoutes.post('/tickets', asyncHandler(async (req, res) => {
    const { teamId, slaHours, ...rest } = req.body;
    const data: any = { ...rest };
    if (teamId) data.teamId = parseInt(teamId);
    // Auto-set SLA deadline if slaHours provided
    if (slaHours) data.slaDeadline = new Date(Date.now() + slaHours * 3_600_000);
    const ticket = await prisma.helpdeskTicket.create({ data, include: { stage: true, team: { select: { id: true, name: true } } } });
    res.status(201).json(ticket);
}));

helpdeskRoutes.put('/tickets/:id', asyncHandler(async (req, res) => {
    const ticket = await prisma.helpdeskTicket.update({ where: { id: parseInt(req.params.id) }, data: req.body });
    res.json(ticket);
}));

helpdeskRoutes.patch('/tickets/:id/stage', asyncHandler(async (req, res) => {
    const ticket = await prisma.helpdeskTicket.update({ where: { id: parseInt(req.params.id) }, data: { stageId: req.body.stageId } });
    res.json(ticket);
}));

helpdeskRoutes.patch('/tickets/:id/team', asyncHandler(async (req, res) => {
    const { teamId, slaHours } = req.body;
    const data: any = { teamId: teamId ? parseInt(teamId) : null };
    if (slaHours) data.slaDeadline = new Date(Date.now() + slaHours * 3_600_000);
    const ticket = await prisma.helpdeskTicket.update({ where: { id: parseInt(req.params.id) }, data });
    res.json(ticket);
}));

helpdeskRoutes.patch('/tickets/:id/sla-reset', asyncHandler(async (req, res) => {
    const { slaHours } = req.body;
    if (!slaHours || isNaN(Number(slaHours))) {
        res.status(400).json({ error: 'slaHours is required' });
        return;
    }
    const ticket = await prisma.helpdeskTicket.update({
        where: { id: parseInt(req.params.id) },
        data: {
            slaDeadline: new Date(Date.now() + Number(slaHours) * 3_600_000),
            slaExceeded: false,
        },
    });
    res.json(ticket);
}));

helpdeskRoutes.delete('/tickets/:id', asyncHandler(async (req, res) => {
    await prisma.helpdeskTicket.update({ where: { id: parseInt(req.params.id) }, data: { active: false } });
    res.json({ success: true });
}));

// Flow E – Create a project task from a ticket
helpdeskRoutes.post('/tickets/:id/create-task', asyncHandler(async (req, res) => {
    const { projectId, name, saleOrderLineId } = req.body;
    if (!projectId) throw AppError.validation('projectId is required');
    const task = await createTaskFromTicket(parseInt(req.params.id), { projectId, name, saleOrderLineId });
    res.status(201).json(task);
}));

// Flow E – Add timesheet to a ticket's linked task
helpdeskRoutes.post('/tickets/:id/timesheet', asyncHandler(async (req, res) => {
    const ticket = await prisma.helpdeskTicket.findUnique({ where: { id: parseInt(req.params.id) } });
    if (!ticket) throw AppError.notFound('Helpdesk Ticket');
    if (!ticket.projectTaskId) throw AppError.conflict('Ticket has no linked project task. Call /create-task first.');

    const { name, unitAmount, date, isBillable, saleOrderLineId, employeeId } = req.body;
    if (!employeeId) throw AppError.validation('employeeId is required');
    if (!unitAmount || unitAmount <= 0) throw AppError.validation('unitAmount must be greater than 0');

    const ts = await addTimesheetToTask(ticket.projectTaskId, {
        name: name || `Work on #${ticket.id}: ${ticket.name}`,
        unitAmount,
        date: date ? new Date(date) : undefined,
        isBillable: isBillable ?? false,
        saleOrderLineId,
        employeeId,
    });
    res.status(201).json(ts);
}));

// Pipeline view (kanban)
helpdeskRoutes.get('/pipeline', asyncHandler(async (_req, res) => {
    const stages = await prisma.helpdeskStage.findMany({
        orderBy: { sequence: 'asc' },
        include: { tickets: { where: { active: true }, include: { partner: true }, orderBy: { createdAt: 'desc' } } },
    });
    res.json(stages);
}));

// ── Chatter (shared thread per ticket) ────────────────────────────────────────
import { createChatterRouter } from '../core/chatter';
helpdeskRoutes.use('/', createChatterRouter('helpdesk.ticket'));
