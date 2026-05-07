import { Router } from 'express';
import prisma from '../lib/prisma';
import { asyncHandler, getPagination, paginatedResponse } from '../lib/utils';
import { confirmSaleOrder, createSaleInvoice } from '../core/flow.service';
import { requireAuth } from '../core/auth';

export const saleRoutes = Router();
saleRoutes.use(requireAuth);

saleRoutes.get('/', asyncHandler(async (req, res) => {
    const { skip, page, limit } = getPagination(req.query);
    const state = req.query.state as string;
    const where: any = {};
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
            discount: discount,
            priceSubtotal: subtotal,
            priceTotal: subtotal * 1.2, // Assuming 20% tax for simplicity
        };
    });

    const amountTax = amountUntaxed * 0.2;
    const amountTotal = amountUntaxed + amountTax;

    return { computedLines, amountUntaxed, amountTax, amountTotal };
}

saleRoutes.post('/', asyncHandler(async (req, res) => {
    const { lines = [], ...orderData } = req.body;
    const count = await prisma.saleOrder.count();

    const { computedLines, amountUntaxed, amountTax, amountTotal } = calculateTotals(lines);

    const order = await prisma.saleOrder.create({
        data: {
            ...orderData,
            name: `SO${String(count + 1).padStart(5, '0')}`,
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
        const { computedLines, amountUntaxed, amountTax, amountTotal } = calculateTotals(lines);
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
