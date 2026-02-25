import prisma from '../../lib/prisma';

/**
 * Vendor Intelligence Service
 * Analyzes vendor performance, specifically lead time accuracy.
 */
export class VendorIntelligenceService {
    /**
     * Updates vendor lead time intelligence based on a confirmed reception.
     */
    static async updateVendorStats(purchaseOrderId: number) {
        console.log(`🧠 AI Intelligence: Analyzing Vendor Performance for PO #${purchaseOrderId}`);

        const po = await prisma.purchaseOrder.findUnique({
            where: { id: purchaseOrderId },
            include: { pickings: true, partner: true }
        });

        if (!po || !po.dateApprove) return;

        const donePicking = po.pickings.find(p => p.state === 'done' && p.dateDone);
        if (!donePicking || !donePicking.dateDone) return;

        // Calculate actual delay: dateDone - dateApprove
        const plannedDate = po.dateApprove.getTime();
        const actualDate = donePicking.dateDone.getTime();
        const delayDays = Math.round((actualDate - plannedDate) / (1000 * 60 * 60 * 24));

        console.log(`📈 Vendor ${po.partner.name} delivered in ${delayDays} days.`);

        // Update Vendor Pricelist logic could go here to adjust "delay" property
        // For Phase 15, we'll just log this for now as "Intelligence" and 
        // maybe update the most relevant pricelist.

        const pricelists = await prisma.vendorPricelist.findMany({
            where: { partnerId: po.partnerId }
        });

        for (const pl of pricelists) {
            // Simple moving average for delay intelligence
            const newDelay = Math.round((pl.delay * 0.8) + (delayDays * 0.2));
            await prisma.vendorPricelist.update({
                where: { id: pl.id },
                data: { delay: newDelay }
            });
        }
    }
}
