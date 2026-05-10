import { Router } from 'express';
import prisma from '../lib/prisma';
import { requireAuth } from '../core/auth';
import { asyncHandler } from '../lib/utils';
import { AppError } from '../core/errors';

export const paymentTermRoutes = Router();
paymentTermRoutes.use(requireAuth);

// ── Payment Terms ─────────────────────────────────────────────────────────────

paymentTermRoutes.get('/', asyncHandler(async (_req, res) => {
    const terms = await prisma.paymentTerm.findMany({
        where: { active: true },
        include: { lines: { orderBy: { sequence: 'asc' } } },
        orderBy: { name: 'asc' },
    });
    res.json(terms);
}));

paymentTermRoutes.get('/:id', asyncHandler(async (req, res) => {
    const term = await prisma.paymentTerm.findUnique({
        where: { id: parseInt(req.params.id) },
        include: { lines: { orderBy: { sequence: 'asc' } } },
    });
    if (!term) throw AppError.notFound('PaymentTerm');
    res.json(term);
}));

paymentTermRoutes.post('/', asyncHandler(async (req, res) => {
    const { lines = [], ...data } = req.body;
    const term = await prisma.paymentTerm.create({
        data: {
            ...data,
            lines: lines.length ? { create: lines } : undefined,
        },
        include: { lines: { orderBy: { sequence: 'asc' } } },
    });
    res.status(201).json(term);
}));

paymentTermRoutes.put('/:id', asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id);
    const { lines, ...data } = req.body;

    let linesOp: any = undefined;
    if (Array.isArray(lines)) {
        await prisma.paymentTermLine.deleteMany({ where: { paymentTermId: id } });
        linesOp = { create: lines.map(({ id: _id, paymentTermId: _ptId, ...l }: any) => l) };
    }

    const term = await prisma.paymentTerm.update({
        where: { id },
        data: { ...data, lines: linesOp },
        include: { lines: { orderBy: { sequence: 'asc' } } },
    });
    res.json(term);
}));

paymentTermRoutes.delete('/:id', asyncHandler(async (req, res) => {
    await prisma.paymentTerm.update({
        where: { id: parseInt(req.params.id) },
        data: { active: false },
    });
    res.status(204).send();
}));

// ── Pricelists ────────────────────────────────────────────────────────────────

export const pricelistRoutes = Router();
pricelistRoutes.use(requireAuth);

pricelistRoutes.get('/', asyncHandler(async (_req, res) => {
    const lists = await prisma.pricelist.findMany({
        where: { active: true },
        include: { lines: { include: { product: { select: { id: true, name: true } } }, orderBy: { id: 'asc' } } },
        orderBy: { name: 'asc' },
    });
    res.json(lists);
}));

pricelistRoutes.get('/:id', asyncHandler(async (req, res) => {
    const list = await prisma.pricelist.findUnique({
        where: { id: parseInt(req.params.id) },
        include: { lines: { include: { product: { select: { id: true, name: true } } } } },
    });
    if (!list) throw AppError.notFound('Pricelist');
    res.json(list);
}));

pricelistRoutes.post('/', asyncHandler(async (req, res) => {
    const { lines = [], ...data } = req.body;
    const list = await prisma.pricelist.create({
        data: {
            ...data,
            lines: lines.length ? { create: lines } : undefined,
        },
        include: { lines: true },
    });
    res.status(201).json(list);
}));

pricelistRoutes.put('/:id', asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id);
    const { lines, ...data } = req.body;

    let linesOp: any = undefined;
    if (Array.isArray(lines)) {
        await prisma.pricelistLine.deleteMany({ where: { pricelistId: id } });
        linesOp = { create: lines.map(({ id: _id, pricelistId: _plId, ...l }: any) => l) };
    }

    const list = await prisma.pricelist.update({
        where: { id },
        data: { ...data, lines: linesOp },
        include: { lines: true },
    });
    res.json(list);
}));

pricelistRoutes.delete('/:id', asyncHandler(async (req, res) => {
    await prisma.pricelist.update({
        where: { id: parseInt(req.params.id) },
        data: { active: false },
    });
    res.status(204).send();
}));

// ── Pricelist — compute price for a product ──────────────────────────────────
pricelistRoutes.post('/:id/compute', asyncHandler(async (req, res) => {
    const { productId, qty = 1, date } = req.body as { productId: string; qty?: number; date?: string };
    const priceDate = date ? new Date(date) : new Date();

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw AppError.notFound('Product');

    const line = await prisma.pricelistLine.findFirst({
        where: {
            pricelistId: parseInt(req.params.id),
            minQty: { lte: qty },
            AND: [
                { OR: [{ productId }, { productId: null }] },
                { OR: [{ dateStart: null }, { dateStart: { lte: priceDate } }] },
                { OR: [{ dateEnd: null }, { dateEnd: { gte: priceDate } }] },
            ],
        },
        orderBy: [{ minQty: 'desc' }, { id: 'asc' }],
    });

    const basePrice: number = (product as any).listPrice ?? (product as any).salesPrice ?? 0;
    let computedPrice = basePrice;
    if (line) {
        computedPrice = line.fixedPrice != null
            ? line.fixedPrice
            : basePrice * (1 - line.priceDiscount / 100);
    }

    res.json({ productId, qty, basePrice, computedPrice, lineApplied: line ?? null });
}));
