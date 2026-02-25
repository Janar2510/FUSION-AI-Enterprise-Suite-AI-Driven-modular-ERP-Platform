import { Router } from 'express';
import prisma from '../lib/prisma';
import { asyncHandler, getPagination, paginatedResponse } from '../lib/utils';

export const knowledgeRoutes = Router();

knowledgeRoutes.get('/', asyncHandler(async (req, res) => {
    const { skip, page, limit } = getPagination(req.query);
    const [data, total] = await Promise.all([
        prisma.knowledgeArticle.findMany({
            skip,
            take: limit,
            include: { workspace: true },
            orderBy: { updatedAt: 'desc' }
        }),
        prisma.knowledgeArticle.count(),
    ]);
    res.json(paginatedResponse(data, total, page, limit));
}));

knowledgeRoutes.get('/workspaces', asyncHandler(async (req, res) => {
    const workspaces = await prisma.knowledgeWorkspace.findMany({
        include: { _count: { select: { articles: true } } }
    });
    res.json(workspaces);
}));

knowledgeRoutes.post('/workspaces', asyncHandler(async (req, res) => {
    const workspace = await prisma.knowledgeWorkspace.create({ data: req.body });
    res.status(201).json(workspace);
}));

knowledgeRoutes.get('/:id', asyncHandler(async (req, res) => {
    const record = await prisma.knowledgeArticle.findUnique({
        where: { id: parseInt(req.params.id) },
        include: { workspace: true, revisions: { take: 5, orderBy: { createdAt: 'desc' } } }
    });
    if (!record) {
        res.status(404).json({ error: 'Article not found' });
        return;
    }

    // Increment view count
    await prisma.knowledgeArticle.update({
        where: { id: parseInt(req.params.id) },
        data: { viewCount: { increment: 1 } }
    });

    res.json(record);
}));

knowledgeRoutes.post('/', asyncHandler(async (req, res) => {
    const record = await prisma.knowledgeArticle.create({
        data: req.body
    });
    res.status(201).json(record);
}));

knowledgeRoutes.put('/:id', asyncHandler(async (req, res) => {
    const { title, body, workspaceId, reason } = req.body;

    // Create revision before update
    const current = await prisma.knowledgeArticle.findUnique({ where: { id: +req.params.id } });
    if (current && current.body !== body) {
        await prisma.knowledgeArticleRevision.create({
            data: {
                articleId: current.id,
                content: current.body || '',
                reason: reason || 'Update'
            }
        });
    }

    const record = await prisma.knowledgeArticle.update({
        where: { id: parseInt(req.params.id) },
        data: { title, body, workspaceId }
    });
    res.json(record);
}));

knowledgeRoutes.delete('/:id', asyncHandler(async (req, res) => {
    await prisma.knowledgeArticle.delete({
        where: { id: parseInt(req.params.id) }
    });
    res.status(204).send();
}));
