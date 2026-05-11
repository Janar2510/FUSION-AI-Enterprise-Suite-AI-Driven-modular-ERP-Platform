/**
 * Pricelist service — resolves the unit price for a product given
 * a partner (which carries a pricelist), a quantity, and the current date.
 *
 * Resolution order:
 *   1. Active fixed-price PricelistLine matching productId + qty + dates → use fixedPrice
 *   2. Active discount PricelistLine matching productId + qty + dates   → product.salesPrice * (1 - discount/100)
 *   3. Fallback: product.salesPrice
 */

import prisma from '../lib/prisma';

export async function computeLinePrice(
    productId: string,
    partnerId: string | null | undefined,
    qty: number,
    pricelistId?: number | null,
    now: Date = new Date(),
): Promise<number> {
    // 1. Resolve which pricelist to use
    let resolvedPricelistId = pricelistId ?? null;
    if (!resolvedPricelistId && partnerId) {
        const partner = await prisma.partner.findUnique({
            where: { id: partnerId },
            select: { pricelistId: true },
        });
        resolvedPricelistId = partner?.pricelistId ?? null;
    }

    // 2. Fetch the product's base sales price
    const product = await prisma.product.findUnique({
        where: { id: productId },
        select: { salesPrice: true },
    });
    const basePrice: number = (product?.salesPrice as any) ?? 0;

    if (!resolvedPricelistId) return basePrice;

    // 3. Find the best-matching pricelist line
    const lines = await prisma.pricelistLine.findMany({
        where: {
            pricelistId: resolvedPricelistId,
            OR: [{ productId }, { productId: null }],
            minQty: { lte: qty },
            AND: [
                { OR: [{ dateStart: null }, { dateStart: { lte: now } }] },
                { OR: [{ dateEnd: null }, { dateEnd: { gte: now } }] },
            ],
        },
        orderBy: [
            // Most-specific first: product-specific > catch-all
            { productId: 'desc' },
            // Highest minQty wins (break-quantity logic)
            { minQty: 'desc' },
        ],
    });

    if (!lines.length) return basePrice;

    const best = lines[0];
    if (best.fixedPrice !== null && best.fixedPrice !== undefined) {
        return best.fixedPrice as number;
    }
    // Percentage discount
    const discount = (best.priceDiscount as number) ?? 0;
    return basePrice * (1 - discount / 100);
}
