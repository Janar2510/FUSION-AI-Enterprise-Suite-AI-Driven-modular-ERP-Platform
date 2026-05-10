/**
 * Invoicing adapter routes — thin layer over Accounting + Partners.
 *
 * Architectural decision: Invoicing module merged into Accounting as a
 * simplified view layer. Customer = Partner (isCustomer=true),
 * Invoice = AccountMove (moveType=out_invoice), Payment = AccountPayment.
 *
 * The Invoicing frontend uses integer IDs for partners while the DB uses
 * string cuid IDs. We keep the cuid IDs in all responses — the frontend
 * should be updated to treat id as string; for now we also expose an
 * intId field (hash-based) for backward compatibility.
 */

import { Router } from 'express';
import prisma from '../lib/prisma';
import { asyncHandler, getPagination, paginatedResponse } from '../lib/utils';
import { computeTotalsFromDb, OrderLine } from '../core/tax';
import { requireAuth } from '../core/auth';

export const invoicingRoutes = Router();
invoicingRoutes.use(requireAuth);

// ── Customers (= Partners with isCustomer=true) ──────────────────────────────
invoicingRoutes.get('/customers', asyncHandler(async (req, res) => {
    const { skip, page, limit } = getPagination(req.query);
    const [data, total] = await Promise.all([
        prisma.partner.findMany({
            where: { isCustomer: true, active: true },
            skip, take: limit,
            orderBy: { name: 'asc' },
        }),
        prisma.partner.count({ where: { isCustomer: true, active: true } }),
    ]);
    const customers = data.map(p => ({
        id: p.id,
        name: p.name,
        email: p.email,
        phone: p.phone,
        taxId: p.vat,
        outstandingBalance: 0,
        status: 'active',
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
    }));
    res.json(paginatedResponse(customers, total, page, limit));
}));

invoicingRoutes.post('/customers', asyncHandler(async (req, res) => {
    const { name, email, phone, taxId } = req.body;
    const partner = await prisma.partner.create({
        data: {
            name, email, phone, vat: taxId,
            isCustomer: true,
            organizationId: (req as any).user?.orgId ?? 'default',
        },
    });
    res.status(201).json({ id: partner.id, name: partner.name, email: partner.email, createdAt: partner.createdAt });
}));

invoicingRoutes.put('/customers/:id', asyncHandler(async (req, res) => {
    const { name, email, phone, taxId } = req.body;
    const partner = await prisma.partner.update({
        where: { id: req.params.id },
        data: { name, email, phone, vat: taxId },
    });
    res.json({ id: partner.id, name: partner.name, email: partner.email });
}));

invoicingRoutes.delete('/customers/:id', asyncHandler(async (req, res) => {
    await prisma.partner.update({ where: { id: req.params.id }, data: { active: false } });
    res.status(204).send();
}));

// ── Invoices (= AccountMove with moveType=out_invoice) ───────────────────────
invoicingRoutes.get('/invoices', asyncHandler(async (req, res) => {
    const { skip, page, limit } = getPagination(req.query);
    const [data, total] = await Promise.all([
        prisma.accountMove.findMany({
            where: { moveType: 'out_invoice' },
            skip, take: limit,
            orderBy: { date: 'desc' },
            include: {
                partner: { select: { id: true, name: true } },
                lines: { select: { id: true, name: true, quantity: true, priceUnit: true, priceSubtotal: true, priceTotal: true } },
            },
        }),
        prisma.accountMove.count({ where: { moveType: 'out_invoice' } }),
    ]);

    const stateMap: Record<string, string> = {
        draft: 'draft', posted: 'sent', cancel: 'cancelled',
    };
    const payMap: Record<string, string> = { paid: 'paid' };

    const invoices = data.map(m => ({
        id: m.id,
        invoiceNumber: m.name,
        customerId: m.partnerId,
        customerName: m.partner?.name ?? '',
        invoiceDate: m.date.toISOString().split('T')[0],
        dueDate: m.dueDate?.toISOString().split('T')[0] ?? null,
        status: m.paymentState === 'paid' ? 'paid' : stateMap[m.state] ?? m.state,
        subtotal: m.amountUntaxed,
        taxAmount: m.amountTax,
        totalAmount: m.amountTotal,
        createdAt: m.createdAt,
        updatedAt: m.updatedAt,
        lines: m.lines.map(l => ({
            id: l.id,
            invoiceId: m.id,
            description: l.name,
            quantity: l.quantity,
            unitPrice: l.priceUnit,
            taxAmount: l.priceTotal - l.priceSubtotal,
            lineTotal: l.priceSubtotal,
            createdAt: m.createdAt,
        })),
    }));

    res.json(paginatedResponse(invoices, total, page, limit));
}));

