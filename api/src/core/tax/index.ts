/**
 * core/tax — Tax computation engine (ADR-0012)
 *
 * Replaces hardcoded 20% flat tax in flow.service.ts and routes/sales.ts.
 * Reads tax rates from the AccountTax table (seeded in migration).
 *
 * Usage:
 *   const { amountUntaxed, amountTax, amountTotal } = computeLineTotals(lines, taxMap);
 *
 * Where taxMap comes from loadTaxMap() or is the DEFAULT_TAX_MAP for backwards compat.
 *
 * Tax types:
 *   percent  — tax = base * rate / 100
 *   fixed    — tax = fixed amount per line regardless of qty/price
 *
 * Price inclusive:
 *   When priceInclude = true, the line's priceUnit already contains tax.
 *   Strip it out: base = priceUnit / (1 + rate/100)
 */

import prisma from '../../lib/prisma';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface TaxRate {
    id: number;
    name: string;
    amount: number;       // e.g. 20 for 20%, or 5.00 for fixed €5
    amountType: 'percent' | 'fixed';
    priceInclude: boolean;
}

export interface TaxMap {
    [taxId: number]: TaxRate;
}

export interface OrderLine {
    productQty: number;
    priceUnit: number;
    taxIds?: number[];
    discount?: number;   // percent, 0-100
}

export interface LineTaxResult {
    priceSubtotal: number;   // before tax
    priceTotal: number;      // after tax
    taxAmount: number;
}

export interface TotalsResult {
    amountUntaxed: number;
    amountTax: number;
    amountTotal: number;
    lineResults: LineTaxResult[];
}

// ── Default (fallback) tax: 20% standard VAT ─────────────────────────────────
// Used when the tax table has not been migrated yet (graceful degradation).

const FALLBACK_TAX: TaxRate = {
    id: -1,
    name: 'VAT 20%',
    amount: 20,
    amountType: 'percent',
    priceInclude: false,
};

// ── Tax map loader ────────────────────────────────────────────────────────────

export async function loadTaxMap(): Promise<TaxMap> {
    try {
        const taxes = await (prisma as any).accountTax?.findMany?.({
            where: { active: true },
            select: { id: true, name: true, amount: true, amountType: true, priceInclude: true },
        });
        if (!taxes || taxes.length === 0) return {};
        return Object.fromEntries(taxes.map((t: TaxRate) => [t.id, t]));
    } catch {
        return {};
    }
}

// ── Per-line tax computation ──────────────────────────────────────────────────

function computeLineTax(line: OrderLine, taxMap: TaxMap): LineTaxResult {
    const qty = line.productQty ?? 1;
    const discount = (line.discount ?? 0) / 100;
    const unitPrice = line.priceUnit ?? 0;
    const discountedPrice = unitPrice * (1 - discount);
    const grossAmount = qty * discountedPrice;

    if (!line.taxIds || line.taxIds.length === 0) {
        return { priceSubtotal: grossAmount, priceTotal: grossAmount, taxAmount: 0 };
    }

    let taxAmount = 0;
    for (const taxId of line.taxIds) {
        const tax = taxMap[taxId] ?? FALLBACK_TAX;

        if (tax.priceInclude) {
            // Price already includes tax — extract it
            if (tax.amountType === 'percent') {
                const base = grossAmount / (1 + tax.amount / 100);
                taxAmount += grossAmount - base;
            } else {
                taxAmount += tax.amount * qty;
            }
        } else {
            if (tax.amountType === 'percent') {
                taxAmount += grossAmount * (tax.amount / 100);
            } else {
                taxAmount += tax.amount * qty;
            }
        }
    }

    const priceSubtotal = line.taxIds.some(id => taxMap[id]?.priceInclude)
        ? grossAmount - taxAmount
        : grossAmount;

    return {
        priceSubtotal: Math.round(priceSubtotal * 100) / 100,
        taxAmount: Math.round(taxAmount * 100) / 100,
        priceTotal: Math.round((priceSubtotal + taxAmount) * 100) / 100,
    };
}

// ── Order-level totals ────────────────────────────────────────────────────────

export function computeTotals(lines: OrderLine[], taxMap: TaxMap): TotalsResult {
    const lineResults = lines.map(l => computeLineTax(l, taxMap));
    const amountUntaxed = lineResults.reduce((s, l) => s + l.priceSubtotal, 0);
    const amountTax = lineResults.reduce((s, l) => s + l.taxAmount, 0);

    return {
        amountUntaxed: Math.round(amountUntaxed * 100) / 100,
        amountTax: Math.round(amountTax * 100) / 100,
        amountTotal: Math.round((amountUntaxed + amountTax) * 100) / 100,
        lineResults,
    };
}

/**
 * Convenience: compute totals using the live DB tax map.
 * Falls back to 20% VAT if tax table is empty.
 */
export async function computeTotalsFromDb(lines: OrderLine[]): Promise<TotalsResult> {
    const taxMap = await loadTaxMap();

    // If no lines have taxIds and no tax map, apply default 20% for backwards compat
    const hasExplicitTaxes = lines.some(l => l.taxIds && l.taxIds.length > 0);
    if (!hasExplicitTaxes && Object.keys(taxMap).length === 0) {
        const linesWithDefault = lines.map(l => ({ ...l, taxIds: [FALLBACK_TAX.id] }));
        return computeTotals(linesWithDefault, { [FALLBACK_TAX.id]: FALLBACK_TAX });
    }

    return computeTotals(lines, taxMap);
}

export default computeTotals;
