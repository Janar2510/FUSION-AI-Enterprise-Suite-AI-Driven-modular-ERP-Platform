import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { asyncHandler, getPagination, paginatedResponse } from '../lib/utils';
import { Prisma } from '@prisma/client';
import { postInvoice, registerPayment } from '../core/flow.service';
import { AppError } from '../core/errors';
import { requireAuth } from '../core/auth';
import { generateInvoicePdf } from '../core/pdf';
import { nextval } from '../core/sequence';

export const accountingRoutes = Router();
accountingRoutes.use(requireAuth);

// ==========================================
// Chart of Accounts (`account.account`)
// ==========================================
accountingRoutes.get('/accounts', asyncHandler(async (req: Request, res: Response) => {
    const { skip, page, limit } = getPagination(req.query);
    const search = req.query.search as string;
    const type = req.query.type as string;

    const where: Prisma.AccountAccountWhereInput = { active: true };
    if (search) {
        where.OR = [
            { name: { contains: search } },
            { code: { contains: search } }
        ];
    }
    if (type) {
        where.accountType = type;
    }

    const [data, total] = await Promise.all([
        prisma.accountAccount.findMany({ where, skip, take: limit, orderBy: { code: 'asc' } }),
        prisma.accountAccount.count({ where }),
    ]);
    res.json(paginatedResponse(data, total, page, limit));
}));

accountingRoutes.post('/accounts', asyncHandler(async (req: Request, res: Response) => {
    const data = req.body;
    const account = await prisma.accountAccount.create({ data });
    res.status(201).json(account);
}));

// ==========================================
// Journals (`account.journal`)
// ==========================================
accountingRoutes.get('/journals', asyncHandler(async (_req: Request, res: Response) => {
    const journals = await prisma.accountJournal.findMany({
        where: { active: true },
        include: { defaultAccount: true }
    });
    res.json(journals);
}));

accountingRoutes.post('/journals', asyncHandler(async (req: Request, res: Response) => {
    const data = req.body;
    const journal = await prisma.accountJournal.create({ data });
    res.status(201).json(journal);
}));

// ==========================================
// Journal Entries & Invoices (`account.move`)
// ==========================================
accountingRoutes.get('/moves', asyncHandler(async (req: Request, res: Response) => {
    const { skip, page, limit } = getPagination(req.query);
    const moveType = req.query.type as string;
    const state = req.query.state as string;

    const where: Prisma.AccountMoveWhereInput = {};
    if (moveType) where.moveType = moveType;
    if (state) where.state = state;

    const [data, total] = await Promise.all([
        prisma.accountMove.findMany({
            where,
            skip,
            take: limit,
            orderBy: { date: 'desc' },
            include: {
                partner: true,
                journal: true,
                lines: { include: { account: true } }
            }
        }),
        prisma.accountMove.count({ where }),
    ]);
    res.json(paginatedResponse(data, total, page, limit));
}));

accountingRoutes.get('/moves/:id', asyncHandler(async (req: Request, res: Response) => {
    const move = await prisma.accountMove.findUnique({
        where: { id: parseInt(req.params.id) },
        include: {
            partner: true,
            journal: true,
            lines: { include: { account: true, product: true } }
        }
    });
    if (!move) { res.status(404).json({ error: 'Journal Entry not found' }); return; }
    res.json(move);
}));

accountingRoutes.post('/moves', asyncHandler(async (req: Request, res: Response) => {
    const { lines, ...data } = req.body;
    const seqKey = {
        out_invoice: 'account.move.out_invoice',
        in_invoice: 'account.move.in_invoice',
        out_refund: 'account.move.out_refund',
        in_refund: 'account.move.in_refund',
    }[data.moveType as string] ?? 'account.move.out_invoice';

    const moveName = await nextval(seqKey).catch(() => `DOC-${Date.now()}`);

    const move = await prisma.accountMove.create({
        data: {
            ...data,
            name: moveName,
            lines: lines ? { create: lines } : undefined
        },
        include: { partner: true, lines: true, journal: true },
    });
    res.status(201).json(move);
}));

