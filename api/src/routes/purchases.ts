import { Router } from 'express';
import prisma from '../lib/prisma';
import { asyncHandler, getPagination, paginatedResponse } from '../lib/utils';
import { Prisma } from '@prisma/client';
import { confirmPurchaseOrder, createVendorBill, postInvoice, registerPayment } from '../core/flow.service';
import { AppError } from '../core/errors';
import { requireAuth } from '../core/auth';
import { nextval } from '../core/sequence';

export const purchaseRoutes = Router();
purchaseRoutes.use(requireAuth);

// Helper to calculate totals for a purchase order based on its lines
const calculateTotals = (lines: any[]) => {
    let amountUntaxed = 0;

    lines.forEach(line => {
        const lineQty = Number(line.productQty) || 0;
        const linePrice = Number(line.priceUnit) || 0;
        const subtotal = lineQty * linePrice;
        amountUntaxed += subtotal;
    });

    const amountTax = amountUntaxed * 0.15; // Assuming flat 15% tax for parity
    const amountTotal = amountUntaxed + amountTax;

    return { amountUntaxed, amountTax, amountTotal };
};

// GET all purchase orders
purchaseRoutes.get('/', asyncHandler(async (req, res) => {
    const { skip, page, limit } = getPagination(req.query);
    const state = req.query.state as string;
    const where: any = {};
    if (state) where.state = state;

    const [data, total] = await Promise.all([
        prisma.purchaseOrder.findMany({
            where,
            skip,
            take: limit,
            orderBy: { dateOrder: 'desc' },
            include: {
                partner: true,
                lines: { include: { product: true } }
            }
        }),
        prisma.purchaseOrder.count({ where }),
    ]);
    res.json(paginatedResponse(data, total, page, limit));
}));

// GET single purchase order
purchaseRoutes.get('/:id', asyncHandler(async (req, res) => {
    const order = await prisma.purchaseOrder.findUnique({
        where: { id: parseInt(req.params.id) },
        include: {
            partner: true,
            lines: { include: { product: true } },
            pickings: true
        }
    });

    if (!order) {
        res.status(404).json({ error: 'Purchase order not found' });
        return;
    }
    res.json(order);
}));

// POST new purchase order
purchaseRoutes.post('/', asyncHandler(async (req, res) => {
    const { lines, partnerId, ...orderData } = req.body;

    const name = await nextval('purchase.order').catch(() => `PO-ERR`);
    const totals = calculateTotals(lines || []);

    const order = await prisma.purchaseOrder.create({
        data: {
            ...orderData,
            name,
            partnerId: Number(partnerId),
            ...totals,
            lines: {
                create: (lines || []).map((line: any, index: number) => ({
                    sequence: (index + 1) * 10,
                    productId: Number(line.productId),
                    name: line.name || 'Expense',
                    productQty: Number(line.productQty) || 1,
                    priceUnit: Number(line.priceUnit) || 0,
                    priceSubtotal: (Number(line.productQty) || 1) * (Number(line.priceUnit) || 0)
                }))
            }
        },
        include: { partner: true, lines: true }
    });

    res.status(201).json(order);
}));

// PUT update purchase order
purchaseRoutes.put('/:id', asyncHandler(async (req, res) => {
    const orderId = parseInt(req.params.id);
    const { lines, partnerId, ...orderData } = req.body;

    const totals = calculateTotals(lines || []);

    const updateData: Prisma.PurchaseOrderUpdateInput = {
        ...orderData,
        ...totals,
    };

    if (partnerId) {
        updateData.partner = { connect: { id: String(partnerId) } };
    }

    if (lines) {
        const currentLines = await prisma.purchaseOrderLine.findMany({ where: { orderId } });
        const incomingLineIds = lines.filter((l: any) => l.id).map((l: any) => l.id);
        const linesToDelete = currentLines.filter(cl => !incomingLineIds.includes(cl.id));

        updateData.lines = {
            deleteMany: { id: { in: linesToDelete.map(l => l.id) } },
            upsert: lines.map((line: any, index: number) => ({
                where: { id: line.id || 0 }, // 0 won't match, causes create
                update: {
                    sequence: (index + 1) * 10,
                    productId: Number(line.productId),
                    name: line.name || 'Expense',
                    productQty: Number(line.productQty) || 1,
                    priceUnit: Number(line.priceUnit) || 0,
                    priceSubtotal: (Number(line.productQty) || 1) * (Number(line.priceUnit) || 0)
                },
                create: {
                    sequence: (index + 1) * 10,
                    productId: Number(line.productId),
                    name: line.name || 'Expense',
                    productQty: Number(line.productQty) || 1,
                    priceUnit: Number(line.priceUnit) || 0,
                    priceSubtotal: (Number(line.productQty) || 1) * (Number(line.priceUnit) || 0)
                }
            }))
        };
    }

    const order = await prisma.purchaseOrder.update({
        where: { id: orderId },
        data: updateData,
        include: { partner: true, lines: true }
    });

    res.json(order);
}));

// POST confirm purchase order – Flow D: also creates incoming receipt picking
purchaseRoutes.post('/:id/confirm', asyncHandler(async (req, res) => {
    const order = await confirmPurchaseOrder(parseInt(req.params.id));
    res.json(order);
}));

// POST cancel purchase order
purchaseRoutes.post('/:id/cancel', asyncHandler(async (req, res) => {
    const order = await prisma.purchaseOrder.update({
        where: { id: parseInt(req.params.id) },
        data: { state: 'cancel' }
    });
    res.json(order);
}));

// Flow D – Create vendor bill from confirmed PO (idempotent)
purchaseRoutes.post('/:id/bill', asyncHandler(async (req, res) => {
    const bill = await createVendorBill(parseInt(req.params.id), req.body.idempotencyKey);
    res.status(201).json(bill);
}));

// Flow D – Post (confirm) a vendor bill
purchaseRoutes.post('/:id/post-bill', asyncHandler(async (req, res) => {
    const { billId } = req.body;
    if (!billId) throw AppError.validation('billId is required');
    const posted = await postInvoice(parseInt(billId));
    res.json(posted);
}));

// Flow D – Register vendor payment
purchaseRoutes.post('/:id/pay-bill', asyncHandler(async (req, res) => {
    const { billId, amount, journalId, memo, idempotencyKey } = req.body;
    if (!billId) throw AppError.validation('billId is required');
    if (!amount || amount <= 0) throw AppError.validation('amount must be greater than 0');
    const payment = await registerPayment(parseInt(billId), { amount, journalId, memo, idempotencyKey });
    res.status(201).json(payment);
}));
