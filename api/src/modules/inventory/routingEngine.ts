import prisma from '../../lib/prisma';

/**
 * Stock Routing Engine
 * Handles complex multi-step logistics flows by chaining Stock Pickings.
 * Example: Receipt -> Quality Control -> Stock
 */
export class StockRoutingEngine {
    /**
     * Processes a picking that just finished, checking if it triggers a downstream move.
     */
    static async handlePickingValidation(pickingId: number) {
        console.log(`🚛 Routing Engine: Processing picking #${pickingId}`);

        const picking = await prisma.stockPicking.findUnique({
            where: { id: pickingId },
            include: {
                moves: { include: { product: { include: { routes: { include: { rules: true } } } } } },
                pickingType: true
            }
        });

        if (!picking || picking.state !== 'done') return;

        for (const move of picking.moves) {
            // Find rules that trigger based on this destination location
            const applicableRules = await prisma.stockRule.findMany({
                where: {
                    locationSrcId: picking.locationDestId,
                    active: true
                }
            });

            for (const rule of applicableRules) {
                // In Odoo, rules are often filtered by product/route.
                // For Phase 15, we'll implement a "Pull" logic for the next step.
                console.log(`🔗 Triggering Rule: ${rule.name} for ${move.product.name}`);

                // Create the next picking in the chain
                const count = await prisma.stockPicking.count();
                const nextPickingName = `WH/INT/2025/${String(count + 1).padStart(5, '0')}`;

                // Find a suitable picking type for the next step (e.g., Internal Transfer)
                const internalPickingType = await prisma.stockPickingType.findFirst({
                    where: { code: 'internal' }
                });

                await prisma.stockPicking.create({
                    data: {
                        name: nextPickingName,
                        pickingTypeId: internalPickingType?.id || picking.pickingTypeId,
                        state: 'assigned', // Auto-reserve for the chain
                        locationId: rule.locationSrcId!,
                        locationDestId: rule.locationDestId,
                        origin: picking.name,
                        moves: {
                            create: {
                                name: `Chained: ${move.name}`,
                                productId: move.productId,
                                productQty: move.productQty,
                                locationId: rule.locationSrcId!,
                                locationDestId: rule.locationDestId,
                                state: 'assigned'
                            }
                        }
                    }
                });
            }
        }
    }
}
