import { Router } from 'express';
import prisma from '../lib/prisma';
import { asyncHandler, getPagination, paginatedResponse } from '../lib/utils';

export const subscriptionRoutes = Router();

// ── Subscriptions CRUD ────────────────────────────────────────────────────────
subscriptionRoutes.get('/', asyncHandler(async (req, res) => {
    const { page, limit, skip } = getPagination(req.query);
    const state = req.query.state as string | undefined;
    const where = state ? { state } : {};
    const [data, total] = await Promise.all([
        prisma.subscription.findMany({
            where,
            skip, take: limit,
            include: {
                partner: { select: { id: true, name: true, email: true } },
                lines: { include: { product: { select: { id: true, name: true } } } },
            },
            orderBy: { createdAt: 'desc' },
        }),
        prisma.subscription.count({ where }),
    ]);
    res.json(paginatedResponse(data, total, page, limit));
}));

subscriptionRoutes.get('/:id', asyncHandler(async (req, res) => {
    const sub = await prisma.subscription.findUnique({
        where: { id: +req.params.id },
        include: {
            partner: true,
            lines: { include: { product: { select: { id: true, name: true } } } },
        },
    });
    if (!sub) { res.status(404).json({ error: 'Subscription not found' }); return; }
    res.json(sub);
}));

subscriptionRoutes.post('/', asyncHandler(async (req, res) => {
    const { lines, ...data } = req.body;
    const sub = await prisma.subscription.create({
        data: {
            ...data,
            lines: lines?.length ? { create: lines } : undefined,
        },
        include: { lines: true },
    });
    res.status(201).json(sub);
}));

subscriptionRoutes.put('/:id', asyncHandler(async (req, res) => {
    const { lines, ...data } = req.body;
    const sub = await prisma.subscription.update({
        where: { id: +req.params.id },
        data,
        include: { lines: true },
    });
    res.json(sub);
}));

subscriptionRoutes.delete('/:id', asyncHandler(async (req, res) => {
    await prisma.subscription.delete({ where: { id: +req.params.id } });
    res.status(204).send();
}));

// ── Subscription State Transitions ────────────────────────────────────────────
subscriptionRoutes.patch('/:id/activate', asyncHandler(async (req, res) => {
    const sub = await prisma.subscription.update({
        where: { id: +req.params.id },
        data: {
            state: 'active',
            startDate: new Date(),
            nextBilling: computeNextBilling(new Date(), req.body.recurringRule),
        },
    });
    res.json(sub);
}));

subscriptionRoutes.patch('/:id/pause', asyncHandler(async (req, res) => {
    const sub = await prisma.subscription.update({
        where: { id: +req.params.id },
        data: { state: 'paused' },
    });
    res.json(sub);
}));

subscriptionRoutes.patch('/:id/cancel', asyncHandler(async (req, res) => {
    const sub = await prisma.subscription.update({
        where: { id: +req.params.id },
        data: { state: 'cancelled', endDate: new Date() },
    });
    res.json(sub);
}));

// ── Renewal / Billing ─────────────────────────────────────────────────────────
subscriptionRoutes.post('/:id/renew', asyncHandler(async (req, res) => {
    const sub = await prisma.subscription.findUnique({
        where: { id: +req.params.id },
        include: {
            partner: { select: { id: true, name: true } },
            lines: true,
        },
    });
    if (!sub) { res.status(404).json({ error: 'Subscription not found' }); return; }
    if (sub.state !== 'active') {
        res.status(422).json({ error: { code: 'NOT_ACTIVE', message: 'Only active subscriptions can be renewed' } });
        return;
    }

    // Find or create a sales journal
    const journal = await prisma.accountJournal.findFirst({ where: { type: 'sale' } });
    if (!journal) {
        res.status(422).json({ error: { code: 'NO_JOURNAL', message: 'No sales journal configured' } });
        return;
    }

    const total = sub.lines.reduce((sum, l) => sum + l.priceSubtotal, 0);
    const count = await prisma.accountMove.count({ where: { moveType: 'out_invoice' } });
    const name = `RINV/${new Date().getFullYear()}/${String(count + 1).padStart(5, '0')}`;

    const invoice = await prisma.accountMove.create({
        data: {
            name,
            moveType: 'out_invoice',
            state: 'draft',
            date: new Date(),
            dueDate: computeNextBilling(new Date(), sub.recurringRule),
            amountUntaxed: total,
            amountTax: 0,
            amountTotal: total,
            amountResidual: total,
            journalId: journal.id,
            partnerId: sub.partnerId,
            ref: `Subscription ${sub.name ?? sub.id} — ${sub.recurringRule} renewal`,
            lines: {
                create: sub.lines.map(l => ({
                    name: l.name,
                    quantity: l.quantity,
                    priceUnit: l.priceUnit,
                    priceSubtotal: l.priceSubtotal,
                    priceTotal: l.priceSubtotal,
                    debit: 0, credit: 0, balance: 0,
                })),
            },
        },
    });

    // Advance nextBilling date
    await prisma.subscription.update({
        where: { id: sub.id },
        data: { nextBilling: computeNextBilling(sub.nextBilling ?? new Date(), sub.recurringRule) },
    });

    res.status(201).json({ invoice, message: 'Renewal invoice created (draft)' });
}));

