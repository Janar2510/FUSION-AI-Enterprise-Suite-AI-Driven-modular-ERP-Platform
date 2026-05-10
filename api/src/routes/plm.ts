import { Router } from 'express';
import prisma from '../lib/prisma';
import { asyncHandler, getPagination, paginatedResponse } from '../lib/utils';
import { requireAuth } from '../core/auth';
import { AppError } from '../core/errors';

export const plmRoutes = Router();
plmRoutes.use(requireAuth);

// ── ECOs ──────────────────────────────────────────────────────────────────────

plmRoutes.get('/', asyncHandler(async (req, res) => {
    const { skip, page, limit } = getPagination(req.query);
    const [data, total] = await Promise.all([
        prisma.mrpEco.findMany({
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: {
                product: { select: { id: true, name: true } },
                bom: { select: { id: true, name: true, code: true } },
                ecoLines: { include: { product: { select: { id: true, name: true } } } },
            },
        }),
        prisma.mrpEco.count(),
    ]);
    res.json(paginatedResponse(data, total, page, limit));
}));

plmRoutes.get('/:id', asyncHandler(async (req, res) => {
    const data = await prisma.mrpEco.findUnique({
        where: { id: parseInt(req.params.id) },
        include: {
            product: true,
            bom: { include: { lines: { include: { product: true } } } },
            ecoLines: { include: { product: true, bomLine: true } },
        },
    });
    if (!data) throw AppError.notFound('ECO');
    res.json(data);
}));

plmRoutes.post('/', asyncHandler(async (req, res) => {
    const eco = await prisma.mrpEco.create({
        data: req.body,
        include: { product: true, bom: true },
    });
    res.status(201).json(eco);
}));

plmRoutes.put('/:id', asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id);
    const { stage, ...rest } = req.body;

    if (stage === 'done') {
        const eco = await prisma.mrpEco.findUnique({
            where: { id },
            include: { ecoLines: true },
        });
        if (!eco) throw AppError.notFound('ECO');
        if (eco.approvalState === 'rejected') {
            res.status(400).json({ error: 'Cannot apply a rejected ECO' });
            return;
        }

        // Apply ECO lines to the linked BoM
        if (eco.bomId && eco.ecoLines.length > 0) {
            for (const line of eco.ecoLines) {
                if (line.action === 'add') {
                    await prisma.mrpBomLine.create({
                        data: { bomId: eco.bomId, productId: line.productId, productQty: line.newQty },
                    });
                } else if (line.action === 'remove' && line.bomLineId) {
                    await prisma.mrpBomLine.delete({ where: { id: line.bomLineId } }).catch(() => {});
                } else if (line.action === 'change' && line.bomLineId) {
                    await prisma.mrpBomLine.update({
                        where: { id: line.bomLineId },
                        data: { productQty: line.newQty },
                    });
                }
            }
        }

        const updated = await prisma.mrpEco.update({
            where: { id },
            data: { ...rest, stage: 'done', effectivityDate: new Date() },
            include: { product: true, bom: { include: { lines: { include: { product: true } } } }, ecoLines: true },
        });
        res.json(updated);
        return;
    }

    const eco = await prisma.mrpEco.update({
        where: { id },
        data: stage ? { ...rest, stage } : rest,
        include: { product: true, bom: true },
    });
    res.json(eco);
}));

plmRoutes.patch('/:id/approve', asyncHandler(async (req, res) => {
    const eco = await prisma.mrpEco.update({
        where: { id: parseInt(req.params.id) },
        data: { approvalState: 'approved', stage: 'progress' },
    });
    res.json(eco);
}));

plmRoutes.patch('/:id/reject', asyncHandler(async (req, res) => {
    const eco = await prisma.mrpEco.update({
        where: { id: parseInt(req.params.id) },
        data: { approvalState: 'rejected' },
    });
    res.json(eco);
}));

plmRoutes.delete('/:id', asyncHandler(async (req, res) => {
    await prisma.mrpEco.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ success: true });
}));

// ── ECO Lines (proposed BoM changes) ─────────────────────────────────────────

plmRoutes.get('/:id/lines', asyncHandler(async (req, res) => {
    const lines = await prisma.mrpEcoLine.findMany({
        where: { ecoId: parseInt(req.params.id) },
        include: { product: { select: { id: true, name: true } }, bomLine: true },
    });
    res.json(lines);
}));

plmRoutes.post('/:id/lines', asyncHandler(async (req, res) => {
    const { action, productId, newQty, bomLineId } = req.body;
    if (!productId) throw AppError.validation('productId required');
    const line = await prisma.mrpEcoLine.create({
        data: {
            ecoId: parseInt(req.params.id),
            action: action ?? 'add',
            productId,
            newQty: newQty ?? 1,
            bomLineId: bomLineId ? parseInt(bomLineId) : undefined,
        },
        include: { product: { select: { id: true, name: true } } },
    });
    res.status(201).json(line);
}));

plmRoutes.put('/:id/lines/:lineId', asyncHandler(async (req, res) => {
    const line = await prisma.mrpEcoLine.update({
        where: { id: parseInt(req.params.lineId) },
        data: req.body,
    });
    res.json(line);
}));

plmRoutes.delete('/:id/lines/:lineId', asyncHandler(async (req, res) => {
    await prisma.mrpEcoLine.delete({ where: { id: parseInt(req.params.lineId) } });
    res.json({ success: true });
}));
