import { Router } from 'express';
import prisma from '../lib/prisma';
import { asyncHandler, getPagination, paginatedResponse } from '../lib/utils';

export const productRoutes = Router();

productRoutes.get('/', asyncHandler(async (req, res) => {
    const { skip, page, limit } = getPagination(req.query);
    const search = (req.query.search as string) || '';
    const type = req.query.type as string;
    const where: any = { active: true };
    if (search) where.OR = [{ name: { contains: search } }, { internalRef: { contains: search } }];
    if (type) where.type = type;

    const [data, total] = await Promise.all([
        prisma.product.findMany({ where, skip, take: limit, orderBy: { name: 'asc' }, include: { category: true } }),
        prisma.product.count({ where }),
    ]);
    res.json(paginatedResponse(data, total, page, limit));
}));

productRoutes.get('/categories', asyncHandler(async (_req, res) => {
    const categories = await prisma.productCategory.findMany({ include: { _count: { select: { products: true } } } });
    res.json(categories);
}));

productRoutes.get('/:id', asyncHandler(async (req, res) => {
    const product = await prisma.product.findUnique({ where: { id: parseInt(req.params.id) }, include: { category: true } });
    if (!product) { res.status(404).json({ error: 'Product not found' }); return; }
    res.json(product);
}));

productRoutes.post('/', asyncHandler(async (req, res) => {
    const product = await prisma.product.create({ data: req.body });
    res.status(201).json(product);
}));

productRoutes.put('/:id', asyncHandler(async (req, res) => {
    const product = await prisma.product.update({ where: { id: parseInt(req.params.id) }, data: req.body });
    res.json(product);
}));

productRoutes.delete('/:id', asyncHandler(async (req, res) => {
    await prisma.product.update({ where: { id: parseInt(req.params.id) }, data: { active: false } });
    res.json({ success: true });
}));
