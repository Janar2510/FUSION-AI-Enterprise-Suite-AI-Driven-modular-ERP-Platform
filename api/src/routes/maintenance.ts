import { Router } from 'express';
import prisma from '../lib/prisma';
import { requireAuth } from '../core/auth';
import { asyncHandler, getPagination, paginatedResponse } from '../lib/utils';

export const maintenanceRoutes = Router();
maintenanceRoutes.use(requireAuth);

// Equipment
maintenanceRoutes.get('/equipment', asyncHandler(async (req, res) => {
    const { skip, page, limit } = getPagination(req.query);
    const [data, total] = await Promise.all([
        prisma.maintenanceEquipment.findMany({
            where: { active: true }, skip, take: limit, orderBy: { name: 'asc' },
            include: { _count: { select: { requests: true } } },
        }),
        prisma.maintenanceEquipment.count({ where: { active: true } }),
    ]);
    res.json(paginatedResponse(data, total, page, limit));
}));

maintenanceRoutes.get('/equipment/:id', asyncHandler(async (req, res) => {
    const eq = await prisma.maintenanceEquipment.findUnique({
        where: { id: parseInt(req.params.id) },
        include: { requests: { orderBy: { requestDate: 'desc' }, take: 10 } },
    });
    if (!eq) { res.status(404).json({ error: 'Equipment not found' }); return; }
    res.json(eq);
}));

maintenanceRoutes.post('/equipment', asyncHandler(async (req, res) => {
    const eq = await prisma.maintenanceEquipment.create({ data: req.body });
    res.status(201).json(eq);
}));

maintenanceRoutes.put('/equipment/:id', asyncHandler(async (req, res) => {
    const { preventiveFreqDays, ...rest } = req.body;
    const updateData: any = { ...rest };
    if (preventiveFreqDays !== undefined) {
        updateData.preventiveFreqDays = preventiveFreqDays;
        if (preventiveFreqDays > 0) {
            const base = rest.lastMaintenanceDate ? new Date(rest.lastMaintenanceDate) : new Date();
            const next = new Date(base);
            next.setDate(next.getDate() + preventiveFreqDays);
            updateData.nextDueDate = next;
            updateData.nextMaintenanceDate = next;
        }
    }
    const eq = await prisma.maintenanceEquipment.update({ where: { id: parseInt(req.params.id) }, data: updateData });
    res.json(eq);
}));

maintenanceRoutes.delete('/equipment/:id', asyncHandler(async (req, res) => {
    await prisma.maintenanceEquipment.update({ where: { id: parseInt(req.params.id) }, data: { active: false } });
    res.json({ success: true });
}));

// Maintenance requests
maintenanceRoutes.get('/requests', asyncHandler(async (req, res) => {
    const { skip, page, limit } = getPagination(req.query);
    const equipmentId = req.query.equipment_id ? parseInt(req.query.equipment_id as string) : undefined;
    const where: any = {};
    if (equipmentId) where.equipmentId = equipmentId;

    const [data, total] = await Promise.all([
        prisma.maintenanceRequest.findMany({ where, skip, take: limit, orderBy: { requestDate: 'desc' }, include: { equipment: true } }),
        prisma.maintenanceRequest.count({ where }),
    ]);
    res.json(paginatedResponse(data, total, page, limit));
}));

maintenanceRoutes.get('/requests/:id', asyncHandler(async (req, res) => {
    const mr = await prisma.maintenanceRequest.findUnique({
        where: { id: parseInt(req.params.id) },
        include: { equipment: true },
    });
    if (!mr) { res.status(404).json({ error: 'Request not found' }); return; }
    res.json(mr);
}));

maintenanceRoutes.post('/requests', asyncHandler(async (req, res) => {
    const mr = await prisma.maintenanceRequest.create({ data: req.body, include: { equipment: true } });
    res.status(201).json(mr);
}));

