import { Router } from 'express';
import prisma from '../lib/prisma';
import { asyncHandler, getPagination, paginatedResponse } from '../lib/utils';

export const manufacturingRoutes = Router();

// BOMs
manufacturingRoutes.get('/boms', asyncHandler(async (req, res) => {
    const boms = await prisma.mrpBom.findMany({ where: { active: true }, include: { lines: { include: { product: true } } } });
    res.json(boms);
}));

manufacturingRoutes.get('/boms/:id', asyncHandler(async (req, res) => {
    const bom = await prisma.mrpBom.findUnique({ where: { id: parseInt(req.params.id) }, include: { lines: { include: { product: true } } } });
    if (!bom) return void res.status(404).json({ error: 'BOM not found' });
    res.json(bom);
}));

manufacturingRoutes.post('/boms', asyncHandler(async (req, res) => {
    const { lines, ...data } = req.body;
    const bom = await prisma.mrpBom.create({
        data: { ...data, lines: lines ? { create: lines } : undefined },
        include: { lines: { include: { product: true } } }
    });
    res.status(201).json(bom);
}));

manufacturingRoutes.put('/boms/:id', asyncHandler(async (req, res) => {
    const { lines, ...data } = req.body;
    // Basic update for simplicity: delete old lines and recreate
    await prisma.mrpBomLine.deleteMany({ where: { bomId: parseInt(req.params.id) } });
    const bom = await prisma.mrpBom.update({
        where: { id: parseInt(req.params.id) },
        data: { ...data, lines: lines ? { create: lines } : undefined },
        include: { lines: { include: { product: true } } }
    });
    res.json(bom);
}));

// Manufacturing Orders
manufacturingRoutes.get('/orders', asyncHandler(async (req, res) => {
    const { skip, page, limit } = getPagination(req.query);
    const state = req.query.state as string;
    const where: any = {};
    if (state) where.state = state;

    const [data, total] = await Promise.all([
        prisma.mrpProduction.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' }, include: { bom: true, product: true, workOrders: true } }),
        prisma.mrpProduction.count({ where }),
    ]);
    res.json(paginatedResponse(data, total, page, limit));
}));

manufacturingRoutes.get('/orders/:id', asyncHandler(async (req, res) => {
    const mo = await prisma.mrpProduction.findUnique({
        where: { id: parseInt(req.params.id) },
        include: {
            bom: { include: { lines: { include: { product: true } } } },
            product: true,
            workOrders: { include: { workcenter: true } }
        }
    });
    if (!mo) { res.status(404).json({ error: 'Production order not found' }); return; }
    res.json(mo);
}));

manufacturingRoutes.post('/orders', asyncHandler(async (req, res) => {
    const count = await prisma.mrpProduction.count();
    const { workOrders, ...data } = req.body;
    const moName = `MO/${String(count + 1).padStart(5, '0')}`;
    const mo = await prisma.mrpProduction.create({
        data: {
            ...data,
            name: moName,
            workOrders: workOrders ? { create: workOrders } : undefined
        },
        include: { product: true, bom: true, workOrders: true }
    });
    res.status(201).json(mo);
}));

manufacturingRoutes.put('/orders/:id', asyncHandler(async (req, res) => {
    const { workOrders, ...data } = req.body;
    if (workOrders) {
        await prisma.mrpWorkorder.deleteMany({ where: { productionId: parseInt(req.params.id) } });
    }
    const mo = await prisma.mrpProduction.update({
        where: { id: parseInt(req.params.id) },
        data: {
            ...data,
            workOrders: workOrders ? { create: workOrders } : undefined
        },
        include: { product: true, bom: true, workOrders: { include: { workcenter: true } } }
    });
    res.json(mo);
}));

manufacturingRoutes.post('/orders/:id/start', asyncHandler(async (req, res) => {
    const mo = await prisma.mrpProduction.update({ where: { id: parseInt(req.params.id) }, data: { state: 'progress', dateStart: new Date() } });
    res.json(mo);
}));

manufacturingRoutes.post('/orders/:id/done', asyncHandler(async (req, res) => {
    // 1. Mark MO as done
    const mo = await prisma.mrpProduction.update({
        where: { id: parseInt(req.params.id) },
        data: { state: 'done', dateFinished: new Date() },
        include: { bom: { include: { lines: true } }, product: true }
    });

    // 2. Handle simple stock quant updates (Raw Material Consumption & Finished Goods Production)
    // Find internal location (assume ID 1 for MVP if not specified)
    const stockLocationId = 1;

    if (mo.bom && mo.bom.lines.length > 0) {
        // Decrease stock for components
        for (const line of mo.bom.lines) {
            const consumedQty = line.productQty * mo.qtyProduced;

            const existingQuant = await prisma.stockQuant.findFirst({
                where: { productId: line.productId, locationId: stockLocationId }
            });

            if (existingQuant) {
                await prisma.stockQuant.update({
                    where: { id: existingQuant.id },
                    data: { quantity: existingQuant.quantity - consumedQty }
                });
            } else {
                await prisma.stockQuant.create({
                    data: { productId: line.productId, locationId: stockLocationId, quantity: -consumedQty }
                });
            }
        }
    }

    if (mo.productId) {
        // Increase stock for finished goods
        const producedQty = mo.qtyProduced;
        const existingQuant = await prisma.stockQuant.findFirst({
            where: { productId: mo.productId, locationId: stockLocationId }
        });

        if (existingQuant) {
            await prisma.stockQuant.update({
                where: { id: existingQuant.id },
                data: { quantity: existingQuant.quantity + producedQty }
            });
        } else {
            await prisma.stockQuant.create({
                data: { productId: mo.productId, locationId: stockLocationId, quantity: producedQty }
            });
        }
    }

    res.json(mo);
}));

// Work Centers
manufacturingRoutes.get('/workcenters', asyncHandler(async (req, res) => {
    const workcenters = await prisma.mrpWorkcenter.findMany({ where: { active: true } });
    res.json(workcenters);
}));

manufacturingRoutes.post('/workcenters', asyncHandler(async (req, res) => {
    const workcenter = await prisma.mrpWorkcenter.create({ data: req.body });
    res.status(201).json(workcenter);
}));
