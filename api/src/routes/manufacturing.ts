import { Router, Request } from 'express';
import prisma from '../lib/prisma';
import { requireAuth } from '../core/auth';
import { runAgent } from '../core/ai';
import '../core/ai/agents/manufacturingScheduler';
import { asyncHandler, getPagination, paginatedResponse } from '../lib/utils';

export const manufacturingRoutes = Router();
manufacturingRoutes.use(requireAuth);

// BOMs
manufacturingRoutes.get('/boms', asyncHandler(async (req, res) => {
    const boms = await prisma.mrpBom.findMany({
        where: { active: true },
        include: {
            lines: { include: { product: true } },
            routing: { include: { operations: true } }
        }
    });
    res.json(boms);
}));

manufacturingRoutes.get('/boms/:id', asyncHandler(async (req, res) => {
    const bom = await (prisma as any).mrpBom.findUnique({
        where: { id: parseInt(req.params.id) },
        include: {
            lines: { include: { product: true } },
            routing: { include: { operations: true } }
        }
    });
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
    const { workOrders, bomId, ...data } = req.body;
    const moName = `MO/${String(count + 1).padStart(5, '0')}`;

    // Auto-generate WorkOrders if BOM has a routing
    let finalWorkOrders = workOrders || [];
    if (bomId && finalWorkOrders.length === 0) {
        const bom = await (prisma as any).mrpBom.findUnique({
            where: { id: parseInt(bomId) },
            include: { routing: { include: { operations: true } } }
        });

        if (bom?.routing?.operations) {
            finalWorkOrders = bom.routing.operations.map((op: any) => ({
                name: op.name,
                workcenterId: op.workcenterId,
                duration: op.duration,
                sequence: op.sequence,
                state: 'pending'
            }));
        }
    }

    const mo = await prisma.mrpProduction.create({
        data: {
            ...data,
            bomId: bomId ? parseInt(bomId) : undefined,
            name: moName,
            workOrders: finalWorkOrders.length > 0 ? { create: finalWorkOrders } : undefined
        },
        include: { product: true, bom: true, workOrders: { include: { workcenter: true } } }
    });

    // --- Quality Check Automation ---
    if (mo.productId) {
        // Find Quality Points for this product
        const points = await prisma.qualityPoint.findMany({
            where: {
                OR: [
                    { productId: mo.productId },
                    { productId: null } // Global points or category points
                ]
            }
        });

        // Create Quality Checks linked to this MO
        for (const point of points) {
            await prisma.qualityCheck.create({
                data: {
                    name: point.name,
                    pointId: point.id,
                    productId: mo.productId,
                    productionId: mo.id,
                    testType: point.testType,
                    state: 'none'
                }
            });
        }
    }

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

manufacturingRoutes.put('/workcenters/:id', asyncHandler(async (req, res) => {
    const workcenter = await prisma.mrpWorkcenter.update({
        where: { id: parseInt(req.params.id) },
        data: req.body
    });
    res.json(workcenter);
}));

manufacturingRoutes.delete('/workcenters/:id', asyncHandler(async (req, res) => {
    await prisma.mrpWorkcenter.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ success: true });
}));

// Routings
manufacturingRoutes.get('/routings', asyncHandler(async (req, res) => {
    const routings = await prisma.mrpRouting.findMany({
        where: { active: true },
        include: { operations: { include: { workcenter: true } } }
    });
    res.json(routings);
    return;
}));

manufacturingRoutes.post('/routings', asyncHandler(async (req, res) => {
    const { operations, ...data } = req.body;
    const routing = await prisma.mrpRouting.create({
        data: {
            ...data,
            operations: operations ? { create: operations } : undefined
        },
        include: { operations: true }
    });
    res.status(201).json(routing);
}));

manufacturingRoutes.put('/routings/:id', asyncHandler(async (req, res) => {
    const { operations, ...data } = req.body;
    const routingId = parseInt(req.params.id);

    if (operations) {
        await prisma.mrpRoutingOperation.deleteMany({ where: { routingId } });
    }

    const routing = await prisma.mrpRouting.update({
        where: { id: routingId },
        data: {
            ...data,
            operations: operations ? { create: operations } : undefined
        },
        include: { operations: true }
    });
    res.json(routing);
    return;
}));

manufacturingRoutes.delete('/routings/:id', asyncHandler(async (req, res) => {
    await (prisma as any).mrpRouting.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ success: true });
    return;
}));

// AI & Intelligence
manufacturingRoutes.post('/ai/optimize-schedule', asyncHandler(async (req: Request, res) => {
    const result = await runAgent(
        'manufacturing-scheduler',
        { orgId: (req as any).user?.orgId ?? '' },
        { userId: (req as any).user?.sub, orgId: (req as any).user?.orgId },
    );
    res.json({
        optimized: true,
        confidence: result.output.confidence,
        schedule: result.output.suggestions.map(s => ({
            orderId: parseInt(String(s.field).replace('mo_', '').split('_')[0]) || 0,
            ...((s.suggestedValue as any) ?? {}),
            reasoning: s.reasoning,
        })),
        summary: result.output.summary,
        conflicts: (result.output.metadata?.conflicts as string[]) ?? [],
        aiActionId: result.id,
    });
}));

manufacturingRoutes.post('/ai/log-quality-data', asyncHandler(async (req, res) => {
    const { workcenterId, passRate, defectRate } = req.body;

    // Log for AI analysis (Simulated)
    console.log(`[AI-QUALITY] WC: ${workcenterId}, Pass: ${passRate}, Defect: ${defectRate}`);

    // Check for maintenance alerts based on defect trends
    if (defectRate > 0.15) {
        // Create a maintenance alert
        await prisma.mrpWorkcenter.update({
            where: { id: workcenterId },
            data: { active: false } // Auto-stop for inspection
        });
        res.json({ alert: 'Predictive maintenance triggered. Center halted for inspection.' });
        return;
    }

    res.json({ status: 'logged' });
}));

manufacturingRoutes.get('/ai/oee-analysis/:wcId', asyncHandler(async (req, res) => {
    const wc = await prisma.mrpWorkcenter.findUnique({ where: { id: parseInt(req.params.wcId) } });
    if (!wc) return void res.status(404).json({ error: 'WC not found' });

    // Calculate OEE (Simulated based on historical MOs)
    res.json({
        oee: 0.88,
        availability: 0.92,
        performance: 0.95,
        quality: 0.98,
        maintenanceRecommendation: wc.active ? 'No immediate action' : 'Inspection Required'
    });
}));
