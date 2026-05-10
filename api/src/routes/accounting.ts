import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { asyncHandler, getPagination, paginatedResponse } from '../lib/utils';
import { Prisma } from '@prisma/client';
import { postInvoice, registerPayment } from '../core/flow.service';
import { AppError } from '../core/errors';
import { requireAuth, requirePermission } from '../core/auth';
import { PERMISSIONS } from '../core/auth/roles';
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
accountingRoutes.post('/moves/:id/post', requirePermission(PERMISSIONS.ACCOUNTING_POST), asyncHandler(async (req: Request, res: Response) => {
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
accountingRoutes.post('/moves/:id/pay', requirePermission(PERMISSIONS.ACCOUNTING_PAY), asyncHandler(async (req: Request, res: Response) => {
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

// ── Financial Reports ──────────────────────────────────────────────────────

// Trial Balance — aggregate debit/credit/net per account for posted moves
accountingRoutes.get('/reports/trial-balance', asyncHandler(async (req: Request, res: Response) => {
    const { date_from, date_to } = req.query as Record<string, string | undefined>;

    const dateFilter: Record<string, unknown> = { state: 'posted' };
    if (date_from || date_to) {
        dateFilter.date = {};
        if (date_from) (dateFilter.date as any).gte = new Date(date_from);
        if (date_to) (dateFilter.date as any).lte = new Date(date_to);
    }

    const lines = await prisma.accountMoveLine.findMany({
        where: { move: dateFilter },
        include: { account: { select: { id: true, code: true, name: true, accountType: true } } },
    });

    // Aggregate by account
    const byAccount = new Map<number, { account: any; debit: number; credit: number }>();
    for (const line of lines) {
        if (!line.accountId || !line.account) continue;
        const acc = byAccount.get(line.accountId) ?? { account: line.account, debit: 0, credit: 0 };
        acc.debit += line.debit;
        acc.credit += line.credit;
        byAccount.set(line.accountId, acc);
    }

    const rows = [...byAccount.values()]
        .sort((a, b) => a.account.code.localeCompare(b.account.code))
        .map(({ account, debit, credit }) => ({
            accountId: account.id,
            code: account.code,
            name: account.name,
            accountType: account.accountType,
            debit: Math.round(debit * 100) / 100,
            credit: Math.round(credit * 100) / 100,
            balance: Math.round((debit - credit) * 100) / 100,
        }));

    const totalDebit = rows.reduce((s, r) => s + r.debit, 0);
    const totalCredit = rows.reduce((s, r) => s + r.credit, 0);

    res.json({
        rows,
        totals: {
            debit: Math.round(totalDebit * 100) / 100,
            credit: Math.round(totalCredit * 100) / 100,
            balance: Math.round((totalDebit - totalCredit) * 100) / 100,
        },
        dateFrom: date_from ?? null,
        dateTo: date_to ?? null,
    });
}));

// P&L — income minus expenses for posted moves in period
accountingRoutes.get('/reports/profit-loss', asyncHandler(async (req: Request, res: Response) => {
    const { date_from, date_to } = req.query as Record<string, string | undefined>;

    const INCOME_TYPES = ['income', 'income_other'];
    const EXPENSE_TYPES = ['expense', 'expense_direct_cost', 'expense_depreciation'];

    const dateFilter: Record<string, unknown> = { state: 'posted' };
    if (date_from) (dateFilter.date = dateFilter.date ?? {}, (dateFilter.date as any).gte = new Date(date_from));
    if (date_to) ((dateFilter.date as any).lte = new Date(date_to));

    const lines = await prisma.accountMoveLine.findMany({
        where: {
            move: dateFilter,
            account: { accountType: { in: [...INCOME_TYPES, ...EXPENSE_TYPES] } },
        },
        include: { account: { select: { id: true, code: true, name: true, accountType: true } } },
    });

    const incomeLines: any[] = [];
    const expenseLines: any[] = [];

    const byAccount = new Map<number, { account: any; credit: number; debit: number }>();
    for (const line of lines) {
        if (!line.account) continue;
        const acc = byAccount.get(line.accountId!) ?? { account: line.account, credit: 0, debit: 0 };
        acc.credit += line.credit;
        acc.debit += line.debit;
        byAccount.set(line.accountId!, acc);
    }

    let totalIncome = 0;
    let totalExpenses = 0;

    for (const { account, credit, debit } of byAccount.values()) {
        if (INCOME_TYPES.includes(account.accountType)) {
            const net = Math.round((credit - debit) * 100) / 100;
            incomeLines.push({ code: account.code, name: account.name, amount: net });
            totalIncome += net;
        } else {
            const net = Math.round((debit - credit) * 100) / 100;
            expenseLines.push({ code: account.code, name: account.name, amount: net });
            totalExpenses += net;
        }
    }

    incomeLines.sort((a, b) => a.code.localeCompare(b.code));
    expenseLines.sort((a, b) => a.code.localeCompare(b.code));

    res.json({
        income: { lines: incomeLines, total: Math.round(totalIncome * 100) / 100 },
        expenses: { lines: expenseLines, total: Math.round(totalExpenses * 100) / 100 },
        netIncome: Math.round((totalIncome - totalExpenses) * 100) / 100,
        dateFrom: date_from ?? null,
        dateTo: date_to ?? null,
    });
}));

// Balance Sheet — assets, liabilities, equity as of a date
accountingRoutes.get('/reports/balance-sheet', asyncHandler(async (req: Request, res: Response) => {
    const { as_of } = req.query as Record<string, string | undefined>;

    const ASSET_TYPES = ['asset', 'asset_receivable', 'asset_cash', 'asset_current', 'asset_non_current', 'asset_prepayments', 'asset_fixed'];
    const LIABILITY_TYPES = ['liability', 'liability_payable', 'liability_credit_card', 'liability_current', 'liability_non_current'];
    const EQUITY_TYPES = ['equity', 'equity_unaffected'];

    const allTypes = [...ASSET_TYPES, ...LIABILITY_TYPES, ...EQUITY_TYPES];

    const moveFilter: Record<string, unknown> = { state: 'posted' };
    if (as_of) (moveFilter.date = { lte: new Date(as_of) });

    const lines = await prisma.accountMoveLine.findMany({
        where: {
            move: moveFilter,
            account: { accountType: { in: allTypes } },
        },
        include: { account: { select: { id: true, code: true, name: true, accountType: true } } },
    });

    const byAccount = new Map<number, { account: any; debit: number; credit: number }>();
    for (const line of lines) {
        if (!line.account) continue;
        const acc = byAccount.get(line.accountId!) ?? { account: line.account, debit: 0, credit: 0 };
        acc.debit += line.debit;
        acc.credit += line.credit;
        byAccount.set(line.accountId!, acc);
    }

    const group = (types: string[]) => {
        const rows: any[] = [];
        let total = 0;
        for (const { account, debit, credit } of byAccount.values()) {
            if (!types.includes(account.accountType)) continue;
            // Assets: natural debit balance; liabilities/equity: natural credit balance
            const net = ASSET_TYPES.includes(account.accountType)
                ? Math.round((debit - credit) * 100) / 100
                : Math.round((credit - debit) * 100) / 100;
            rows.push({ code: account.code, name: account.name, accountType: account.accountType, amount: net });
            total += net;
        }
        rows.sort((a, b) => a.code.localeCompare(b.code));
        return { lines: rows, total: Math.round(total * 100) / 100 };
    };

    const assets = group(ASSET_TYPES);
    const liabilities = group(LIABILITY_TYPES);
    const equity = group(EQUITY_TYPES);

    res.json({
        assets,
        liabilities,
        equity,
        totalLiabilitiesAndEquity: Math.round((liabilities.total + equity.total) * 100) / 100,
        balanced: Math.abs(assets.total - liabilities.total - equity.total) < 0.01,
        asOf: as_of ?? null,
    });
}));

// Aged Receivables — outstanding invoices grouped by overdue bucket
accountingRoutes.get('/reports/aged-receivable', asyncHandler(async (req: Request, res: Response) => {
    const today = new Date();
    const moves = await prisma.accountMove.findMany({
        where: {
            moveType: 'out_invoice',
            state: 'posted',
            paymentState: { in: ['not_paid', 'partial'] },
        },
        include: { partner: { select: { id: true, name: true } } },
    });

    const bucket = (daysOverdue: number) => {
        if (daysOverdue <= 0) return 'current';
        if (daysOverdue <= 30) return '1-30';
        if (daysOverdue <= 60) return '31-60';
        if (daysOverdue <= 90) return '61-90';
        return '90+';
    };

    const rows = moves.map(m => {
        const due = m.dueDate ?? m.date;
        const daysOverdue = Math.floor((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
        return {
            partnerId: m.partnerId,
            partnerName: m.partner?.name ?? 'Unknown',
            invoiceName: m.name,
            dueDate: due.toISOString().split('T')[0],
            amount: m.amountResidual,
            daysOverdue,
            bucket: bucket(daysOverdue),
        };
    });

    const buckets = { current: 0, '1-30': 0, '31-60': 0, '61-90': 0, '90+': 0 };
    for (const r of rows) (buckets as any)[r.bucket] += r.amount;

    res.json({
        rows: rows.sort((a, b) => b.daysOverdue - a.daysOverdue),
        buckets,
        total: Math.round(rows.reduce((s, r) => s + r.amount, 0) * 100) / 100,
    });
}));
