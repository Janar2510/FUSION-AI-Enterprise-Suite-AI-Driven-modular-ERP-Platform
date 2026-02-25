import { Router } from 'express';
import prisma from '../lib/prisma';
import { asyncHandler, getPagination, paginatedResponse } from '../lib/utils';

export const marketingWebRoutes = Router();

// ============================================================================
// WEBSITE PAGES
// ============================================================================
marketingWebRoutes.get('/pages', asyncHandler(async (req, res) => {
    const { skip, page, limit } = getPagination(req.query);
    const [data, total] = await Promise.all([
        prisma.websitePage.findMany({ skip, take: limit, orderBy: { createdAt: 'desc' } }),
        prisma.websitePage.count(),
    ]);
    res.json(paginatedResponse(data, total, page, limit));
}));

marketingWebRoutes.post('/pages', asyncHandler(async (req, res) => {
    const pageItem = await prisma.websitePage.create({ data: req.body });
    res.status(201).json(pageItem);
}));

marketingWebRoutes.put('/pages/:id', asyncHandler(async (req, res) => {
    const pageItem = await prisma.websitePage.update({ where: { id: parseInt(req.params.id) }, data: req.body });
    res.json(pageItem);
}));

marketingWebRoutes.delete('/pages/:id', asyncHandler(async (req, res) => {
    await prisma.websitePage.delete({ where: { id: parseInt(req.params.id) } });
    res.status(204).send();
}));

// ============================================================================
// EMAIL MARKETING (Mass Mailing)
// ============================================================================
marketingWebRoutes.get('/mailings', asyncHandler(async (req, res) => {
    const { skip, page, limit } = getPagination(req.query);
    const [data, total] = await Promise.all([
        prisma.massMailing.findMany({ skip, take: limit, orderBy: { createdAt: 'desc' } }),
        prisma.massMailing.count(),
    ]);
    res.json(paginatedResponse(data, total, page, limit));
}));

marketingWebRoutes.post('/mailings', asyncHandler(async (req, res) => {
    const mailing = await prisma.massMailing.create({ data: req.body });
    res.status(201).json(mailing);
}));

marketingWebRoutes.put('/mailings/:id', asyncHandler(async (req, res) => {
    const mailing = await prisma.massMailing.update({ where: { id: parseInt(req.params.id) }, data: req.body });
    res.json(mailing);
}));

marketingWebRoutes.delete('/mailings/:id', asyncHandler(async (req, res) => {
    await prisma.massMailing.delete({ where: { id: parseInt(req.params.id) } });
    res.status(204).send();
}));

// ============================================================================
// SOCIAL POSTS
// ============================================================================
marketingWebRoutes.get('/social', asyncHandler(async (req, res) => {
    const { skip, page, limit } = getPagination(req.query);
    const [data, total] = await Promise.all([
        prisma.socialPost.findMany({ skip, take: limit, orderBy: { createdAt: 'desc' } }),
        prisma.socialPost.count(),
    ]);
    res.json(paginatedResponse(data, total, page, limit));
}));

marketingWebRoutes.post('/social', asyncHandler(async (req, res) => {
    const post = await prisma.socialPost.create({ data: req.body });
    res.status(201).json(post);
}));

marketingWebRoutes.put('/social/:id', asyncHandler(async (req, res) => {
    const post = await prisma.socialPost.update({ where: { id: parseInt(req.params.id) }, data: req.body });
    res.json(post);
}));

marketingWebRoutes.delete('/social/:id', asyncHandler(async (req, res) => {
    await prisma.socialPost.delete({ where: { id: parseInt(req.params.id) } });
    res.status(204).send();
}));
