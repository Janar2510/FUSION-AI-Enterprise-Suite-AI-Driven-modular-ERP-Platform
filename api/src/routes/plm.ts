import { Router } from 'express';
import prisma from '../lib/prisma';
import { asyncHandler, getPagination, paginatedResponse } from '../lib/utils';

export const plmRoutes = Router();

// Get all ECOs
plmRoutes.get('/', asyncHandler(async (req, res) => {
    const { skip, page, limit } = getPagination(req.query);
    const [data, total] = await Promise.all([
        prisma.mrpEco.findMany({
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: {
                product: { select: { id: true, name: true } },
                bom: { select: { id: true, name: true, code: true } }
            }
        }),
        prisma.mrpEco.count(),
    ]);
    res.json(paginatedResponse(data, total, page, limit));
}));

// Get single ECO
plmRoutes.get('/:id', asyncHandler(async (req, res) => {
    const data = await prisma.mrpEco.findUnique({
        where: { id: parseInt(req.params.id) },
        include: {
            product: true,
            bom: { include: { lines: { include: { product: true } } } }
        }
    });
    if (!data) return res.status(404).json({ error: 'ECO not found' });
    res.json(data);
}));

// Create ECO
plmRoutes.post('/', asyncHandler(async (req, res) => {
    const eco = await prisma.mrpEco.create({
        data: req.body,
        include: { product: true, bom: true }
    });
    res.status(201).json(eco);
}));

// Update ECO
plmRoutes.put('/:id', asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id);
    const updates = req.body;

    // If we receive a command to change stage to done and apply changes
    if (updates.stage === 'done') {
        const eco = await prisma.mrpEco.findUnique({ where: { id } });
        if (!eco || eco.approvalState === 'rejected') {
            return res.status(400).json({ error: 'Cannot apply ECO changes if not approved or if it does not exist.' });
        }

        // MVP: Applying ECO simply moves stage to done. Future extension: modify BOM lines
        updates.effectivityDate = new Date();
    }

    const eco = await prisma.mrpEco.update({
        where: { id },
        data: updates,
        include: { product: true, bom: true }
    });
    res.json(eco);
}));

// Delete ECO
plmRoutes.delete('/:id', asyncHandler(async (req, res) => {
    await prisma.mrpEco.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ success: true });
}));
