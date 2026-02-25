import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
export const knowledgeRoutes = Router();

const asyncHandler = (fn: Function) => (req: any, res: any, next: any) =>
    Promise.resolve(fn(req, res, next)).catch(next);

const getPagination = (query: any) => {
    const page = Math.max(1, parseInt(query.page as string) || 1);
    const limit = Math.max(1, parseInt(query.limit as string) || 50);
    return { skip: (page - 1) * limit, limit, page };
};

const paginatedResponse = (data: any[], total: number, page: number, limit: number) => ({
    data,
    meta: { total, page, limit, totalPages: Math.ceil(total / limit) }
});

knowledgeRoutes.get('/', asyncHandler(async (req: any, res: any) => {
    const { skip, page, limit } = getPagination(req.query);
    const [data, total] = await Promise.all([
        prisma.knowledgeArticle.findMany({ skip, take: limit, orderBy: { updatedAt: 'desc' } }),
        prisma.knowledgeArticle.count(),
    ]);
    res.json(paginatedResponse(data, total, page, limit));
}));

knowledgeRoutes.get('/:id', asyncHandler(async (req: any, res: any) => {
    const record = await prisma.knowledgeArticle.findUnique({
        where: { id: parseInt(req.params.id) },
    });
    if (!record) return res.status(404).json({ error: 'Article not found' });

    // Increment view count
    await prisma.knowledgeArticle.update({
        where: { id: parseInt(req.params.id) },
        data: { viewCount: { increment: 1 } }
    });

    res.json(record);
}));

knowledgeRoutes.post('/', asyncHandler(async (req: any, res: any) => {
    const { title, body, category, isPublished } = req.body;
    const record = await prisma.knowledgeArticle.create({
        data: { title, body, category, isPublished }
    });
    res.status(201).json(record);
}));

knowledgeRoutes.put('/:id', asyncHandler(async (req: any, res: any) => {
    const { title, body, category, isPublished } = req.body;
    const record = await prisma.knowledgeArticle.update({
        where: { id: parseInt(req.params.id) },
        data: { title, body, category, isPublished }
    });
    res.json(record);
}));

knowledgeRoutes.delete('/:id', asyncHandler(async (req: any, res: any) => {
    await prisma.knowledgeArticle.delete({
        where: { id: parseInt(req.params.id) }
    });
    res.status(204).send();
}));
