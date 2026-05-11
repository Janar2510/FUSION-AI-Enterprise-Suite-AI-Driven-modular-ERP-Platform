import { Router, Request } from 'express';
import prisma from '../lib/prisma';
import { requireAuth } from '../core/auth';
import { anthropic, AI_MODEL } from '../core/ai';
import { asyncHandler, getPagination, paginatedResponse } from '../lib/utils';

export const knowledgeRoutes = Router();
knowledgeRoutes.use(requireAuth);

knowledgeRoutes.get('/', asyncHandler(async (req, res) => {
    const { skip, page, limit } = getPagination(req.query);
    const parentId = req.query.parentId ? parseInt(req.query.parentId as string) : undefined;
    const topLevel = req.query.topLevel === 'true';
    const where: any = {};
    if (topLevel) where.parentId = null;
    else if (parentId !== undefined) where.parentId = parentId;
    const [data, total] = await Promise.all([
        prisma.knowledgeArticle.findMany({
            where,
            skip,
            take: limit,
            include: { workspace: true, _count: { select: { children: true } } },
            orderBy: { updatedAt: 'desc' }
        }),
        prisma.knowledgeArticle.count({ where }),
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
        include: {
            workspace: true,
            revisions: { take: 5, orderBy: { createdAt: 'desc' } },
            children: { select: { id: true, title: true, isPublished: true } },
            parent: { select: { id: true, title: true } },
        }
    });
    if (!record) {
        res.status(404).json({ error: 'Article not found' });
        return;
    }

    await prisma.knowledgeArticle.update({
        where: { id: parseInt(req.params.id) },
        data: { viewCount: { increment: 1 } }
    });

    res.json(record);
}));

knowledgeRoutes.post('/', asyncHandler(async (req, res) => {
    const record = await prisma.knowledgeArticle.create({ data: req.body });
    res.status(201).json(record);
}));

knowledgeRoutes.put('/:id', asyncHandler(async (req, res) => {
    const { title, body, workspaceId, reason } = req.body;

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
    await prisma.knowledgeArticle.delete({ where: { id: parseInt(req.params.id) } });
    res.status(204).send();
}));

// AI content generation — real Claude call, returns draft for human review
knowledgeRoutes.post('/ai/generate', asyncHandler(async (req: Request, res) => {
    const { title, category, existingBody } = req.body as { title?: string; category?: string; existingBody?: string };

    if (!title) {
        res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'title is required' } });
        return;
    }

    const prompt = existingBody
        ? `You are a technical writer for an enterprise ERP knowledge base.
Improve and expand this existing article draft.

Title: ${title}
${category ? `Category: ${category}` : ''}
Existing content:
${existingBody}

Write a clear, structured knowledge base article in Markdown. Include:
- Overview section
- Key concepts / terminology
- Step-by-step instructions (if applicable)
- Common issues and solutions
- Related topics

Return only the Markdown content, no meta-commentary.`
        : `You are a technical writer for an enterprise ERP knowledge base.
Write a new knowledge base article in Markdown.

Title: ${title}
${category ? `Category: ${category}` : ''}

Include:
- Overview section explaining what this covers and why it matters
- Key concepts / terminology
- Step-by-step instructions or usage guide
- Common issues and solutions
- Related topics

Return only the Markdown content, no meta-commentary.`;

    const msg = await anthropic.messages.create({
        model: AI_MODEL,
        max_tokens: 2048,
        messages: [{ role: 'user', content: prompt }],
    });

    const generatedBody = (msg.content[0] as any).text ?? '';

    res.json({ body: generatedBody, model: AI_MODEL });
}));
