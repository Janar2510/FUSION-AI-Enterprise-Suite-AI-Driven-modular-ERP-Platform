import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { asyncHandler, getPagination, paginatedResponse } from '../lib/utils';
import { Prisma } from '@prisma/client';
import { FormulaService } from '../modules/spreadsheet/formulaService';
import { requireAuth } from '../core/auth';

export const spreadsheetRoutes = Router();
spreadsheetRoutes.use(requireAuth);

// ==========================================
// Neural Spreadsheets (`analytical.buffer`)
// ==========================================

spreadsheetRoutes.get('/', asyncHandler(async (req: Request, res: Response) => {
    const { skip, page, limit } = getPagination(req.query);
    const search = req.query.search as string;

    const where: Prisma.SpreadsheetWhereInput = {};
    if (search) {
        where.name = { contains: search };
    }

    const [data, total] = await Promise.all([
        prisma.spreadsheet.findMany({
            where,
            skip,
            take: limit,
            orderBy: { updatedAt: 'desc' },
            select: { id: true, name: true, updatedAt: true, createdAt: true }
        }),
        prisma.spreadsheet.count({ where }),
    ]);
    res.json(paginatedResponse(data, total, page, limit));
}));

spreadsheetRoutes.get('/:id', asyncHandler(async (req: Request, res: Response) => {
    const sheet = await prisma.spreadsheet.findUnique({
        where: { id: parseInt(req.params.id) },
        include: { partner: true }
    });

    if (!sheet) {
        res.status(404).json({ error: 'Spreadsheet not found' });
        return;
    }

    // Parse the data string back to JSON for the frontend
    try {
        const parsedData = JSON.parse(sheet.data);
        const processedData = await FormulaService.processDataBuffer(parsedData);
        res.json({ data: { ...sheet, data: processedData } });
    } catch (e) {
        res.status(500).json({ error: 'Failed to parse spreadsheet data buffer' });
    }
}));

spreadsheetRoutes.post('/', asyncHandler(async (req: Request, res: Response) => {
    const { name, data, partnerId } = req.body;

    const sheet = await prisma.spreadsheet.create({
        data: {
            name: name || 'Neural Analytical Protocol',
            data: typeof data === 'string' ? data : JSON.stringify(data || {}),
            partnerId: partnerId || (req as any).session?.userId
        }
    });

    const result = { ...sheet, data: JSON.parse(sheet.data) };
    res.status(201).json({ data: result });
}));

spreadsheetRoutes.put('/:id', asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    const { name, data } = req.body;

    const updateData: any = {};
    if (name) updateData.name = name;
    if (data) updateData.data = typeof data === 'string' ? data : JSON.stringify(data);

    const sheet = await prisma.spreadsheet.update({
        where: { id },
        data: updateData
    });

    const result = { ...sheet, data: JSON.parse(sheet.data) };
    res.json({ data: result });
}));

spreadsheetRoutes.delete('/:id', asyncHandler(async (req: Request, res: Response) => {
    await prisma.spreadsheet.delete({
        where: { id: parseInt(req.params.id) }
    });
    res.json({ success: true });
}));
