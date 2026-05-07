/**
 * core/sequence — Document numbering service (ADR-0004)
 *
 * Every ERP document gets a sequential human-readable number:
 *   SO-0001  INV-0001  PO-0001  WH/IN-0001  TKT-0001  etc.
 *
 * Uses a Prisma transaction with row-level locking (SELECT FOR UPDATE)
 * to ensure no two concurrent requests get the same number.
 *
 * Usage:
 *   const ref = await nextval('sale.order');     // → "SO0001"
 *   const ref = await nextval('account.move.out_invoice');  // → "INV0001"
 *
 * Sequence keys: see ir_sequences seed in migration 20260507210000_phase5b_sequences
 */

import { PrismaClient } from '@prisma/client';
import prisma from '../../lib/prisma';

/**
 * Atomically increment and return the next formatted reference number
 * for the given sequence key.
 */
export async function nextval(sequenceKey: string): Promise<string> {
    return (prisma as any).$transaction(async (tx: PrismaClient) => {
        // SELECT ... FOR UPDATE ensures only one process gets each number
        const rows: any[] = await (tx as any).$queryRaw`
            SELECT id, prefix, suffix, padding, "nextNumber", step
            FROM ir_sequences
            WHERE name = ${sequenceKey}
            FOR UPDATE`;

        if (!rows || rows.length === 0) {
            throw new Error(`Sequence '${sequenceKey}' not found. Run migrations and re-seed.`);
        }

        const seq = rows[0];
        const num: number = seq.nextNumber;
        const next = num + seq.step;

        await (tx as any).$executeRaw`
            UPDATE ir_sequences
            SET "nextNumber" = ${next}, "updatedAt" = NOW()
            WHERE id = ${seq.id}`;

        const padded = String(num).padStart(seq.padding, '0');
        return `${seq.prefix}${padded}${seq.suffix}`;
    });
}

/**
 * Preview the next number without consuming it (read-only, no lock).
 * Useful for UI previews — do not rely on this for the final reference.
 */
export async function peekval(sequenceKey: string): Promise<string> {
    const seq = await (prisma as any).irSequence?.findFirst?.({
        where: { name: sequenceKey },
    });
    if (!seq) return `${sequenceKey.toUpperCase()}-????`;
    const padded = String(seq.nextNumber).padStart(seq.padding, '0');
    return `${seq.prefix}${padded}${seq.suffix}`;
}

export default nextval;
