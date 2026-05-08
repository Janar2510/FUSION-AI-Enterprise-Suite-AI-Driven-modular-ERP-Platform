// Mock prisma before importing anything that depends on it
jest.mock('../../lib/prisma', () => ({
    __esModule: true,
    default: {
        $transaction: jest.fn(),
        irSequence: { findFirst: jest.fn() },
    },
}));

import prisma from '../../lib/prisma';
import { nextval, peekval } from '../sequence';

// ── nextval ───────────────────────────────────────────────────────────────────

describe('nextval()', () => {
    beforeEach(() => jest.clearAllMocks());

    test('returns formatted reference using prefix, padding, suffix', async () => {
        (prisma as any).$transaction.mockImplementation(async (cb: Function) => {
            const tx: any = {
                $queryRaw: jest.fn().mockResolvedValue([
                    { id: 1, prefix: 'SO', suffix: '', padding: 4, nextNumber: 1, step: 1 },
                ]),
                $executeRaw: jest.fn().mockResolvedValue(1),
            };
            return cb(tx);
        });

        const ref = await nextval('sale.order');
        expect(ref).toBe('SO0001');
    });

    test('increments correctly with step > 1', async () => {
        (prisma as any).$transaction.mockImplementation(async (cb: Function) => {
            const tx: any = {
                $queryRaw: jest.fn().mockResolvedValue([
                    { id: 2, prefix: 'INV', suffix: '', padding: 5, nextNumber: 100, step: 10 },
                ]),
                $executeRaw: jest.fn().mockResolvedValue(1),
            };
            return cb(tx);
        });

        const ref = await nextval('account.move.out_invoice');
        expect(ref).toBe('INV00100');
    });

    test('includes suffix when defined', async () => {
        (prisma as any).$transaction.mockImplementation(async (cb: Function) => {
            const tx: any = {
                $queryRaw: jest.fn().mockResolvedValue([
                    { id: 3, prefix: 'TKT-', suffix: '-2026', padding: 4, nextNumber: 7, step: 1 },
                ]),
                $executeRaw: jest.fn().mockResolvedValue(1),
            };
            return cb(tx);
        });

        const ref = await nextval('helpdesk.ticket');
        expect(ref).toBe('TKT-0007-2026');
    });

    test('throws when sequence key not found', async () => {
        (prisma as any).$transaction.mockImplementation(async (cb: Function) => {
            const tx: any = {
                $queryRaw: jest.fn().mockResolvedValue([]),
                $executeRaw: jest.fn(),
            };
            return cb(tx);
        });

        await expect(nextval('nonexistent.key')).rejects.toThrow("Sequence 'nonexistent.key' not found");
    });

    test('calls $executeRaw to update nextNumber', async () => {
        let executeRawCalled = false;
        (prisma as any).$transaction.mockImplementation(async (cb: Function) => {
            const tx: any = {
                $queryRaw: jest.fn().mockResolvedValue([
                    { id: 1, prefix: 'PO', suffix: '', padding: 4, nextNumber: 5, step: 1 },
                ]),
                $executeRaw: jest.fn().mockImplementation(() => { executeRawCalled = true; return Promise.resolve(1); }),
            };
            return cb(tx);
        });

        await nextval('purchase.order');
        expect(executeRawCalled).toBe(true);
    });
});

// ── peekval ───────────────────────────────────────────────────────────────────

describe('peekval()', () => {
    beforeEach(() => jest.clearAllMocks());

    test('returns preview reference without consuming the number', async () => {
        (prisma as any).irSequence = {
            findFirst: jest.fn().mockResolvedValue(
                { prefix: 'INV', suffix: '', padding: 5, nextNumber: 42 }
            ),
        };

        const ref = await peekval('account.move.out_invoice');
        expect(ref).toBe('INV00042');
        // Does NOT call $transaction (read-only)
        expect((prisma as any).$transaction).not.toHaveBeenCalled();
    });

    test('returns placeholder when sequence not found', async () => {
        (prisma as any).irSequence = {
            findFirst: jest.fn().mockResolvedValue(null),
        };

        const ref = await peekval('unknown.seq');
        // peekval uppercases the key in the placeholder
        expect(ref.toUpperCase()).toContain('UNKNOWN.SEQ');
        expect(ref).toContain('????');
    });
});
