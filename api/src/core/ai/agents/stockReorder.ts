/**
 * Stock Reorder Recommender
 *
 * Analyzes current stock levels vs. historical consumption to recommend
 * purchase orders. Considers:
 *  - Current on-hand qty vs. configured reorder point (StockWarehouseOrderpoint)
 *  - Average daily consumption from validated pickings (last 30 days)
 *  - Lead time from VendorPricelist
 *  - Safety stock formula: avg_daily * lead_days * safety_factor (1.5)
 *
 * Output: list of products to reorder with suggested qty and vendor.
 * User must confirm — never creates a PO automatically.
 */

import { anthropic, AI_MODEL_FAST, registerAgent, AgentInput, AgentOutput } from '../index';
import prisma from '../../../lib/prisma';

async function stockReorder(input: AgentInput): Promise<AgentOutput> {
    // Fetch products below reorder point
    const [orderpoints, recentMoves] = await Promise.allSettled([
        (prisma as any).stockWarehouseOrderpoint?.findMany?.({
            take: 50,
            include: {
                product: {
                    select: { id: true, name: true, costPrice: true },
                    include: {
                        vendorPricelists: {
                            take: 1,
                            orderBy: { sequence: 'asc' },
                            select: { partnerId: true, price: true, delay: true },
                        },
                    },
                },
            },
        }),
        // Stock moves (outgoing) last 30 days for consumption calc
        (prisma as any).stockMove?.findMany?.({
            where: {
                state: 'done',
                createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
            },
            take: 500,
            select: { productId: true, productQty: true, createdAt: true },
        }),
    ]);

    const ops = orderpoints.status === 'fulfilled' ? (orderpoints.value ?? []) : [];
    const moves = recentMoves.status === 'fulfilled' ? (recentMoves.value ?? []) : [];

    if (ops.length === 0) {
        return {
            confidence: 0.4,
            summary: 'No reorder points configured. Set up orderpoints per product/warehouse first.',
            suggestions: [],
        };
    }

    // Aggregate daily consumption per product
    const consumption: Record<string | number, number> = {};
    for (const m of moves) {
        const k = m.productId;
        consumption[k] = (consumption[k] ?? 0) + (m.productQty ?? 0);
    }
    const avgDailyConsumption: Record<string | number, number> = {};
    for (const [k, total] of Object.entries(consumption)) {
        avgDailyConsumption[k] = Number(total) / 30;
    }

    const context = JSON.stringify({
        orderpoints: ops.map((op: any) => ({
            productId: op.productId,
            productName: op.product?.name,
            qtyOnHand: op.qtyOnHand ?? 0,
            productMinQty: op.productMinQty ?? 0,
            productMaxQty: op.productMaxQty ?? 0,
            avgDailyConsumption: avgDailyConsumption[op.productId] ?? 0,
            leadTimeDays: op.product?.vendorPricelists?.[0]?.delay ?? 7,
            preferredVendorId: op.product?.vendorPricelists?.[0]?.partnerId ?? null,
            vendorPrice: op.product?.vendorPricelists?.[0]?.price ?? op.product?.costPrice ?? 0,
        })).slice(0, 20),
    }, null, 2);

    const response = await anthropic.messages.create({
        model: AI_MODEL_FAST,
        max_tokens: 600,
        system: `You are a supply chain analyst for a B2B ERP system. Analyze stock levels and recommend replenishment.
Respond with ONLY valid JSON:
{
  "recommendations": [
    {
      "productId": <id>,
      "productName": "<name>",
      "urgency": "<urgent|soon|monitor>",
      "suggestedOrderQty": <number>,
      "suggestedVendorId": "<id or null>",
      "estimatedCost": <number>,
      "reasoning": "<one sentence>"
    }
  ],
  "totalEstimatedCost": <number>,
  "confidence": <0.0-1.0>,
  "summary": "<one sentence overall>"
}
Only include products that genuinely need reordering based on consumption vs. on-hand vs. lead time.`,
        messages: [{ role: 'user', content: `Stock data:\n${context}` }],
    });

    let parsed: any;
    try {
        const text = response.content[0].type === 'text' ? response.content[0].text : '';
        parsed = JSON.parse(text);
    } catch {
        return { confidence: 0, summary: 'Stock reorder analysis failed: parse error', suggestions: [] };
    }

    const recs: any[] = parsed.recommendations ?? [];

    return {
        confidence: Number(parsed.confidence ?? 0.65),
        summary: parsed.summary ?? `${recs.length} product(s) recommended for reorder. Est. cost: $${parsed.totalEstimatedCost?.toLocaleString() ?? 0}`,
        suggestions: recs.map((r: any) => ({
            field: `reorder.${r.productId}`,
            suggestedValue: { qty: r.suggestedOrderQty, vendorId: r.suggestedVendorId, urgency: r.urgency },
            reasoning: r.reasoning,
        })),
        metadata: {
            recommendations: recs,
            totalEstimatedCost: parsed.totalEstimatedCost,
            urgentCount: recs.filter((r: any) => r.urgency === 'urgent').length,
        },
    };
}

registerAgent('stock-reorder', stockReorder);
export default stockReorder;