// ── Subscription Lines CRUD ───────────────────────────────────────────────────
subscriptionRoutes.post('/:id/lines', asyncHandler(async (req, res) => {
    const { name, productId, quantity, priceUnit, discount } = req.body;
    const qty = quantity ?? 1;
    const price = priceUnit ?? 0;
    const disc = discount ?? 0;
    const subtotal = qty * price * (1 - disc / 100);

    const line = await prisma.subscriptionLine.create({
        data: {
            subscriptionId: +req.params.id,
            name, productId, quantity: qty, priceUnit: price,
            discount: disc, priceSubtotal: subtotal,
        },
        include: { product: { select: { id: true, name: true } } },
    });

    // Recalculate MRR
    await recalcMrr(+req.params.id);
    res.status(201).json(line);
}));

subscriptionRoutes.put('/:id/lines/:lineId', asyncHandler(async (req, res) => {
    const { quantity, priceUnit, discount, name } = req.body;
    const qty = quantity ?? 1;
    const price = priceUnit ?? 0;
    const disc = discount ?? 0;

    const line = await prisma.subscriptionLine.update({
        where: { id: +req.params.lineId },
        data: {
            name, quantity: qty, priceUnit: price,
            discount: disc,
            priceSubtotal: qty * price * (1 - disc / 100),
        },
    });
    await recalcMrr(+req.params.id);
    res.json(line);
}));

subscriptionRoutes.delete('/:id/lines/:lineId', asyncHandler(async (req, res) => {
    await prisma.subscriptionLine.delete({ where: { id: +req.params.lineId } });
    await recalcMrr(+req.params.id);
    res.status(204).send();
}));

// ── Analytics ─────────────────────────────────────────────────────────────────
subscriptionRoutes.get('/analytics/mrr', asyncHandler(async (req, res) => {
    const [active, paused, cancelled, totalMrr] = await Promise.all([
        prisma.subscription.count({ where: { state: 'active' } }),
        prisma.subscription.count({ where: { state: 'paused' } }),
        prisma.subscription.count({ where: { state: 'cancelled' } }),
        prisma.subscription.aggregate({ where: { state: 'active' }, _sum: { mrr: true } }),
    ]);
    res.json({
        active, paused, cancelled,
        mrr: Math.round((totalMrr._sum.mrr ?? 0) * 100) / 100,
        arr: Math.round((totalMrr._sum.mrr ?? 0) * 12 * 100) / 100,
    });
}));

// ── Helpers ───────────────────────────────────────────────────────────────────
function computeNextBilling(from: Date, rule: string): Date {
    const d = new Date(from);
    if (rule === 'annual') d.setFullYear(d.getFullYear() + 1);
    else if (rule === 'quarterly') d.setMonth(d.getMonth() + 3);
    else d.setMonth(d.getMonth() + 1); // monthly default
    return d;
}

async function recalcMrr(subscriptionId: number) {
    const lines = await prisma.subscriptionLine.findMany({ where: { subscriptionId } });
    const mrr = lines.reduce((sum, l) => sum + l.priceSubtotal, 0);
    await prisma.subscription.update({ where: { id: subscriptionId }, data: { mrr } });
}
