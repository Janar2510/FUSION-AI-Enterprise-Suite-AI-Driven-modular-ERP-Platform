import { Router } from 'express';
import prisma from '../lib/prisma';
import { asyncHandler, getPagination, paginatedResponse } from '../lib/utils';
import { requireAuth } from '../core/auth';
import { AppError } from '../core/errors';

export const documentRoutes = Router();
documentRoutes.use(requireAuth);

// ── Workspaces ────────────────────────────────────────────────────────────────

documentRoutes.get('/workspaces', asyncHandler(async (_req, res) => {
    const workspaces = await prisma.documentWorkspace.findMany({
        where: { active: true },
        orderBy: { name: 'asc' },
        include: { _count: { select: { documents: { where: { deletedAt: null } } } } },
    });
    res.json(workspaces);
}));

documentRoutes.post('/workspaces', asyncHandler(async (req, res) => {
    const ws = await prisma.documentWorkspace.create({ data: req.body });
    res.status(201).json(ws);
}));

documentRoutes.put('/workspaces/:id', asyncHandler(async (req, res) => {
    const ws = await prisma.documentWorkspace.update({ where: { id: parseInt(req.params.id) }, data: req.body });
    res.json(ws);
}));

documentRoutes.delete('/workspaces/:id', asyncHandler(async (req, res) => {
    await prisma.documentWorkspace.update({ where: { id: parseInt(req.params.id) }, data: { active: false } });
    res.json({ success: true });
}));

// ── Documents ─────────────────────────────────────────────────────────────────

documentRoutes.get('/', asyncHandler(async (req, res) => {
    const { skip, page, limit } = getPagination(req.query);
    const workspaceId = req.query.workspaceId ? parseInt(req.query.workspaceId as string) : undefined;
    const search = req.query.search as string | undefined;

    const where: any = { deletedAt: null };
    if (workspaceId) where.workspaceId = workspaceId;
    if (search) where.name = { contains: search, mode: 'insensitive' };

    const [data, total] = await Promise.all([
        prisma.irDocument.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: { workspace: { select: { id: true, name: true, color: true } } },
        }),
        prisma.irDocument.count({ where }),
    ]);
    res.json(paginatedResponse(data, total, page, limit));
}));

documentRoutes.get('/trash', asyncHandler(async (_req, res) => {
    const docs = await prisma.irDocument.findMany({
        where: { deletedAt: { not: null } },
        orderBy: { deletedAt: 'desc' },
    });
    res.json(docs);
}));

documentRoutes.get('/:id', asyncHandler(async (req, res) => {
    const doc = await prisma.irDocument.findUnique({
        where: { id: parseInt(req.params.id) },
        include: { workspace: true },
    });
    if (!doc || doc.deletedAt) throw AppError.notFound('Document');
    res.json(doc);
}));

documentRoutes.post('/', asyncHandler(async (req, res) => {
    const doc = await prisma.irDocument.create({
        data: { ...req.body, ownerId: req.user?.sub },
    });
    res.status(201).json(doc);
}));

documentRoutes.put('/:id', asyncHandler(async (req, res) => {
    const { deletedAt, ...data } = req.body; // prevent direct deletedAt manipulation
    const doc = await prisma.irDocument.update({
        where: { id: parseInt(req.params.id) },
        data,
    });
    res.json(doc);
}));

// Soft delete
documentRoutes.delete('/:id', asyncHandler(async (req, res) => {
    await prisma.irDocument.update({
        where: { id: parseInt(req.params.id) },
        data: { deletedAt: new Date() },
    });
    res.json({ success: true });
}));

// Restore from trash
documentRoutes.patch('/:id/restore', asyncHandler(async (req, res) => {
    const doc = await prisma.irDocument.update({
        where: { id: parseInt(req.params.id) },
        data: { deletedAt: null },
    });
    res.json(doc);
}));

// Permanent delete (admin)
documentRoutes.delete('/:id/permanent', asyncHandler(async (req, res) => {
    await prisma.irDocument.delete({ where: { id: parseInt(req.params.id) } });
    res.status(204).send();
}));

// ChatterPanel
import { createChatterRouter } from '../core/chatter';
documentRoutes.use('/', createChatterRouter('ir.document'));
