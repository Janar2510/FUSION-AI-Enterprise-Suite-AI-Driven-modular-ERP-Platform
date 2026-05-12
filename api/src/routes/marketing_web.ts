import { Router } from 'express';
import prisma from '../lib/prisma';
import { asyncHandler, getPagination, paginatedResponse } from '../lib/utils';
import { requireAuth, requirePermission } from '../core/auth';
import { PERMISSIONS } from '../core/auth/roles';

export const marketingWebRoutes = Router();
marketingWebRoutes.use(requireAuth);

const r = PERMISSIONS.MARKETING_READ;
const w = PERMISSIONS.MARKETING_WRITE;

// ============================================================================
// WEBSITE PAGES (with block-based content)
// ============================================================================
marketingWebRoutes.get('/pages', requirePermission(r), asyncHandler(async (req, res) => {
    const { skip, page, limit } = getPagination(req.query);
    const published = req.query.published === 'true' ? true : undefined;
    const where: { isPublished?: boolean } = {};
    if (published !== undefined) where.isPublished = published;
    const [data, total] = await Promise.all([
        prisma.websitePage.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
        prisma.websitePage.count({ where }),
    ]);
    res.json(paginatedResponse(data, total, page, limit));
}));

marketingWebRoutes.get('/pages/:id', requirePermission(r), asyncHandler(async (req, res) => {
    const page = await prisma.websitePage.findUnique({ where: { id: parseInt(req.params.id) } });
    if (!page) { res.status(404).json({ error: 'Page not found' }); return; }
    res.json(page);
}));

marketingWebRoutes.post('/pages', requirePermission(w), asyncHandler(async (req, res) => {
    const pageItem = await prisma.websitePage.create({ data: req.body });
    res.status(201).json(pageItem);
}));

marketingWebRoutes.put('/pages/:id', requirePermission(w), asyncHandler(async (req, res) => {
    const pageItem = await prisma.websitePage.update({ where: { id: parseInt(req.params.id) }, data: req.body });
    res.json(pageItem);
}));

marketingWebRoutes.delete('/pages/:id', requirePermission(w), asyncHandler(async (req, res) => {
    await prisma.websitePage.delete({ where: { id: parseInt(req.params.id) } });
    res.status(204).send();
}));

// ============================================================================
// NAVIGATION MENUS
// ============================================================================
marketingWebRoutes.get('/menus', requirePermission(r), asyncHandler(async (_req, res) => {
    const menus = await prisma.websiteMenu.findMany({
        where: { parentId: null },
        orderBy: { sequence: 'asc' },
        include: {
            children: { orderBy: { sequence: 'asc' } },
        },
    });
    res.json(menus);
}));

marketingWebRoutes.post('/menus', requirePermission(w), asyncHandler(async (req, res) => {
    const menu = await prisma.websiteMenu.create({ data: req.body });
    res.status(201).json(menu);
}));

marketingWebRoutes.put('/menus/:id', requirePermission(w), asyncHandler(async (req, res) => {
    const menu = await prisma.websiteMenu.update({ where: { id: parseInt(req.params.id) }, data: req.body });
    res.json(menu);
}));

marketingWebRoutes.delete('/menus/:id', requirePermission(w), asyncHandler(async (req, res) => {
    await prisma.websiteMenu.delete({ where: { id: parseInt(req.params.id) } });
    res.status(204).send();
}));

// ============================================================================
// EMAIL MARKETING (Mass Mailing)
// ============================================================================
marketingWebRoutes.get('/mailings', requirePermission(r), asyncHandler(async (req, res) => {
    const { skip, page, limit } = getPagination(req.query);
    const [data, total] = await Promise.all([
        prisma.massMailing.findMany({ skip, take: limit, orderBy: { createdAt: 'desc' } }),
        prisma.massMailing.count(),
    ]);
    res.json(paginatedResponse(data, total, page, limit));
}));

marketingWebRoutes.post('/mailings', requirePermission(w), asyncHandler(async (req, res) => {
    const mailing = await prisma.massMailing.create({ data: req.body });
    res.status(201).json(mailing);
}));

marketingWebRoutes.put('/mailings/:id', requirePermission(w), asyncHandler(async (req, res) => {
    const mailing = await prisma.massMailing.update({ where: { id: parseInt(req.params.id) }, data: req.body });
    res.json(mailing);
}));

marketingWebRoutes.delete('/mailings/:id', requirePermission(w), asyncHandler(async (req, res) => {
    await prisma.massMailing.delete({ where: { id: parseInt(req.params.id) } });
    res.status(204).send();
}));

// ============================================================================
// SOCIAL POSTS
// ============================================================================
marketingWebRoutes.get('/social', requirePermission(r), asyncHandler(async (req, res) => {
    const { skip, page, limit } = getPagination(req.query);
    const [data, total] = await Promise.all([
        prisma.socialPost.findMany({ skip, take: limit, orderBy: { createdAt: 'desc' } }),
        prisma.socialPost.count(),
    ]);
    res.json(paginatedResponse(data, total, page, limit));
}));

marketingWebRoutes.post('/social', requirePermission(w), asyncHandler(async (req, res) => {
    const post = await prisma.socialPost.create({ data: req.body });
    res.status(201).json(post);
}));

marketingWebRoutes.put('/social/:id', requirePermission(w), asyncHandler(async (req, res) => {
    const post = await prisma.socialPost.update({ where: { id: parseInt(req.params.id) }, data: req.body });
    res.json(post);
}));

marketingWebRoutes.delete('/social/:id', requirePermission(w), asyncHandler(async (req, res) => {
    await prisma.socialPost.delete({ where: { id: parseInt(req.params.id) } });
    res.status(204).send();
}));
