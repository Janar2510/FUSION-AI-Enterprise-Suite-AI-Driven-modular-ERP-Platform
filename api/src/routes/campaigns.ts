import { Router } from 'express';
import prisma from '../lib/prisma';
import { asyncHandler, getPagination, paginatedResponse } from '../lib/utils';

export const campaignRoutes = Router();

campaignRoutes.get('/', asyncHandler(async (req, res) => {
    const { page, limit, skip } = getPagination(req.query);
    const [data, total] = await Promise.all([
        prisma.marketingCampaign.findMany({ skip, take: limit, orderBy: { createdAt: 'desc' } }),
        prisma.marketingCampaign.count(),
    ]);
    res.json(paginatedResponse(data, total, page, limit));
}));

campaignRoutes.get('/:id', asyncHandler(async (req, res) => {
    const campaign = await prisma.marketingCampaign.findUniqueOrThrow({ where: { id: +req.params.id } });
    res.json(campaign);
}));

campaignRoutes.post('/', asyncHandler(async (req, res) => {
    const campaign = await prisma.marketingCampaign.create({ data: req.body });
    res.status(201).json(campaign);
}));

campaignRoutes.put('/:id', asyncHandler(async (req, res) => {
    const campaign = await prisma.marketingCampaign.update({ where: { id: +req.params.id }, data: req.body });
    res.json(campaign);
}));

campaignRoutes.delete('/:id', asyncHandler(async (req, res) => {
    await prisma.marketingCampaign.delete({ where: { id: +req.params.id } });
    res.json({ success: true });
}));
