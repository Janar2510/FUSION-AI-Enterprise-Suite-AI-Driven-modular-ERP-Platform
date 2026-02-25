import { Router } from 'express';
import prisma from '../lib/prisma';
import { asyncHandler, getPagination, paginatedResponse } from '../lib/utils';

export const partnerRoutes = Router();

// List all partners with pagination, search, and filtering
partnerRoutes.get('/', asyncHandler(async (req, res) => {
    const { skip, page, limit } = getPagination(req.query);
    const search = (req.query.search as string) || '';
    const type = req.query.type as string;
    const isCompany = req.query.is_company;

    const where: any = { active: true };
    if (search) {
        where.OR = [
            { name: { contains: search } },
            { email: { contains: search } },
            { phone: { contains: search } },
        ];
    }
    if (type) where.type = type;
    if (isCompany !== undefined) where.isCompany = isCompany === 'true';

    const [data, total] = await Promise.all([
        prisma.partner.findMany({ where, skip, take: limit, orderBy: { name: 'asc' }, include: { parent: true, tags: true } }),
        prisma.partner.count({ where }),
    ]);

    res.json(paginatedResponse(data, total, page, limit));
}));

// Get single partner
partnerRoutes.get('/:id', asyncHandler(async (req, res) => {
    const partner = await prisma.partner.findUnique({
        where: { id: parseInt(req.params.id) },
        include: { parent: true, children: true, tags: true, crmLeads: true, saleOrders: { take: 5 } },
    });
    if (!partner) { res.status(404).json({ error: 'Partner not found' }); return; }
    res.json(partner);
}));

// Create partner
partnerRoutes.post('/', asyncHandler(async (req, res) => {
    const partner = await prisma.partner.create({ data: req.body });
    res.status(201).json(partner);
}));

// Update partner
partnerRoutes.put('/:id', asyncHandler(async (req, res) => {
    const partner = await prisma.partner.update({
        where: { id: parseInt(req.params.id) },
        data: req.body,
    });
    res.json(partner);
}));

// Archive (soft delete) partner
partnerRoutes.delete('/:id', asyncHandler(async (req, res) => {
    await prisma.partner.update({ where: { id: parseInt(req.params.id) }, data: { active: false } });
    res.json({ success: true });
}));
