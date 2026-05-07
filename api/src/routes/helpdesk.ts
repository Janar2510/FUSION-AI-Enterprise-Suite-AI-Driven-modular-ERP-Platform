import { Router } from 'express';
import prisma from '../lib/prisma';
import { asyncHandler, getPagination, paginatedResponse } from '../lib/utils';
import { createTaskFromTicket, addTimesheetToTask } from '../core/flow.service';
import { AppError } from '../core/errors';
import { requireAuth } from '../core/auth';
import { helpdeskTicketFilter } from '../core/auth/recordRules';

export const helpdeskRoutes = Router();
helpdeskRoutes.use(requireAuth);

helpdeskRoutes.get('/stages', asyncHandler(async (_req, res) => {
    const stages = await prisma.helpdeskStage.findMany({ orderBy: { sequence: 'asc' }, include: { _count: { select: { tickets: true } } } });
    res.json(stages);
}));

helpdeskRoutes.get('/tickets', asyncHandler(async (req, res) => {
    const { skip, page, limit } = getPagination(req.query);
    const recordFilter = helpdeskTicketFilter(req.user!);
    const where = { active: true, ...recordFilter };
    const [data, total] = await Promise.all([
        prisma.helpdeskTicket.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' }, include: { stage: true, partner: true } }),
        prisma.helpdeskTicket.count({ where }),
    ]);
    res.json(paginatedResponse(data, total, page, limit));
}));

helpdeskRoutes.get('/tickets/:id', asyncHandler(async (req, res) => {
    const ticket = await prisma.helpdeskTicket.findUnique({ where: { id: parseInt(req.params.id) }, include: { stage: true, partner: true } });
    if (!ticket) { res.status(404).json({ error: 'Ticket not found' }); return; }
    res.json(ticket);
}));

helpdeskRoutes.post('/tickets', asyncHandler(async (req, res) => {
    const ticket = await prisma.helpdeskTicket.create({ data: req.body });
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
