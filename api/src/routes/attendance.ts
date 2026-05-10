import { Router } from 'express';
import prisma from '../lib/prisma';
import { asyncHandler, getPagination, paginatedResponse } from '../lib/utils';
import { requireAuth } from '../core/auth';
import { AppError } from '../core/errors';

export const attendanceRoutes = Router();
attendanceRoutes.use(requireAuth);

attendanceRoutes.get('/', asyncHandler(async (req, res) => {
    const { skip, page, limit } = getPagination(req.query);
    const employeeId = req.query.employeeId ? parseInt(req.query.employeeId as string) : undefined;
    const where = employeeId ? { employeeId } : {};
    const [data, total] = await Promise.all([
        prisma.hrAttendance.findMany({ where, skip, take: limit, orderBy: { checkIn: 'desc' }, include: { employee: true } }),
        prisma.hrAttendance.count({ where }),
    ]);
    res.json(paginatedResponse(data, total, page, limit));
}));

// One-click check-in: creates an open attendance record (no checkOut)
attendanceRoutes.post('/check-in', asyncHandler(async (req, res) => {
    const { employeeId } = req.body;
    if (!employeeId) throw AppError.validation('employeeId required');

    // Guard against double check-in
    const open = await prisma.hrAttendance.findFirst({
        where: { employeeId: parseInt(employeeId), checkOut: null },
    });
    if (open) {
        res.status(409).json({ error: 'Already checked in', attendance: open });
        return;
    }

    const attendance = await prisma.hrAttendance.create({
        data: { employeeId: parseInt(employeeId), checkIn: new Date(), workedHours: 0 },
        include: { employee: true },
    });
    res.status(201).json(attendance);
}));

// One-click check-out: closes the open attendance and computes workedHours
attendanceRoutes.post('/check-out', asyncHandler(async (req, res) => {
    const { employeeId } = req.body;
    if (!employeeId) throw AppError.validation('employeeId required');

    const open = await prisma.hrAttendance.findFirst({
        where: { employeeId: parseInt(employeeId), checkOut: null },
        orderBy: { checkIn: 'desc' },
    });
    if (!open) {
        res.status(404).json({ error: 'No open attendance record found' });
        return;
    }

    const checkOut = new Date();
    const workedHours = (checkOut.getTime() - open.checkIn.getTime()) / 3_600_000;

    const attendance = await prisma.hrAttendance.update({
        where: { id: open.id },
        data: { checkOut, workedHours: Math.round(workedHours * 100) / 100 },
        include: { employee: true },
    });
    res.json(attendance);
}));

// Current status for an employee — are they checked in?
attendanceRoutes.get('/status/:employeeId', asyncHandler(async (req, res) => {
    const employeeId = parseInt(req.params.employeeId);
    const open = await prisma.hrAttendance.findFirst({
        where: { employeeId, checkOut: null },
        orderBy: { checkIn: 'desc' },
    });
    res.json({ checkedIn: !!open, current: open ?? null });
}));

// Overtime analytics — worked vs standard hours per employee per week/month
attendanceRoutes.get('/analytics/overtime', asyncHandler(async (req, res) => {
    const periodDays = parseInt((req.query.days as string) ?? '30');
    const since = new Date(Date.now() - periodDays * 86_400_000);

    const records = await prisma.hrAttendance.findMany({
        where: { checkIn: { gte: since }, checkOut: { not: null } },
        include: { employee: { select: { id: true, name: true } } },
    });

    // Aggregate workedHours per employee
    const byEmployee: Record<number, { name: string; workedHours: number }> = {};
    for (const r of records) {
        if (!byEmployee[r.employeeId]) {
            byEmployee[r.employeeId] = { name: r.employee.name, workedHours: 0 };
        }
        byEmployee[r.employeeId].workedHours += r.workedHours;
    }

    const standardHours = periodDays * (8 / 7); // 8h/day × working days estimate
    const result = Object.entries(byEmployee).map(([id, { name, workedHours }]) => ({
        employeeId: parseInt(id),
        name,
        workedHours: Math.round(workedHours * 100) / 100,
        standardHours: Math.round(standardHours * 100) / 100,
        overtime: Math.round(Math.max(0, workedHours - standardHours) * 100) / 100,
    }));

    res.json({ periodDays, data: result });
}));

attendanceRoutes.post('/', asyncHandler(async (req, res) => {
    const a = await prisma.hrAttendance.create({ data: req.body, include: { employee: true } });
    res.status(201).json(a);
}));

attendanceRoutes.put('/:id', asyncHandler(async (req, res) => {
    const record = await prisma.hrAttendance.update({ where: { id: parseInt(req.params.id) }, data: req.body });
    res.json(record);
}));

attendanceRoutes.delete('/:id', asyncHandler(async (req, res) => {
    await prisma.hrAttendance.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ success: true });
}));
