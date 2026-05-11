import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { asyncHandler, getPagination, paginatedResponse } from '../lib/utils';
import { confirmSaleOrder, createSaleInvoice } from '../core/flow.service';
import { requireAuth } from '../core/auth';
import { nextval } from '../core/sequence';
import { saleOrderFilter } from '../core/auth/recordRules';
import { generateOrderPdf } from '../core/pdf';
import { computeLinePrice } from '../core/pricelist.service';

export const saleRoutes = Router();
saleRoutes.use(requireAuth);

saleRoutes.get('/', asyncHandler(async (req, res) => {
    const { skip, page, limit } = getPagination(req.query);
    const state = req.query.state as string;
    const recordFilter = saleOrderFilter(req.user!);
    const where: any = { ...recordFilter };
    if (state) where.state = state;

    const [data, total] = await Promise.all([
        prisma.saleOrder.findMany({ where, skip, take: limit, orderBy: { dateOrder: 'desc' }, include: { partner: true, lines: { include: { product: true } } } }),
        prisma.saleOrder.count({ where }),
    ]);
    res.json(paginatedResponse(data, total, page, limit));
}));

saleRoutes.get('/:id', asyncHandler(async (req, res) => {
    const order = await prisma.saleOrder.findUnique({ where: { id: parseInt(req.params.id) }, include: { partner: true, lines: { include: { product: true } }, invoices: true, pickings: true } });
    if (!order) { res.status(404).json({ error: 'Sale order not found' }); return; }
    res.json(order);
}));

/**
 * Compute order line totals, optionally resolving unit price from the pricelist engine.
 */
async function calculateTotalsWithPricelist(
    lines: any[] = [],
    partnerId?: string | null,
    pricelistId?: number | null,
): Promise<{ computedLines: any[]; amountUntaxed: number; amountTax: number; amountTotal: number }> {
    let amountUntaxed = 0;

    const computedLines = await Promise.all(
        lines.map(async (line, index) => {
            const qty = parseFloat(line.productQty) || 1;
            const discount = parseFloat(line.discount) || 0;

            let price: number;
            if (line.priceUnit !== undefined && line.priceUnit !== null && line.priceUnit !== '') {
                price = parseFloat(line.priceUnit) || 0;
            } else if (line.productId) {
                price = await computeLinePrice(line.productId, partnerId, qty, pricelistId);
            } else {
                price = 0;
            }

            const subtotal = qty * price * (1 - discount / 100);
            amountUntaxed += subtotal;

            return {
                ...line,
                sequence: line.sequence || (index + 1) * 10,
                productQty: qty,
                priceUnit: price,
                discount,
                priceSubtotal: subtotal,
                priceTotal: subtotal * 1.2,
            };
        }),
    );

    const amountTax = amountUntaxed * 0.2;
    const amountTotal = amountUntaxed + amountTax;
    return { computedLines, amountUntaxed, amountTax, amountTotal };
}

function calculateTotals(lines: any[] = []) {
    let amountUntaxed = 0;
    const computedLines = lines.map((line, index) => {
        const qty = parseFloat(line.productQty) || 1;
        const price = parseFloat(line.priceUnit) || 0;
        const discount = parseFloat(line.discount) || 0;
        const subtotal = qty * price * (1 - discount / 100);
        amountUntaxed += subtotal;
        return {
            ...line,
            sequence: line.sequence || (index + 1) * 10,
            productQty: qty,
            priceUnit: price,
            discount,
            priceSubtotal: subtotal,
            priceTotal: subtotal * 1.2,
        };
    });
    const amountTax = amountUntaxed * 0.2;
    const amountTotal = amountUntaxed + amountTax;
    return { computedLines, amountUntaxed, amountTax, amountTotal };
}

saleRoutes.post('/', asyncHandler(async (req, res) => {
    const { lines = [], ...orderData } = req.body;
    const soName = await nextval('sale.order').catch(() => `SO-ERR`);

    const { computedLines, amountUntaxed, amountTax, amountTotal } = await calculateTotalsWithPricelist(
        lines,
        orderData.partnerId,
        orderData.pricelistId,
    );

    const order = await prisma.saleOrder.create({
        data: {
            ...orderData,
            name: soName,
            amountUntaxed,
            amountTax,
            amountTotal,
            lines: { create: computedLines }
        },
        include: { partner: true, lines: true },
    });
    res.status(201).json(order);
}));

