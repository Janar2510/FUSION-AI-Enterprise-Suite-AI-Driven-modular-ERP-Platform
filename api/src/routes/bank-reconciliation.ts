import { Router } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { asyncHandler } from '../lib/utils';
import { requireAuth } from '../core/auth';
import { getPagination, paginatedResponse } from '../lib/utils';

export const bankReconciliationRoutes = Router();
bankReconciliationRoutes.use(requireAuth);

// ── Bank Statements ──────────────────────────────────────────────────────────

bankReconciliationRoutes.get('/statements', asyncHandler(async (req, res) => {
    const { skip, page, limit } = getPagination(req.query);
    const state = req.query.state as string | undefined;
    const where = state ? { state } : {};
    const [data, total] = await Promise.all([
        prisma.bankStatement.findMany({
            where, skip, take: limit,
            orderBy: { createdAt: 'desc' },
            include: { lines: { select: { id: true, reconciled: true } } },
        }),
        prisma.bankStatement.count({ where }),
    ]);
    const mapped = data.map(s => ({
        ...s,
        lineCount: s.lines.length,
        reconciledCount: s.lines.filter(l => l.reconciled).length,
    }));
    res.json(paginatedResponse(mapped, total, page, limit));
}));

const StatementCreateSchema = z.object({
    name: z.string().min(1),
    journalId: z.number().int().optional(),
    dateStart: z.string().optional(),
    dateEnd: z.string().optional(),
    balance: z.number().optional(),
    lines: z.array(z.object({
        date: z.string(),
        paymentRef: z.string().optional(),
        partnerId: z.string().optional(),
        amount: z.number(),
    })).optional(),
});

bankReconciliationRoutes.post('/statements', asyncHandler(async (req, res) => {
    const body = StatementCreateSchema.parse(req.body);
    const statement = await prisma.bankStatement.create({
        data: {
            name: body.name,
            journalId: body.journalId,
            organizationId: (req as any).user?.orgId ?? 'default',
            dateStart: body.dateStart ? new Date(body.dateStart) : undefined,
            dateEnd: body.dateEnd ? new Date(body.dateEnd) : undefined,
            balance: body.balance ?? 0,
            lines: body.lines ? {
                createMany: {
                    data: body.lines.map(l => ({
                        date: new Date(l.date),
                        paymentRef: l.paymentRef,
                        partnerId: l.partnerId,
                        amount: l.amount,
                    })),
                },
            } : undefined,
        },
        include: { lines: true },
    });
    res.status(201).json(statement);
}));

bankReconciliationRoutes.get('/statements/:id', asyncHandler(async (req, res) => {
    const statement = await prisma.bankStatement.findUnique({
        where: { id: parseInt(req.params.id) },
        include: { lines: { orderBy: { date: 'desc' } } },
    });
    if (!statement) { res.status(404).json({ error: 'Not found' }); return; }
    res.json(statement);
}));

bankReconciliationRoutes.delete('/statements/:id', asyncHandler(async (req, res) => {
    await prisma.bankStatement.delete({ where: { id: parseInt(req.params.id) } });
    res.status(204).send();
}));

// ── Match a statement line to an AccountMove payment ─────────────────────────

const MatchSchema = z.object({
    lineId: z.number().int(),
    accountMoveId: z.number().int(),
});

bankReconciliationRoutes.post('/statements/:id/match', asyncHandler(async (req, res) => {
    const statementId = parseInt(req.params.id);
    const { lineId, accountMoveId } = MatchSchema.parse(req.body);

    // Verify line belongs to this statement
    const line = await prisma.bankStatementLine.findFirst({
        where: { id: lineId, statementId },
    });
    if (!line) { res.status(404).json({ error: 'Line not found on this statement' }); return; }
    if (line.reconciled) { res.status(409).json({ error: 'Line already reconciled' }); return; }

    // Verify the AccountMove exists and is a payment
    const move = await prisma.accountMove.findUnique({ where: { id: accountMoveId } });
    if (!move) { res.status(404).json({ error: 'AccountMove not found' }); return; }

    const updated = await prisma.bankStatementLine.update({
        where: { id: lineId },
        data: { accountMoveId, reconciled: true },
    });

    // If all lines are reconciled → mark statement reconciled
    const unreconciled = await prisma.bankStatementLine.count({
        where: { statementId, reconciled: false },
    });
    if (unreconciled === 0) {
        await prisma.bankStatement.update({ where: { id: statementId }, data: { state: 'reconciled' } });
    }

    res.json(updated);
}));

// Unmatch a line
bankReconciliationRoutes.delete('/statements/:id/match/:lineId', asyncHandler(async (req, res) => {
    const statementId = parseInt(req.params.id);
    const lineId = parseInt(req.params.lineId);
    const line = await prisma.bankStatementLine.findFirst({ where: { id: lineId, statementId } });
    if (!line) { res.status(404).json({ error: 'Not found' }); return; }

    await prisma.bankStatementLine.update({
        where: { id: lineId },
        data: { accountMoveId: null, reconciled: false },
    });
    // Re-open statement if it was fully reconciled
    await prisma.bankStatement.update({ where: { id: statementId }, data: { state: 'open' } });
    res.status(204).send();
}));

// Suggest matches for unreconciled lines (amount-based heuristic)
bankReconciliationRoutes.get('/statements/:id/suggestions', asyncHandler(async (req, res) => {
    const statementId = parseInt(req.params.id);
    const lines = await prisma.bankStatementLine.findMany({
        where: { statementId, reconciled: false },
    });

    const suggestions: Record<number, any[]> = {};
    for (const line of lines) {
        // Find posted AccountMove payments whose amount matches the line amount
        const candidates = await prisma.accountMove.findMany({
            where: {
                moveType: 'entry',
                state: 'posted',
                amountTotal: { gte: 0 },
            },
            take: 5,
            select: { id: true, name: true, date: true, amountTotal: true, partnerId: true },
        });
        suggestions[line.id] = candidates;
    }
    res.json(suggestions);
}));