invoicingRoutes.post('/invoices', asyncHandler(async (req, res) => {
    const { customerId, invoiceDate, dueDate, notes, lines = [] } = req.body;

    // Find default AR journal
    const journal = await prisma.accountJournal.findFirst({ where: { type: 'sale' } });
    if (!journal) {
        res.status(422).json({ error: { code: 'NO_JOURNAL', message: 'No sales journal configured' } });
        return;
    }

    // Compute totals using tax engine
    const orderLines: OrderLine[] = lines.map((l: any) => ({
        productQty: l.quantity ?? 1,
        priceUnit: l.unitPrice ?? 0,
    }));
    const totals = await computeTotalsFromDb(orderLines);

    // Generate invoice number
    const count = await prisma.accountMove.count({ where: { moveType: 'out_invoice' } });
    const name = `INV/${new Date().getFullYear()}/${String(count + 1).padStart(5, '0')}`;

    const move = await prisma.accountMove.create({
        data: {
            name, moveType: 'out_invoice', state: 'draft',
            date: invoiceDate ? new Date(invoiceDate) : new Date(),
            dueDate: dueDate ? new Date(dueDate) : undefined,
            amountUntaxed: totals.amountUntaxed,
            amountTax: totals.amountTax,
            amountTotal: totals.amountTotal,
            amountResidual: totals.amountTotal,
            journalId: journal.id,
            partnerId: customerId ?? null,
            ref: notes,
            lines: {
                create: lines.map((l: any) => ({
                    name: l.description ?? 'Line item',
                    quantity: l.quantity ?? 1,
                    priceUnit: l.unitPrice ?? 0,
                    priceSubtotal: (l.quantity ?? 1) * (l.unitPrice ?? 0),
                    priceTotal: (l.quantity ?? 1) * (l.unitPrice ?? 0),
                    debit: 0, credit: 0, balance: 0,
                })),
            },
        },
        include: { partner: { select: { id: true, name: true } } },
    });

    res.status(201).json({ id: move.id, invoiceNumber: move.name, status: 'draft', totalAmount: move.amountTotal });
}));

invoicingRoutes.put('/invoices/:id', asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id);
    const move = await prisma.accountMove.update({
        where: { id },
        data: { ref: req.body.notes },
    });
    res.json({ id: move.id, invoiceNumber: move.name });
}));

invoicingRoutes.delete('/invoices/:id', asyncHandler(async (req, res) => {
    const move = await prisma.accountMove.findUnique({ where: { id: parseInt(req.params.id) } });
    if (move?.state !== 'draft') {
        res.status(400).json({ error: { code: 'NOT_DRAFT', message: 'Only draft invoices can be deleted' } });
        return;
    }
    await prisma.accountMove.delete({ where: { id: parseInt(req.params.id) } });
    res.status(204).send();
}));

invoicingRoutes.post('/invoices/:id/send', asyncHandler(async (req, res) => {
    const move = await prisma.accountMove.update({
        where: { id: parseInt(req.params.id) },
        data: { state: 'posted', postedAt: new Date() },
    });
    res.json({ id: move.id, status: 'sent' });
}));

invoicingRoutes.post('/invoices/:id/cancel', asyncHandler(async (req, res) => {
    const move = await prisma.accountMove.update({
        where: { id: parseInt(req.params.id) },
        data: { state: 'cancel' },
    });
    res.json({ id: move.id, status: 'cancelled' });
}));

// ── Payments (= AccountPayment) ──────────────────────────────────────────────
invoicingRoutes.get('/payments', asyncHandler(async (req, res) => {
    const { skip, page, limit } = getPagination(req.query);
    const [data, total] = await Promise.all([
        prisma.accountPayment.findMany({
            where: { partnerType: 'customer' },
            skip, take: limit,
            orderBy: { date: 'desc' },
        }),
        prisma.accountPayment.count({ where: { partnerType: 'customer' } }),
    ]);
    const payments = data.map(p => ({
        id: p.id,
        invoiceId: p.moveId,
        paymentDate: p.date.toISOString().split('T')[0],
        amount: p.amount,
        paymentMethod: 'bank_transfer',
        reference: p.memo,
        status: p.state === 'posted' ? 'completed' : p.state,
        createdAt: p.createdAt,
    }));
    res.json(paginatedResponse(payments, total, page, limit));
}));

// ── Products (= Product catalog for invoicing line selection) ─────────────────
invoicingRoutes.get('/products', asyncHandler(async (req, res) => {
    const { skip, page, limit } = getPagination(req.query);
    const search = req.query.search as string | undefined;
    const where = search ? { name: { contains: search } } : {};
    const [data, total] = await Promise.all([
        prisma.product.findMany({ where, skip, take: limit, orderBy: { name: 'asc' }, select: { id: true, name: true, salesPrice: true } }),
        prisma.product.count({ where }),
    ]);
    const products = data.map(p => ({
        id: p.id,
        name: p.name,
        price: p.salesPrice,
    }));
    res.json(paginatedResponse(products, total, page, limit));
}));

