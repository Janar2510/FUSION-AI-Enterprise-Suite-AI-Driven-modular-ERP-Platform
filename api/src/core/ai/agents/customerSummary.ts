/**
 * Customer Summary Agent
 *
 * Given a partner ID, fetches their timeline events + CRM leads + sales orders
 * and produces a concise account intelligence summary.
 *
 * The output is stored as AiAction (PENDING) and cached: re-run only when
 * a new TimelineEvent for this partner is created (callers check cache age).
 *
 * Agent is read-only — it never mutates any record.
 */

import { anthropic, AI_MODEL, registerAgent, AgentInput, AgentOutput } from '../index';
import prisma from '../../../lib/prisma';

async function customerSummary(input: AgentInput): Promise<AgentOutput> {
    const partnerId = String(input.entityId ?? input.partnerId ?? '');
    if (!partnerId) {
        return { confidence: 0, summary: 'No partnerId provided', suggestions: [] };
    }

    // Gather partner context (best-effort; empty arrays if model not migrated yet)
    const [partner, timelineEvents, crmLeads, salesOrders] = await Promise.allSettled([
        (prisma as any).partner?.findUnique?.({
            where: { id: partnerId },
            select: { name: true, email: true, phone: true, isCompany: true },
        }),
        (prisma as any).timelineEvent?.findMany?.({
            where: { partnerId },
            orderBy: { createdAt: 'desc' },
            take: 20,
            select: { eventType: true, summary: true, createdAt: true },
        }),
        (prisma as any).crmLead?.findMany?.({
            where: { partnerId },
            orderBy: { createdAt: 'desc' },
            take: 10,
            select: { name: true, stage: true, expectedRevenue: true },
        }),
        (prisma as any).saleOrder?.findMany?.({
            where: { partnerId },
            orderBy: { dateOrder: 'desc' },
            take: 10,
            select: { name: true, state: true, amountTotal: true, dateOrder: true },
        }),
    ]);

    const partnerData = partner.status === 'fulfilled' ? partner.value : null;
    const events = timelineEvents.status === 'fulfilled' ? (timelineEvents.value ?? []) : [];
    const leads = crmLeads.status === 'fulfilled' ? (crmLeads.value ?? []) : [];
    const orders = salesOrders.status === 'fulfilled' ? (salesOrders.value ?? []) : [];

    const context = JSON.stringify({
        partner: partnerData,
        recentActivity: events.slice(0, 10),
        openOpportunities: leads.filter((l: any) => !['won', 'lost'].includes(l.stage)),
        recentOrders: orders.slice(0, 5),
    }, null, 2);

    const response = await anthropic.messages.create({
        model: AI_MODEL,
        max_tokens: 600,
        system: `You are a CRM analyst for a B2B ERP. Produce a concise account intelligence summary for the sales team.
Respond with ONLY valid JSON in this exact shape:
{
  "headline": "<one sentence account health statement>",
  "healthScore": <0-100>,
  "keyInsights": ["<insight 1>", "<insight 2>", "<insight 3>"],
  "suggestedNextAction": "<specific next action for the sales rep>",
  "confidence": <0.0-1.0>
}`,
        messages: [
            {
                role: 'user',
                content: `Account data for partner ${partnerId}:\n${context}`,
            },
        ],
    });

    let parsed: any;
    try {
        const text = response.content[0].type === 'text' ? response.content[0].text : '';
        parsed = JSON.parse(text);
    } catch {
        return {
            confidence: 0,
            summary: 'Summary failed: could not parse model response',
            suggestions: [],
        };
    }

    return {
        confidence: Number(parsed.confidence ?? 0.6),
        summary: parsed.headline ?? 'No summary generated',
        suggestions: [
            {
                field: 'healthScore',
                suggestedValue: parsed.healthScore,
                reasoning: 'Computed from recent activity, pipeline, and order history',
            },
            {
                field: 'keyInsights',
                suggestedValue: parsed.keyInsights,
                reasoning: 'AI-extracted insights from timeline and CRM data',
            },
            {
                field: 'suggestedNextAction',
                suggestedValue: parsed.suggestedNextAction,
                reasoning: 'Recommended action based on account intelligence',
            },
        ],
        metadata: { healthScore: parsed.healthScore, partnerName: partnerData?.name },
    };
}

registerAgent('customer-summary', customerSummary);
export default customerSummary;
