/**
 * Vendor Evaluation Agent (agentKey: 'evaluate_vendor')
 *
 * Analyzes a vendor/partner's purchase history, delivery performance, and
 * pricing to produce a structured vendor scorecard.
 * Output → AiAction PENDING; procurement manager approves before sharing.
 */

import { anthropic, AI_MODEL_FAST, registerAgent, AgentInput, AgentOutput } from '../index';
import prisma from '../../../lib/prisma';

async function evaluateVendor(input: AgentInput): Promise<AgentOutput> {
    const partnerId = input.entityId ?? input.partnerId ?? input.vendorId;
    const partnerIdNum = typeof partnerId === 'number'
        ? partnerId
        : parseInt(String(partnerId ?? '0'), 10);

    const [partner, purchaseOrders] = await Promise.all([
        (prisma as any).resPartner?.findUnique?.({
            where: { id: partnerIdNum },
            select: { name: true, email: true, supplierRank: true, customerRank: true },
        }),
        (prisma as any).purchaseOrder?.findMany?.({
            where: { partnerId: partnerIdNum },
            orderBy: { dateOrder: 'desc' },
            take: 24,
            select: {
                name: true,
                dateOrder: true,
                dateApprove: true,
                dateExpected: true,
                dateDelivered: true,
                state: true,
                amountTotal: true,
                lines: {
                    select: { productQty: true, priceUnit: true, qtyDelivered: true, qtyInvoiced: true },
                },
            },
        }) ?? [],
    ]);

    if (!partner) {
        return { confidence: 0.3, summary: 'Vendor not found.', suggestions: [] };
    }

    const vendorName = partner.name ?? 'Unknown vendor';
    const totalOrders = (purchaseOrders as any[]).length;
    const totalSpend = (purchaseOrders as any[]).reduce((s: number, po: any) => s + (po.amountTotal ?? 0), 0);

    // Delivery performance
    const deliveredOrders = (purchaseOrders as any[]).filter((po: any) => po.dateDelivered);
    const lateDeliveries = deliveredOrders.filter((po: any) => {
        if (!po.dateDelivered || !po.dateExpected) return false;
        return new Date(po.dateDelivered) > new Date(po.dateExpected);
    }).length;
    const onTimeRate = deliveredOrders.length
        ? Math.round(((deliveredOrders.length - lateDeliveries) / deliveredOrders.length) * 100)
        : null;

    // Fill rate
    const allLines = (purchaseOrders as any[]).flatMap((po: any) => po.lines ?? []);
    const totalOrdered = allLines.reduce((s: number, l: any) => s + (l.productQty ?? 0), 0);
    const totalDelivered = allLines.reduce((s: number, l: any) => s + (l.qtyDelivered ?? 0), 0);
    const fillRate = totalOrdered > 0 ? Math.round((totalDelivered / totalOrdered) * 100) : null;

    const prompt = `You are a procurement analyst evaluating a supplier's performance.

Vendor: ${vendorName}
Total purchase orders (last 24): ${totalOrders}
Total spend: $${totalSpend.toFixed(2)}
On-time delivery rate: ${onTimeRate != null ? `${onTimeRate}%` : 'N/A'}
Fill rate (qty delivered / ordered): ${fillRate != null ? `${fillRate}%` : 'N/A'}
Late deliveries: ${lateDeliveries}

Task: Produce a comprehensive vendor scorecard and recommendations.

Respond in JSON:
{
  "overallScore": <0.0 to 1.0>,
  "grade": "A|B|C|D|F",
  "scorecard": {
    "deliveryPerformance": <0.0-1.0>,
    "priceCompetitiveness": <0.0-1.0>,
    "fillRate": <0.0-1.0>,
    "overallReliability": <0.0-1.0>
  },
  "strengths": ["<strength1>"],
  "weaknesses": ["<weakness1>"],
  "recommendations": [
    { "action": "<action>", "priority": "high|medium|low", "reasoning": "<why>" }
  ],
  "summary": "<2-3 sentence vendor assessment>"
}`;

    const msg = await anthropic.messages.create({
        model: AI_MODEL_FAST,
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }],
    });

    const raw = (msg.content[0] as any).text ?? '{}';
    let parsed: any = {};
    try {
        const match = raw.match(/\{[\s\S]*\}/);
        parsed = match ? JSON.parse(match[0]) : {};
    } catch {
        parsed = { overallScore: 0.5, grade: 'C', scorecard: {}, recommendations: [], summary: raw.slice(0, 200) };
    }

    const overallScore = typeof parsed.overallScore === 'number'
        ? Math.max(0, Math.min(1, parsed.overallScore))
        : 0.5;

    return {
        confidence: totalOrders > 0 ? 0.82 : 0.40,
        summary: parsed.summary ?? `Vendor evaluation for ${vendorName}: Grade ${parsed.grade ?? 'N/A'}`,
        suggestions: (parsed.recommendations ?? []).map((r: any, idx: number) => ({
            field: `vendor_action_${idx + 1}`,
            suggestedValue: { action: r.action, priority: r.priority },
            reasoning: r.reasoning ?? '',
            isSensitive: r.priority === 'high',
        })),
        metadata: {
            partnerId,
            vendorName,
            grade: parsed.grade ?? 'N/A',
            overallScore,
            scorecard: parsed.scorecard ?? {},
            strengths: parsed.strengths ?? [],
            weaknesses: parsed.weaknesses ?? [],
            totalOrders,
            totalSpend,
            onTimeRate,
            fillRate,
        },
    };
}

registerAgent('evaluate_vendor', evaluateVendor);
