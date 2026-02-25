import { Router } from 'express';
import prisma from '../lib/prisma';
import { asyncHandler, getPagination, paginatedResponse } from '../lib/utils';

export const inventoryRoutes = Router();

// --- Stock Picking Types (Operations Dashboard) ---
inventoryRoutes.get('/picking-types', asyncHandler(async (req, res) => {
    const types = await prisma.stockPickingType.findMany({
        include: {
            warehouse: true,
            _count: {
                select: { pickings: { where: { state: { in: ['draft', 'waiting', 'confirmed', 'assigned'] } } } }
            }
        }
    });
    res.json(types);
}));

// --- Stock Pickings (Transfers) ---
inventoryRoutes.get('/pickings', asyncHandler(async (req, res) => {
    const { skip, page, limit } = getPagination(req.query);
    const state = req.query.state as string;
    const pickingTypeId = req.query.pickingTypeId ? parseInt(req.query.pickingTypeId as string) : undefined;

    const where: any = {};
    if (state) where.state = state;
    if (pickingTypeId) where.pickingTypeId = pickingTypeId;

    const [data, total] = await Promise.all([
        prisma.stockPicking.findMany({
            where, skip, take: limit, orderBy: { createdAt: 'desc' },
            include: { partner: true, pickingType: true, location: true, locationDest: true, moves: { include: { product: true } } }
        }),
        prisma.stockPicking.count({ where }),
    ]);
    res.json(paginatedResponse(data, total, page, limit));
}));

inventoryRoutes.get('/pickings/:id', asyncHandler(async (req, res) => {
    const picking = await prisma.stockPicking.findUnique({
        where: { id: parseInt(req.params.id) },
        include: { partner: true, pickingType: true, location: true, locationDest: true, moves: { include: { product: true } } }
    });
    if (!picking) { res.status(404).json({ error: 'Picking not found' }); return; }
    res.json(picking);
}));

inventoryRoutes.post('/pickings', asyncHandler(async (req, res) => {
    const { moves = [], ...pickingData } = req.body;

    // Auto-generate name based on sequence code of picking type
    const pickingType = await prisma.stockPickingType.findUnique({ where: { id: pickingData.pickingTypeId } });
    const count = await prisma.stockPicking.count({ where: { pickingTypeId: pickingData.pickingTypeId } });
    const name = `${pickingType?.sequenceCode || 'WH'}/2025/${String(count + 1).padStart(5, '0')}`;

    const picking = await prisma.stockPicking.create({
        data: {
            ...pickingData,
            name,
            state: 'draft',
            moves: {
                create: moves.map((m: any) => ({
                    name: m.name || 'Stock Move',
                    productQty: parseFloat(m.productQty),
                    qtyDone: 0,
                    productId: m.productId,
                    locationId: pickingData.locationId || pickingType?.defaultLocationSrcId,
                    locationDestId: pickingData.locationDestId || pickingType?.defaultLocationDestId,
                }))
            }
        },
        include: { moves: true }
    });
    res.status(201).json(picking);
}));

// --- Validate (Process) Picking ---
inventoryRoutes.post('/pickings/:id/validate', asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id);
    const picking = await prisma.stockPicking.findUnique({
        where: { id },
        include: { moves: true }
    });

    if (!picking) { res.status(404).json({ error: 'Picking not found' }); return; }
    if (picking.state === 'done') { res.status(400).json({ error: 'Picking is already done' }); return; }

    // Use a transaction to ensure stock consistency
    await prisma.$transaction(async (tx) => {
        // 1. Mark picking as done
        await tx.stockPicking.update({
            where: { id },
            data: { state: 'done', dateDone: new Date() }
        });

        for (const move of picking.moves) {
            // Auto-fill qtyDone if 0
            const qtyProcessed = move.qtyDone > 0 ? move.qtyDone : move.productQty;

            // 2. Mark move as done
            await tx.stockMove.update({
                where: { id: move.id },
                data: { state: 'done', qtyDone: qtyProcessed }
            });

            // 3. Update Source Quant (Decrease)
            if (move.locationId) {
                const srcQuant = await tx.stockQuant.findUnique({
                    where: { productId_locationId: { productId: move.productId, locationId: move.locationId } }
                });
                if (srcQuant) {
                    await tx.stockQuant.update({
                        where: { id: srcQuant.id },
                        data: { quantity: srcQuant.quantity - qtyProcessed }
                    });
                }
            }

            // 4. Update Destination Quant (Increase)
            if (move.locationDestId) {
                const destQuant = await tx.stockQuant.findUnique({
                    where: { productId_locationId: { productId: move.productId, locationId: move.locationDestId } }
                });

                if (destQuant) {
                    await tx.stockQuant.update({
                        where: { id: destQuant.id },
                        data: { quantity: destQuant.quantity + qtyProcessed }
                    });
                } else {
                    await tx.stockQuant.create({
                        data: {
                            productId: move.productId,
                            locationId: move.locationDestId,
                            quantity: qtyProcessed
                        }
                    });
                }
            }
        }
    });

    res.json({ success: true, message: 'Stock picking validated successfully' });
}));

// --- Stock Quants (On Hand Inventory) ---
inventoryRoutes.get('/quants', asyncHandler(async (req, res) => {
    const { skip, page, limit } = getPagination(req.query);
    const productId = req.query.productId ? parseInt(req.query.productId as string) : undefined;
    const locationId = req.query.locationId ? parseInt(req.query.locationId as string) : undefined;

    const where: any = {};
    if (productId) where.productId = productId;
    if (locationId) where.locationId = locationId;

    const [data, total] = await Promise.all([
        prisma.stockQuant.findMany({
            where, skip, take: limit,
            include: { product: true, location: true }
        }),
        prisma.stockQuant.count({ where }),
    ]);
    res.json(paginatedResponse(data, total, page, limit));
}));
