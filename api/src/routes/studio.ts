import { Router } from 'express';
import prisma from '../lib/prisma';
import { requireAuth } from '../core/auth';
import { asyncHandler, getPagination, paginatedResponse } from '../lib/utils';

export const studioRoutes = Router();
studioRoutes.use(requireAuth);

function mapPage(r: any) {
    return {
        id: r.id,
        name: r.name,
        slug: r.slug,
        content: r.content,
        metaTitle: r.metaTitle,
        metaDescription: r.metaDescription,
        state: r.state,
        publishedAt: r.publishedAt?.toISOString() ?? null,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
    };
}

studioRoutes.get('/pages', asyncHandler(async (req, res) => {
    const { skip, limit } = getPagination(req.query);
    const state = req.query.state as string | undefined;
    const where: any = {};
    if (state) where.state = state;

    const [data, total] = await Promise.all([
        prisma.studioPage.findMany({ where, skip, take: limit, orderBy: { updatedAt: 'desc' } }),
        prisma.studioPage.count({ where }),
    ]);
    res.json(paginatedResponse(data.map(mapPage), total, skip / limit + 1, limit));
}));

studioRoutes.get('/pages/:id', asyncHandler(async (req, res) => {
    const page = await prisma.studioPage.findUnique({ where: { id: Number(req.params.id) } });
    if (!page) { res.status(404).json({ error: 'Page not found' }); return; }
    res.json(mapPage(page));
}));

studioRoutes.post('/pages', asyncHandler(async (req, res) => {
    const { name, slug, content, metaTitle, metaDescription } = req.body;
    if (!name) { res.status(400).json({ error: 'Name is required' }); return; }
    const page = await prisma.studioPage.create({
        data: { name, slug: slug || '', content: content || '', metaTitle, metaDescription },
    });
    res.status(201).json(mapPage(page));
}));

studioRoutes.patch('/pages/:id', asyncHandler(async (req, res) => {
    const { name, slug, content, metaTitle, metaDescription, state } = req.body;
    const page = await prisma.studioPage.update({
        where: { id: Number(req.params.id) },
        data: { name, slug, content, metaTitle, metaDescription, state },
    });
    res.json(mapPage(page));
}));

studioRoutes.delete('/pages/:id', asyncHandler(async (req, res) => {
    await prisma.studioPage.delete({ where: { id: Number(req.params.id) } });
    res.json({ success: true });
}));

studioRoutes.post('/pages/:id/publish', asyncHandler(async (req, res) => {
    const page = await prisma.studioPage.update({
        where: { id: Number(req.params.id) },
        data: { state: 'published', publishedAt: new Date() },
    });
    res.json(mapPage(page));
}));