accountingRoutes.put('/moves/:id', asyncHandler(async (req: Request, res: Response) => {
    const moveId = parseInt(req.params.id);
    const { lines, ...data } = req.body;

    // Standard upsert logic for one2many lines
    let linesUpdate = undefined;
    if (lines && Array.isArray(lines)) {
        // Find existing lines to know what to delete
        const existingLines = await prisma.accountMoveLine.findMany({ where: { moveId } });
        const existingLineIds = existingLines.map((l: any) => l.id);
        const incomingLineIds = lines.filter((l: any) => l.id).map((l: any) => l.id);
        const linesToDelete = existingLineIds.filter((id: number) => !incomingLineIds.includes(id));

        linesUpdate = {
            deleteMany: { id: { in: linesToDelete } },
            upsert: lines.map((line: any) => ({
                where: { id: line.id || -1 },
                update: {
                    name: line.name || '',
                    quantity: line.quantity || 1,
                    priceUnit: line.priceUnit || 0,
                    priceSubtotal: line.priceSubtotal || 0,
                    priceTotal: line.priceTotal || 0,
                    debit: line.debit || 0,
                    credit: line.credit || 0,
                    balance: (line.debit || 0) - (line.credit || 0),
                    accountId: line.accountId,
                    productId: line.productId
                },
                create: {
                    name: line.name || '',
                    quantity: line.quantity || 1,
                    priceUnit: line.priceUnit || 0,
                    priceSubtotal: line.priceSubtotal || 0,
                    priceTotal: line.priceTotal || 0,
                    debit: line.debit || 0,
                    credit: line.credit || 0,
                    balance: (line.debit || 0) - (line.credit || 0),
                    accountId: line.accountId,
                    productId: line.productId
                }
            }))
        };
    }

    const move = await prisma.accountMove.update({
        where: { id: moveId },
        data: {
            ...data,
            lines: linesUpdate
        },
        include: { partner: true, lines: true, journal: true }
    });

    res.json(move);
}));

// ==========================================
// Posting & Validation (Double-Entry Core)
// ==========================================
accountingRoutes.post('/moves/:id/post', asyncHandler(async (req: Request, res: Response) => {
    const moveId = parseInt(req.params.id);

    // 1. Fetch move and lines
    const move = await prisma.accountMove.findUnique({
        where: { id: moveId },
        include: { lines: true }
    });

    if (!move) {
        res.status(404).json({ error: 'Journal Entry not found' });
        return;
    }

    if (move.state === 'posted') {
        res.status(409).json({ error: 'Journal Entry is already posted' });
        return;
    }

    if (move.lines.length === 0) {
        res.status(400).json({ error: 'Cannot post an empty journal entry. You need at least one debit and one credit line.' });
        return;
    }

    // 2. Mathematically perfect double-entry validation (Odoo 19 parity)
    const totalDebit = move.lines.reduce((sum: number, line: any) => sum + (line.debit || 0), 0);
    const totalCredit = move.lines.reduce((sum: number, line: any) => sum + (line.credit || 0), 0);

    // Use an epsilon for floating point comparison
    const diff = Math.abs(totalDebit - totalCredit);
    if (diff > 0.001) {
        res.status(400).json({
            error: 'Cannot post journal entry: Debits and Credits are not balanced.',
            details: `Total Debit: ${totalDebit.toFixed(2)}, Total Credit: ${totalCredit.toFixed(2)}, Difference: ${diff.toFixed(2)}`
        });
        return;
    }

    // 3. Post the entry – delegate to service (immutability guard + postedAt)
    const postedMove = await postInvoice(moveId);
    res.json(postedMove);
}));

// Flow C – Register payment against a posted invoice (idempotent)
accountingRoutes.post('/moves/:id/pay', asyncHandler(async (req: Request, res: Response) => {
    const { amount, journalId, memo, idempotencyKey } = req.body;
    if (!amount || amount <= 0) {
        throw AppError.validation('Payment amount must be greater than 0');
    }
    const payment = await registerPayment(parseInt(req.params.id), { amount, journalId, memo, idempotencyKey });
    res.status(201).json(payment);
}));

// Flow C – Reconcile (mark fully paid manually)
accountingRoutes.post('/moves/:id/reconcile', asyncHandler(async (req: Request, res: Response) => {
    const move = await prisma.accountMove.findUnique({ where: { id: parseInt(req.params.id) } });
    if (!move) throw AppError.notFound('Invoice');
    if (move.state !== 'posted') throw AppError.conflict('Only posted invoices can be reconciled');

    const updated = await prisma.accountMove.update({
        where: { id: parseInt(req.params.id) },
        data: { amountResidual: 0, paymentState: 'paid' },
        include: { partner: true, journal: true, payments: true },
    });
    res.json(updated);
}));

// GET payments list
accountingRoutes.get('/payments', asyncHandler(async (req: Request, res: Response) => {
    const { skip, page, limit } = getPagination(req.query);
    const [data, total] = await Promise.all([
        prisma.accountPayment.findMany({
            skip, take: limit,
            orderBy: { createdAt: 'desc' },
            include: { partner: true, journal: true, move: true },
        }),
        prisma.accountPayment.count(),
    ]);
    res.json(paginatedResponse(data, total, page, limit));
}));

// PDF download for invoice or vendor bill
accountingRoutes.get('/moves/:id/pdf', asyncHandler(async (req: Request, res: Response) => {
    const { buffer, filename } = await generateInvoicePdf(parseInt(req.params.id));
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.end(buffer);
}));
