import { Router } from 'express';
import prisma from '../lib/prisma';
import { asyncHandler, getPagination, paginatedResponse } from '../lib/utils';
import { requireAuth } from '../core/auth';

export const marketingWebRoutes = Router();

// ============================================================================
// WEBSITE PAGES (with block-based content)
// ============================================================================
marketingWebRoutes.get('/pages', asyncHandler(async (req, res) => {
    const { skip, page, limit } = getPagination(req.query);
    const published = req.query.published === 'true' ? true : undefined;
    const where: any = {};
    if (published !== undefined) where.isPublished = published;
    const [data, total] = await Promise.all([
        prisma.websitePage.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
        prisma.websitePage.count({ where }),
    ]);
    res.json(paginatedResponse(data, total, page, limit));
}));

marketingWebRoutes.get('/pages/:id', asyncHandler(async (req, res) => {
    const page = await prisma.websitePage.findUnique({ where: { id: parseInt(req.params.id) } });
    if (!page) { res.status(404).json({ error: 'Page not found' }); return; }
    res.json(page);
}));

marketingWebRoutes.use(requireAuth); // Mutating routes require auth

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
// NAVIGATION MENUS
// ============================================================================
marketingWebRoutes.get('/menus', asyncHandler(async (_req, res) => {
    const menus = await prisma.websiteMenu.findMany({
        where: { parentId: null }, // top-level only
        orderBy: { sequence: 'asc' },
        include: {
            children: { orderBy: { sequence: 'asc' } },
        },
    });
    res.json(menus);
}));

marketingWebRoutes.post('/menus', asyncHandler(async (req, res) => {
    const menu = await prisma.websiteMenu.create({ data: req.body });
    res.status(201).json(menu);
}));

marketingWebRoutes.put('/menus/:id', asyncHandler(async (req, res) => {
    const menu = await prisma.websiteMenu.update({ where: { id: parseInt(req.params.id) }, data: req.body });
    res.json(menu);
}));

marketingWebRoutes.delete('/menus/:id', asyncHandler(async (req, res) => {
    await prisma.websiteMenu.delete({ where: { id: parseInt(req.params.id) } });
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