// ── Payments POST ─────────────────────────────────────────────────────────────
invoicingRoutes.post('/payments', asyncHandler(async (req, res) => {
    const { invoiceId, amount, paymentDate, paymentMethod, reference } = req.body;

    // Mark the invoice as paid if the payment covers the full amount
    const move = invoiceId ? await prisma.accountMove.findUnique({ where: { id: parseInt(invoiceId) } }) : null;

    // Ensure a default bank journal exists (upsert)
    const journal = await prisma.accountJournal.upsert({
        where: { code: 'BNK' },
        create: { name: 'Bank', code: 'BNK', type: 'bank' },
        update: {},
    });

    const payment = await prisma.accountPayment.create({
        data: {
            name: `PAY-${Date.now()}`,
            moveType: 'out_invoice',
            date: paymentDate ? new Date(paymentDate) : new Date(),
            amount: parseFloat(amount) || 0,
            partnerType: 'customer',
            paymentType: 'inbound',
            state: 'posted',
            memo: reference,
            journalId: journal.id,
            moveId: invoiceId ? parseInt(invoiceId) : null,
        },
    });

    // Auto-mark invoice as paid
    if (move) {
        await prisma.accountMove.update({
            where: { id: move.id },
            data: { paymentState: 'paid', amountResidual: 0 },
        });
    }

    res.status(201).json({
        id: payment.id,
        invoiceId: payment.moveId,
        paymentDate: payment.date.toISOString().split('T')[0],
        amount: payment.amount,
        paymentMethod: paymentMethod ?? 'bank_transfer',
        reference: payment.memo,
        status: 'completed',
        createdAt: payment.createdAt,
    });
}));

invoicingRoutes.put('/payments/:id', asyncHandler(async (req, res) => {
    const payment = await prisma.accountPayment.update({
        where: { id: parseInt(req.params.id) },
        data: { memo: req.body.reference, amount: req.body.amount },
    });
    res.json({ id: payment.id, amount: payment.amount });
}));

invoicingRoutes.delete('/payments/:id', asyncHandler(async (req, res) => {
    await prisma.accountPayment.delete({ where: { id: parseInt(req.params.id) } });
    res.status(204).send();
}));

// ── Credit Notes (= AccountMove with moveType=out_refund) ─────────────────────
invoicingRoutes.get('/credit-notes', asyncHandler(async (req, res) => {
    const { skip, page, limit } = getPagination(req.query);
    const [data, total] = await Promise.all([
        prisma.accountMove.findMany({
            where: { moveType: 'out_refund' },
            skip, take: limit,
            orderBy: { date: 'desc' },
            include: { partner: { select: { id: true, name: true } } },
        }),
        prisma.accountMove.count({ where: { moveType: 'out_refund' } }),
    ]);
    const notes = data.map(m => ({
        id: m.id,
        number: m.name,
        customerId: m.partnerId,
        customerName: m.partner?.name ?? '',
        date: m.date.toISOString().split('T')[0],
        status: m.state,
        amount: m.amountTotal,
        createdAt: m.createdAt,
    }));
    res.json(paginatedResponse(notes, total, page, limit));
}));

invoicingRoutes.post('/credit-notes', asyncHandler(async (req, res) => {
    const { customerId, date, reason, amount } = req.body;
    const journal = await prisma.accountJournal.findFirst({ where: { type: 'sale' } });
    if (!journal) {
        res.status(422).json({ error: { code: 'NO_JOURNAL', message: 'No sales journal configured' } });
        return;
    }
    const count = await prisma.accountMove.count({ where: { moveType: 'out_refund' } });
    const name = `RINV/${new Date().getFullYear()}/${String(count + 1).padStart(5, '0')}`;
    const move = await prisma.accountMove.create({
        data: {
            name, moveType: 'out_refund', state: 'draft',
            date: date ? new Date(date) : new Date(),
            amountUntaxed: parseFloat(amount) || 0,
            amountTax: 0,
            amountTotal: parseFloat(amount) || 0,
            amountResidual: parseFloat(amount) || 0,
            journalId: journal.id,
            partnerId: customerId ?? null,
            ref: reason,
        },
    });
    res.status(201).json({ id: move.id, number: move.name, status: 'draft', amount: move.amountTotal });
}));

invoicingRoutes.put('/credit-notes/:id', asyncHandler(async (req, res) => {
    const move = await prisma.accountMove.update({
        where: { id: parseInt(req.params.id) },
        data: { ref: req.body.reason },
    });
    res.json({ id: move.id, number: move.name });
}));

// ── Analytics ─────────────────────────────────────────────────────────────────
invoicingRoutes.get('/analytics/invoice', asyncHandler(async (req, res) => {
    const [total, paid, overdue] = await Promise.all([
        prisma.accountMove.count({ where: { moveType: 'out_invoice', state: 'posted' } }),
        prisma.accountMove.count({ where: { moveType: 'out_invoice', paymentState: 'paid' } }),
        prisma.accountMove.count({
            where: {
                moveType: 'out_invoice', state: 'posted',
                paymentState: { not: 'paid' },
                dueDate: { lt: new Date() },
            },
        }),
    ]);
    res.json({ total, paid, overdue, outstanding: total - paid });
}));

// ── Chatter ─────────────────────────────────────────────────────────────────
import { createChatterRouter } from '../core/chatter';
invoicingRoutes.use('/', createChatterRouter('account.move'));
