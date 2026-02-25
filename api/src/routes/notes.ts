import { Router } from 'express';
import prisma from '../lib/prisma';
import { asyncHandler } from '../lib/utils';

export const noteRoutes = Router();

noteRoutes.get('/', asyncHandler(async (_req, res) => {
    const notes = await prisma.note.findMany({ orderBy: { sequence: 'asc' } });
    res.json(notes);
}));

noteRoutes.post('/', asyncHandler(async (req, res) => {
    const note = await prisma.note.create({ data: req.body });
    res.status(201).json(note);
}));

noteRoutes.put('/:id', asyncHandler(async (req, res) => {
    const note = await prisma.note.update({ where: { id: parseInt(req.params.id) }, data: req.body });
    res.json(note);
}));

noteRoutes.delete('/:id', asyncHandler(async (req, res) => {
    await prisma.note.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ success: true });
}));