saleRoutes.put('/:id', asyncHandler(async (req, res) => {
    const { lines, ...orderData } = req.body;

    let updateData: any = { ...orderData };

    if (lines) {
        // Resolve partner + pricelist from body or existing order
        let partnerId = orderData.partnerId;
        let pricelistId = orderData.pricelistId;
        if (!partnerId) {
            const existing = await prisma.saleOrder.findUnique({ where: { id: parseInt(req.params.id) }, select: { partnerId: true, pricelistId: true } });
            partnerId = existing?.partnerId;
            pricelistId = pricelistId ?? existing?.pricelistId;
        }

        const { computedLines, amountUntaxed, amountTax, amountTotal } = await calculateTotalsWithPricelist(
            lines,
            partnerId,
            pricelistId,
        );
        updateData.amountUntaxed = amountUntaxed;
        updateData.amountTax = amountTax;
        updateData.amountTotal = amountTotal;

        const lineIdsToKeep = computedLines.filter(l => l.id).map(l => l.id);

        updateData.lines = {
            deleteMany: lineIdsToKeep.length > 0 ? { id: { notIn: lineIdsToKeep } } : {},
            upsert: computedLines.map(line => ({
                where: { id: line.id || 0 },
                update: {
                    sequence: line.sequence,
                    name: line.name,
                    productQty: line.productQty,
                    priceUnit: line.priceUnit,
                    discount: line.discount,
                    priceSubtotal: line.priceSubtotal,
                    priceTotal: line.priceTotal,
                    productId: line.productId
                },
                create: {
                    sequence: line.sequence,
                    name: line.name,
                    productQty: line.productQty,
                    priceUnit: line.priceUnit,
                    discount: line.discount,
                    priceSubtotal: line.priceSubtotal,
                    priceTotal: line.priceTotal,
                    productId: line.productId
                }
            }))
        };
    }

    const order = await prisma.saleOrder.update({
        where: { id: parseInt(req.params.id) },
        data: updateData,
        include: { partner: true, lines: true }
    });
    res.json(order);
}));

// Confirm sale order – Flow B: also auto-creates delivery picking
saleRoutes.post('/:id/confirm', asyncHandler(async (req, res) => {
    const order = await confirmSaleOrder(parseInt(req.params.id), req.body.idempotencyKey);
    res.json(order);
}));

// Cancel sale order
saleRoutes.post('/:id/cancel', asyncHandler(async (req, res) => {
    const order = await prisma.saleOrder.update({ where: { id: parseInt(req.params.id) }, data: { state: 'cancel' } });
    res.json(order);
}));

// Create Invoice from Sale Order – Flow C (idempotent via idempotencyKey)
saleRoutes.post('/:id/invoice', asyncHandler(async (req, res) => {
    const order = await createSaleInvoice(parseInt(req.params.id), req.body.idempotencyKey);
    res.status(201).json(order);
}));

// Legacy invoice creation (kept for backward compat – same endpoint, new logic above)
saleRoutes.post('/:id/invoice-legacy', asyncHandler(async (req, res) => {
    const orderId = parseInt(req.params.id);
    const order = await prisma.saleOrder.findUnique({
        where: { id: orderId },
        include: { lines: true }
    });

    if (!order) { res.status(404).json({ error: 'Sale order not found' }); return; }

    // Ensure we have a sales journal
    let journal = await prisma.accountJournal.findFirst({ where: { type: 'sale' } });
    if (!journal) {
        journal = await prisma.accountJournal.create({
            data: { name: 'Customer Invoices', code: 'INV', type: 'sale' }
        });
    }

    // Prepare AccountMoveLines (Double-Entry: Debit A/R, Credit Income/Tax)
    const moveLines = [];

    // 1. Debit A/R (Total Amount)
    moveLines.push({
        name: `Receivable - ${order.name}`,
        debit: order.amountTotal,
        credit: 0,
        balance: order.amountTotal,
    });

    // 2. Credit Income (Untaxed Amount)
    moveLines.push({
        name: `Product Sales - ${order.name}`,
        debit: 0,
        credit: order.amountUntaxed,
        balance: -order.amountUntaxed,
    });

    // 3. Credit Tax
    if (order.amountTax > 0) {
        moveLines.push({
            name: `Tax 20% - ${order.name}`,
            debit: 0,
            credit: order.amountTax,
            balance: -order.amountTax,
        });
    }

    const count = await prisma.accountMove.count();
    const moveName = `INV/${new Date().getFullYear()}/${String(count + 1).padStart(4, '0')}`;

    const invoice = await prisma.accountMove.create({
        data: {
            name: moveName,
            moveType: 'out_invoice',
            state: 'draft',
            amountUntaxed: order.amountUntaxed,
            amountTax: order.amountTax,
            amountTotal: order.amountTotal,
            amountResidual: order.amountTotal,
            journalId: journal.id,
            partnerId: order.partnerId,
            saleOrderId: order.id,
            lines: { create: moveLines }
        }
    });

    res.status(201).json(invoice);
}));

