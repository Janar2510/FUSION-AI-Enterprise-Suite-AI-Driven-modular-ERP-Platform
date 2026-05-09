import { Router, Request } from 'express';
import prisma from '../lib/prisma';
import { requireAuth } from '../core/auth';
import { asyncHandler } from '../lib/utils';

export const noteRoutes = Router();
noteRoutes.use(requireAuth);

noteRoutes.get('/', asyncHandler(async (req: Request, res) => {
    const userId = req.user!.sub;
    const notes = await prisma.note.findMany({ where: { userId }, orderBy: { sequence: 'asc' } });
    res.json(notes);
}));

noteRoutes.post('/', asyncHandler(async (req: Request, res) => {
    const note = await prisma.note.create({ data: { ...req.body, userId: req.user!.sub } });
    res.status(201).json(note);
}));

noteRoutes.put('/:id', asyncHandler(async (req: Request, res) => {
    const userId = req.user!.sub;
    const note = await prisma.note.update({ where: { id: parseInt(req.params.id), userId }, data: req.body });
    res.json(note);
}));

noteRoutes.delete('/:id', asyncHandler(async (req: Request, res) => {
    const userId = req.user!.sub;
    await prisma.note.delete({ where: { id: parseInt(req.params.id), userId } });
    res.json({ success: true });
}));