maintenanceRoutes.put('/requests/:id', asyncHandler(async (req, res) => {
    const mr = await prisma.maintenanceRequest.update({ where: { id: parseInt(req.params.id) }, data: req.body });
    res.json(mr);
}));

maintenanceRoutes.patch('/requests/:id/done', asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id);
    const mr = await prisma.maintenanceRequest.update({
        where: { id },
        data: { stage: 'done', closeDate: new Date(), durationHours: req.body.durationHours },
    });

    // Update equipment's last maintenance date
    if (mr.equipmentId) {
        const eq = await prisma.maintenanceEquipment.findUnique({ where: { id: mr.equipmentId } });
        if (eq?.preventiveFreqDays) {
            const next = new Date();
            next.setDate(next.getDate() + eq.preventiveFreqDays);
            await prisma.maintenanceEquipment.update({
                where: { id: mr.equipmentId },
                data: { lastMaintenanceDate: new Date(), nextMaintenanceDate: next },
            });
        } else {
            await prisma.maintenanceEquipment.update({
                where: { id: mr.equipmentId },
                data: { lastMaintenanceDate: new Date() },
            });
        }
    }

    res.json(mr);
}));

maintenanceRoutes.delete('/requests/:id', asyncHandler(async (req, res) => {
    await prisma.maintenanceRequest.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ success: true });
}));

// Analytics — MTBF/MTTR + open requests by equipment
maintenanceRoutes.get('/analytics', asyncHandler(async (_req, res) => {
    const [totalEquipment, openRequests, doneRequests, byStage] = await Promise.all([
        prisma.maintenanceEquipment.count({ where: { active: true } }),
        prisma.maintenanceRequest.count({ where: { stage: { notIn: ['done', 'cancelled'] } } }),
        prisma.maintenanceRequest.findMany({
            where: { stage: 'done', closeDate: { not: null }, durationHours: { not: null } },
            select: { requestDate: true, closeDate: true, durationHours: true, equipmentId: true },
        }),
        prisma.maintenanceRequest.groupBy({ by: ['stage'], _count: true }),
    ]);

    // Mean Time To Repair = avg durationHours across all done requests
    const mttr = doneRequests.length > 0
        ? doneRequests.reduce((s, r) => s + (r.durationHours ?? 0), 0) / doneRequests.length
        : 0;

    // Mean Time Between Failures (approximation) = avg days between consecutive failures per equipment
    const equipmentFailureGaps: number[] = [];
    const byEquipment = doneRequests.reduce((acc: Record<number, Date[]>, r) => {
        if (r.equipmentId) {
            if (!acc[r.equipmentId]) acc[r.equipmentId] = [];
            acc[r.equipmentId].push(r.requestDate);
        }
        return acc;
    }, {});
    for (const dates of Object.values(byEquipment)) {
        dates.sort((a, b) => a.getTime() - b.getTime());
        for (let i = 1; i < dates.length; i++) {
            equipmentFailureGaps.push((dates[i].getTime() - dates[i - 1].getTime()) / (1000 * 60 * 60 * 24));
        }
    }
    const mtbf = equipmentFailureGaps.length > 0
        ? equipmentFailureGaps.reduce((s, d) => s + d, 0) / equipmentFailureGaps.length
        : null;

    // Equipment due for preventive maintenance
    const overdue = await prisma.maintenanceEquipment.findMany({
        where: { active: true, nextMaintenanceDate: { lt: new Date() } },
        select: { id: true, name: true, nextMaintenanceDate: true },
        orderBy: { nextMaintenanceDate: 'asc' },
    });

    res.json({
        totalEquipment,
        openRequests,
        byStage,
        mttrHours: Math.round(mttr * 10) / 10,
        mtbfDays: mtbf !== null ? Math.round(mtbf) : null,
        overduePreventive: overdue,
    });
}));

// ── Chatter ─────────────────────────────────────────────────────────────────
import { createChatterRouter } from '../core/chatter';
maintenanceRoutes.use('/', createChatterRouter('maintenance.request'));
