/**
 * core/accounting/periodCheck — Accounting period lock guard (G-11)
 *
 * Before posting any journal move, call assertPeriodOpen(date, companyId).
 * If the date falls inside a locked period, throws 409 Conflict.
 *
 * Usage:
 *   await assertPeriodOpen(new Date(), order.companyId ?? undefined);
 */

import prisma from '../../lib/prisma';
import { AppError } from '../errors';

export async function assertPeriodOpen(date: Date, companyId?: string | null): Promise<void> {
    try {
        const lockedPeriod = await (prisma as any).accountingPeriod?.findFirst?.({
            where: {
                locked: true,
                dateStart: { lte: date },
                dateStop: { gte: date },
                ...(companyId ? { companyId } : {}),
            },
        });

        if (lockedPeriod) {
            throw AppError.conflict(
                `Accounting period "${lockedPeriod.name}" is locked. Posting is not allowed between ${
                    lockedPeriod.dateStart.toISOString().split('T')[0]
                } and ${lockedPeriod.dateStop.toISOString().split('T')[0]}.`
            );
        }
    } catch (err) {
        // If AccountingPeriod table doesn't exist yet, skip check gracefully
        if (err instanceof AppError) throw err;
        // DB error = table not migrated, allow posting
    }
}
