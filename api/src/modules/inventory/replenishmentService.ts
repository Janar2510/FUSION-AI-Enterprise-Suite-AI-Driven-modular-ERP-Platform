import prisma from '../../lib/prisma';

export class ReplenishmentService {
    /**
     * The core replenishment engine.
     * Scans all Orderpoints (reordering rules) and triggers draft Purchase Orders
     * for products below their minimum threshold.
     */
    static async runReplenishment() {
        console.log('🌱 Starting Neural Replenishment Engine...');

        try {
            // 1. Fetch all active reordering rules
            const orderpoints = await prisma.stockWarehouseOrderpoint.findMany({
                where: { active: true },
                include: {
                    product: {
                        include: {
                            vendorPricelists: {
                                orderBy: { sequence: 'asc' },
                                take: 1,
                                include: { partner: true }
                            }
                        }
                    }
                }
            });

            let triggeredCount = 0;

            for (const orderpoint of orderpoints) {
                // 2. Logic: Virtual Stock < Minimum Qty
                // Future Parity: In a real ERP, virtual stock = On Hand - Outgoing + Incoming
                const virtualQty = orderpoint.product.qtyOnHand;

                if (virtualQty < orderpoint.productMinQty) {
                    const qtyToOrder = orderpoint.productMaxQty - virtualQty;
                    const bestPricelist = orderpoint.product.vendorPricelists[0];

                    if (!bestPricelist) {
                        console.warn(`⚠️ No vendor found for product ${orderpoint.product.name} (ID: ${orderpoint.productId})`);
                        continue;
                    }

                    // 3. Find or Create Draft Purchase Order
                    let draftPO = await prisma.purchaseOrder.findFirst({
                        where: {
                            partnerId: bestPricelist.partnerId,
                            state: 'draft'
                        },
                        include: { lines: true }
                    });

                    if (draftPO) {
                        // Check if product already in PO
                        const existingLine = draftPO.lines.find(l => l.productId === orderpoint.productId);
                        if (existingLine) {
                            await prisma.purchaseOrderLine.update({
                                where: { id: existingLine.id },
                                data: {
                                    productQty: existingLine.productQty + qtyToOrder,
                                    priceSubtotal: (existingLine.productQty + qtyToOrder) * bestPricelist.price
                                }
                            });
                        } else {
                            await prisma.purchaseOrderLine.create({
                                data: {
                                    orderId: draftPO.id,
                                    productId: orderpoint.productId,
                                    name: orderpoint.product.name,
                                    productQty: qtyToOrder,
                                    priceUnit: bestPricelist.price,
                                    priceSubtotal: qtyToOrder * bestPricelist.price
                                }
                            });
                        }

                        // Recalculate PO Totals
                        const updatedOrder = await prisma.purchaseOrder.findUnique({
                            where: { id: draftPO.id },
                            include: { lines: true }
                        });
                        if (updatedOrder) {
                            const untaxed = updatedOrder.lines.reduce((acc, l) => acc + l.priceSubtotal, 0);
                            await prisma.purchaseOrder.update({
                                where: { id: updatedOrder.id },
                                data: {
                                    amountUntaxed: untaxed,
                                    amountTax: untaxed * 0.15,
                                    amountTotal: untaxed * 1.15
                                }
                            });
                        }

                    } else {
                        // Create fresh PO
                        const count = await prisma.purchaseOrder.count();
                        const name = `P0${String(count + 1).padStart(4, '0')}`;
                        const untaxed = qtyToOrder * bestPricelist.price;

                        await prisma.purchaseOrder.create({
                            data: {
                                name,
                                partnerId: bestPricelist.partnerId,
                                state: 'draft',
                                amountUntaxed: untaxed,
                                amountTax: untaxed * 0.15,
                                amountTotal: untaxed * 1.15,
                                lines: {
                                    create: {
                                        productId: orderpoint.productId,
                                        name: orderpoint.product.name,
                                        productQty: qtyToOrder,
                                        priceUnit: bestPricelist.price,
                                        priceSubtotal: untaxed
                                    }
                                }
                            }
                        });
                    }

                    triggeredCount++;
                    console.log(`✅ Replenished: ${orderpoint.product.name} (+${qtyToOrder})`);
                }
            }

            console.log(`🏁 Replenishment complete. ${triggeredCount} products processed.`);
            return { success: true, processed: triggeredCount };

        } catch (error) {
            console.error('❌ Replenishment Engine Failure:', error);
            throw error;
        }
    }
}
