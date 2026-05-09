/**
 * Next Best Action Agent
 *
 * Given a partner's 360° profile (CRM leads, sales orders, invoices,
 * support tickets, timesheets), recommends the highest-value action
 * a salesperson or CSM should take next.
 *
 * Output is PENDING — never auto-sends emails, creates tasks, or
 * modifies records.
 */

import { anthropic, AI_MODEL_FAST, registerAgent, AgentInput, AgentOutput } from '../index';
import prisma from '../../../lib/prisma';

async function nextBestAction(input: AgentInput): Promise<AgentOutput> {
    const partnerId = String(input.entityId ?? input.partnerId ?? '');

    if (!partnerId) {
        return {
            confidence: 0.0,
            summary: 'No partnerId provided.',
            suggestions: [],
        };
    }

    // Fetch partner + recent activity
    const [partner, leads, orders, invoices, tickets] = await Promise.allSettled([
        prisma.partner.findUnique({
            where: { id: partnerId },
            select: { name: true, email: true, isCompany: true, city: true, country: true },
        }),
        prisma.crmLead.findMany({
            where: { partnerId },
            orderBy: { updatedAt: 'desc' },
            take: 5,
            select: { name: true, stage: { select: { name: true } }, expectedRevenue: true, updatedAt: true },
        }),
        prisma.saleOrder.findMany({
            where: { partnerId },
            orderBy: { createdAt: 'desc' },
            take: 5,
            select: { name: true, state: true, amountTotal: true, createdAt: true },
        }),
        (prisma as any).accountMove?.findMany?.({
            where: { partnerId, moveType: 'out_invoice' },
            orderBy: { date: 'desc' },
            take: 5,
            select: { name: true, state: true, paymentState: true, amountTotal: true, dueDate: true },
        }) ?? [],
        prisma.helpdeskTicket.findMany({
            where: { partnerId },
            orderBy: { createdAt: 'desc' },
            take: 5,
            select: { name: true, priority: true, stageId: true, createdAt: true },
        }),
    ]);

    const partnerData = partners(partner);
    const leadsData = resolve(leads, []);
    const ordersData = resolve(orders, []);
    const invoicesData = resolve(invoices, []);
    const ticketsData = resolve(tickets, []);

    const prompt = `You are a CRM and sales advisor for an ERP system. Based on the customer profile below, recommend the single best action the account manager should take next.

Customer: ${JSON.stringify(partnerData)}

Recent CRM leads (last 5):
${JSON.stringify(leadsData, null, 2)}

Recent sales orders (last 5):
${JSON.stringify(ordersData, null, 2)}

Recent invoices (last 5):
${JSON.stringify(invoicesData, null, 2)}

Recent support tickets (last 5):
${JSON.stringify(ticketsData, null, 2)}

Respond in JSON with this schema:
{
  "nextBestAction": {
    "type": "follow_up_call | send_quote | schedule_demo | resolve_ticket | collect_payment | upsell | check_in | other",
    "title": "Short action title (< 10 words)",
    "description": "Detailed description of what to do and why (2-3 sentences)",
    "urgency": "high | medium | low",
    "estimatedImpact": "revenue impact or relationship impact"
  },
  "secondaryActions": [
    { "type": "...", "title": "..." }
  ],
  "reasoning": "Why this is the highest-value action right now",
  "confidence": 0.0-1.0,
  "summary": "One sentence summary"
}`;

    const msg = await anthropic.messages.create({
        model: AI_MODEL_FAST,
        max_tokens: 768,
        messages: [{ role: 'user', content: prompt }],
    });

    const raw = (msg.content[0] as any).text ?? '{}';
    let parsed: any = {};
    try {
        const match = raw.match(/\{[\s\S]*\}/);
        parsed = match ? JSON.parse(match[0]) : {};
    } catch {
        parsed = { confidence: 0.5, summary: 'Parsing failed', nextBestAction: null };
    }

    const nba = parsed.nextBestAction ?? {};

    return {
        confidence: parsed.confidence ?? 0.75,
        summary: parsed.summary ?? nba.title ?? 'Recommendation generated.',
        suggestions: [
            {
                field: 'nextBestAction',
                suggestedValue: nba,
                reasoning: parsed.reasoning ?? '',
                isSensitive: false,
            },
            ...(parsed.secondaryActions ?? []).map((a: any) => ({
                field: 'secondaryAction',
                suggestedValue: a,
                reasoning: '',
                isSensitive: false,
            })),
        ],
        metadata: {
            partnerId,
            leadsAnalyzed: leadsData.length,
            ordersAnalyzed: ordersData.length,
            invoicesAnalyzed: invoicesData.length,
            ticketsAnalyzed: ticketsData.length,
        },
    };
}

function partners(r: PromiseSettledResult<any>) {
    return r.status === 'fulfilled' ? r.value : null;
}
function resolve(r: PromiseSettledResult<any>, fallback: any) {
    return r.status === 'fulfilled' ? (r.value ?? fallback) : fallback;
}

registerAgent('next-best-action', nextBestAction);
