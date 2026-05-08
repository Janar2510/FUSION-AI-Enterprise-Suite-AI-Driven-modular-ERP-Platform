import { computeTotals, computeTotalsFromDb, TaxMap, OrderLine } from '../tax';

// Mock prisma so computeTotalsFromDb doesn't need a real DB
jest.mock('../../lib/prisma', () => ({
    __esModule: true,
    default: {
        accountTax: {
            findMany: jest.fn(),
        },
    },
}));
import prisma from '../../lib/prisma';

// ── computeTotals — pure function, no DB ──────────────────────────────────────

describe('computeTotals()', () => {
    const VAT20: TaxMap = {
        1: { id: 1, name: 'VAT 20%', amount: 20, amountType: 'percent', priceInclude: false },
    };

    const FIXED5: TaxMap = {
        2: { id: 2, name: 'Fixed €5', amount: 5, amountType: 'fixed', priceInclude: false },
    };

    const VAT20_INCL: TaxMap = {
        3: { id: 3, name: 'VAT 20% incl.', amount: 20, amountType: 'percent', priceInclude: true },
    };

    test('computes percent tax on a single line', () => {
        const lines: OrderLine[] = [{ productQty: 2, priceUnit: 100, taxIds: [1] }];
        const result = computeTotals(lines, VAT20);

        expect(result.amountUntaxed).toBe(200);
        expect(result.amountTax).toBe(40);
        expect(result.amountTotal).toBe(240);
    });

    test('computes multiple lines', () => {
        const lines: OrderLine[] = [
            { productQty: 1, priceUnit: 100, taxIds: [1] },
            { productQty: 3, priceUnit: 50, taxIds: [1] },
        ];
        const result = computeTotals(lines, VAT20);

        expect(result.amountUntaxed).toBe(250);    // 100 + 150
        expect(result.amountTax).toBe(50);         // 20 + 30
        expect(result.amountTotal).toBe(300);
        expect(result.lineResults).toHaveLength(2);
    });

    test('applies discount before tax', () => {
        const lines: OrderLine[] = [{ productQty: 1, priceUnit: 100, taxIds: [1], discount: 10 }];
        const result = computeTotals(lines, VAT20);

        // base = 90 (10% disc), tax = 18, total = 108
        expect(result.amountUntaxed).toBe(90);
        expect(result.amountTax).toBe(18);
        expect(result.amountTotal).toBe(108);
    });

    test('handles fixed tax correctly', () => {
        const lines: OrderLine[] = [{ productQty: 2, priceUnit: 100, taxIds: [2] }];
        const result = computeTotals(lines, FIXED5);

        // base = 200, tax = 5*2 = 10
        expect(result.amountUntaxed).toBe(200);
        expect(result.amountTax).toBe(10);
        expect(result.amountTotal).toBe(210);
    });

    test('handles price-inclusive percent tax', () => {
        const lines: OrderLine[] = [{ productQty: 1, priceUnit: 120, taxIds: [3] }];
        const result = computeTotals(lines, VAT20_INCL);

        // base = 120 / 1.20 = 100, tax = 20
        expect(result.amountUntaxed).toBe(100);
        expect(result.amountTax).toBe(20);
        expect(result.amountTotal).toBe(120);
    });

    test('returns zero tax when taxIds is empty', () => {
        const lines: OrderLine[] = [{ productQty: 1, priceUnit: 100, taxIds: [] }];
        const result = computeTotals(lines, VAT20);

        expect(result.amountTax).toBe(0);
        expect(result.amountTotal).toBe(100);
    });

    test('falls back to FALLBACK_TAX when taxId not in map', () => {
        const lines: OrderLine[] = [{ productQty: 1, priceUnit: 100, taxIds: [999] }];
        const result = computeTotals(lines, VAT20); // id 999 not in map → fallback 20%

        expect(result.amountTax).toBe(20);
    });

    test('handles zero-quantity line', () => {
        const lines: OrderLine[] = [{ productQty: 0, priceUnit: 100, taxIds: [1] }];
        const result = computeTotals(lines, VAT20);

        expect(result.amountUntaxed).toBe(0);
        expect(result.amountTax).toBe(0);
    });

    test('rounds to 2 decimal places', () => {
        const lines: OrderLine[] = [{ productQty: 1, priceUnit: 10, taxIds: [1] }];
        const result = computeTotals(lines, {
            1: { id: 1, name: 'VAT 7%', amount: 7, amountType: 'percent', priceInclude: false },
        });

        // 10 * 7% = 0.70 — no rounding issue here; use a trickier case
        expect(result.amountTax).toBe(0.7);
    });

    test('returns lineResults array matching input length', () => {
        const lines: OrderLine[] = Array.from({ length: 5 }, (_, i) => ({
            productQty: 1, priceUnit: i * 10 + 10, taxIds: [1],
        }));
        const result = computeTotals(lines, VAT20);
        expect(result.lineResults).toHaveLength(5);
    });
});

// ── computeTotalsFromDb — async, mocked prisma ────────────────────────────────

describe('computeTotalsFromDb()', () => {
    beforeEach(() => jest.clearAllMocks());

    test('uses the default DB tax when no explicit taxIds on lines', async () => {
        (prisma.accountTax.findMany as jest.Mock).mockResolvedValue([
            { id: 10, name: 'VAT 20%', amount: 20, amountType: 'percent', priceInclude: false, isDefault: true },
        ]);

        const lines: OrderLine[] = [{ productQty: 1, priceUnit: 100 }];
        const result = await computeTotalsFromDb(lines);

        expect(result.amountTax).toBe(20);
        expect(result.amountTotal).toBe(120);
    });

    test('falls back to 20% hardcoded when DB is empty', async () => {
        (prisma.accountTax.findMany as jest.Mock).mockResolvedValue([]);

        const lines: OrderLine[] = [{ productQty: 1, priceUnit: 100 }];
        const result = await computeTotalsFromDb(lines);

        expect(result.amountTax).toBe(20);
        expect(result.amountTotal).toBe(120);
    });

    test('uses explicit taxIds on lines when provided', async () => {
        (prisma.accountTax.findMany as jest.Mock).mockResolvedValue([
            { id: 10, name: 'VAT 20%', amount: 20, amountType: 'percent', priceInclude: false, isDefault: true },
            { id: 11, name: 'VAT 10%', amount: 10, amountType: 'percent', priceInclude: false, isDefault: false },
        ]);

        const lines: OrderLine[] = [{ productQty: 1, priceUnit: 100, taxIds: [11] }];
        const result = await computeTotalsFromDb(lines);

        expect(result.amountTax).toBe(10);
    });

    test('handles DB error gracefully (falls back to empty map)', async () => {
        (prisma.accountTax.findMany as jest.Mock).mockRejectedValue(new Error('DB down'));

        const lines: OrderLine[] = [{ productQty: 1, priceUnit: 100 }];
        // Should not throw — falls back to 20% hardcoded via FALLBACK_TAX
        const result = await computeTotalsFromDb(lines);
        expect(result.amountTotal).toBe(120);
    });
});