// PDF download for quotation or order confirmation
saleRoutes.get('/:id/pdf', asyncHandler(async (req: Request, res: Response) => {
    const { buffer, filename } = await generateOrderPdf(parseInt(req.params.id));
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.end(buffer);
}));

// ── Pricelist helpers ──────────────────────────────────────────────────────

/** List active pricelists for the order-form header selector */
saleRoutes.get('/pricelists', asyncHandler(async (_req, res) => {
    const pricelists = await prisma.pricelist.findMany({
        where: { active: true },
        select: { id: true, name: true, currencyCode: true },
        orderBy: { name: 'asc' },
    });
    res.json(pricelists);
}));

/**
 * GET /api/sales/line-price?productId=&partnerId=&qty=&pricelistId=
 * Returns the resolved unit price for a single line (used by the frontend
 * to auto-fill priceUnit when a product is selected).
 */
saleRoutes.get('/line-price', asyncHandler(async (req, res) => {
    const { productId, partnerId, qty, pricelistId } = req.query as Record<string, string>;
    if (!productId) { res.status(400).json({ error: 'productId is required' }); return; }
    const price = await computeLinePrice(
        productId,
        partnerId || null,
        parseFloat(qty) || 1,
        pricelistId ? parseInt(pricelistId) : null,
    );
    res.json({ price });
}));

// ── Sales Analytics Dashboard ──────────────────────────────────────────────
saleRoutes.get('/analytics', asyncHandler(async (_req: Request, res: Response) => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    const [
        ordersByState,
        revenueThisMonth,
        revenueThisYear,
        recentOrders,
        topPartners,
    ] = await Promise.all([
        // Orders grouped by state
        Promise.all(
            ['draft', 'sale', 'cancel', 'delivered'].map(async state => ({
                state,
                count: await prisma.saleOrder.count({ where: { state } }),
            }))
        ),
        // Revenue this month (confirmed orders)
        prisma.saleOrder.aggregate({
            where: { state: { in: ['sale', 'delivered'] }, createdAt: { gte: startOfMonth } },
            _sum: { amountTotal: true },
        }),
        // Revenue this year
        prisma.saleOrder.aggregate({
            where: { state: { in: ['sale', 'delivered'] }, createdAt: { gte: startOfYear } },
            _sum: { amountTotal: true },
        }),
        // Last 10 confirmed orders
        prisma.saleOrder.findMany({
            where: { state: { in: ['sale', 'delivered'] } },
            orderBy: { createdAt: 'desc' },
            take: 10,
            include: { partner: { select: { name: true } } },
        }),
        // Top 5 partners by revenue
        prisma.saleOrder.groupBy({
            by: ['partnerId'],
            where: { state: { in: ['sale', 'delivered'] } },
            _sum: { amountTotal: true },
            orderBy: { _sum: { amountTotal: 'desc' } },
            take: 5,
        }).then(async rows => {
            const ids = rows.map(r => r.partnerId);
            const partners = await prisma.partner.findMany({
                where: { id: { in: ids } },
                select: { id: true, name: true },
            });
            const byId = new Map(partners.map(p => [p.id, p.name]));
            return rows.map(r => ({
                partnerId: r.partnerId,
                partnerName: byId.get(r.partnerId) ?? 'Unknown',
                revenue: Math.round((r._sum.amountTotal ?? 0) * 100) / 100,
            }));
        }),
    ]);

    res.json({
        ordersByState: Object.fromEntries(ordersByState.map(o => [o.state, o.count])),
        revenueThisMonth: Math.round((revenueThisMonth._sum.amountTotal ?? 0) * 100) / 100,
        revenueThisYear: Math.round((revenueThisYear._sum.amountTotal ?? 0) * 100) / 100,
        recentOrders,
        topPartners,
    });
}));

// ── Chatter ─────────────────────────────────────────────────────────────────
import { createChatterRouter } from '../core/chatter';
saleRoutes.use('/', createChatterRouter('sale.order'));
