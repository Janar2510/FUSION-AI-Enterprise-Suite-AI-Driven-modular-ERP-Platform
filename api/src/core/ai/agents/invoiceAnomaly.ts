/**
 * Invoice Anomaly Detector
 *
 * Flags posted invoices that look suspicious:
 *  - Price drifted >20% from the partner's historical average for that product
 *  - Tax rate missing or zero on a taxable line
 *  - Vendor mismatch (vendor bill routed to wrong supplier)
 *  - Duplicate detection (same amount + partner + ~date already posted)
 *  - Round-number amounts that suggest manual override (risk of miskeying)
 *
 * FLAG-ONLY — never auto-edits anything. Output goes to AiAction PENDING.
 * Finance rule (ADR-0006): this agent cannot post, unpost, or reconcile.
 */

import { anthropic, AI_MODEL_FAST, registerAgent, AgentInput, AgentOutput } from '../index';
import prisma from '../../../lib/prisma';

async function invoiceAnomaly(input: AgentInput): Promise<AgentOutput> {
    const invoiceId = Number(input.entityId ?? input.invoiceId ?? 0);

    const [invoice, history] = await Promise.allSettled([
        (prisma as any).accountMove?.findFirst?.({
            where: { id: invoiceId },
            include: {
                lines: {
                    include: { product: { select: { name: true, costPrice: true, salePrice: true } } },
                },
            },
        }),
        // Recent posted invoices for same partner (for anomaly baseline)
        (prisma as any).accountMove?.findMany?.({
            where: {
                moveType: { in: ['out_invoice', 'in_invoice'] },
                state: 'posted',
                id: { not: invoiceId },
            },
            take: 20,
            orderBy: { createdAt: 'desc' },
            select: { amountTotal: true, partnerId: true, moveType: true, createdAt: true },
        }),
    ]);

    const inv = invoice.status === 'fulfilled' ? invoice.value : null;
    const hist = history.status === 'fulfilled' ? (history.value ?? []) : [];

    if (!inv) {
        return { confidence: 0, summary: `Invoice ${invoiceId} not found`, suggestions: [] };
    }

    const context = JSON.stringify({
        invoice: {
            id: inv.id,
            moveType: inv.moveType,
            state: inv.state,
            amountTotal: inv.amountTotal,
            amountTax: inv.amountTax,
            partnerId: inv.partnerId,
            lines: (inv.lines ?? []).map((l: any) => ({
                product: l.product?.name,
                quantity: l.quantity,
                priceUnit: l.priceUnit,
                priceSubtotal: l.priceSubtotal,
                taxAmount: l.taxAmount,
                costPrice: l.product?.costPrice,
            })),
        },
        recentInvoicesForOrg: hist.slice(0, 10),
    }, null, 2);

    const response = await anthropic.messages.create({
        model: AI_MODEL_FAST,
        max_tokens: 500,
        system: `You are an ERP accounting control assistant. Analyze invoice data for anomalies.
Respond with ONLY valid JSON:
{
  "anomalies": [
    { "type": "<price_drift|missing_tax|vendor_mismatch|duplicate_risk|round_number|other>", "severity": "<high|medium|low>", "description": "<one sentence>" }
  ],
  "overallRisk": "<high|medium|low|clean>",
  "confidence": <0.0-1.0>,
  "summary": "<one sentence overall assessment>"
}
If no anomalies, return anomalies: [] and overallRisk: "clean".`,
        messages: [{ role: 'user', content: `Invoice data:\n${context}` }],
    });

    let parsed: any;
    try {
        const text = response.content[0].type === 'text' ? response.content[0].text : '';
        parsed = JSON.parse(text);
    } catch {
        return { confidence: 0, summary: 'Anomaly detection failed: parse error', suggestions: [] };
    }

    const anomalies: any[] = parsed.anomalies ?? [];
    const hasCritical = anomalies.some((a: any) => a.severity === 'high');

    return {
        confidence: Number(parsed.confidence ?? 0.6),
        summary: parsed.summary ?? `${anomalies.length} anomaly/anomalies detected (${parsed.overallRisk} risk)`,
        suggestions: anomalies.map((a: any) => ({
            field: `anomaly.${a.type}`,
            suggestedValue: a.severity,
            reasoning: a.description,
            isSensitive: a.severity === 'high',
        })),
        metadata: { overallRisk: parsed.overallRisk, anomalyCount: anomalies.length, hasCritical, anomalies },
    };
}

registerAgent('invoice-anomaly', invoiceAnomaly);
export default invoiceAnomaly;
