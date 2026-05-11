/**
 * Subscription Churn Prediction Agent (agentKey: 'predict_churn')
 *
 * Analyzes a subscription's payment history, usage signals, and customer
 * profile to predict churn risk and suggest retention actions.
 * Output → AiAction PENDING; CS manager must approve before acting.
 */

import { anthropic, AI_MODEL_FAST, registerAgent, AgentInput, AgentOutput } from '../index';
import prisma from '../../../lib/prisma';

async function predictChurn(input: AgentInput): Promise<AgentOutput> {
    const subscriptionId = input.entityId ?? input.subscriptionId;
    const subIdNum = typeof subscriptionId === 'number'
        ? subscriptionId
        : parseInt(String(subscriptionId ?? '0'), 10);

    const subscription = await (prisma as any).saleSubscription?.findUnique?.({
        where: { id: subIdNum },
        include: {
            partner: { select: { name: true, email: true } },
        },
    });

    if (!subscription) {
        return { confidence: 0.3, summary: 'Subscription not found.', suggestions: [] };
    }

    const partnerName = subscription.partner?.name ?? 'Unknown customer';
    const plan = subscription.recurringPlan ?? subscription.planCode ?? 'N/A';
    const mrr = subscription.recurringTotal ?? subscription.monthlyRecurringRevenue ?? 0;
    const stage = subscription.stage ?? subscription.state ?? 'active';
    const startDate = subscription.dateStart ? new Date(subscription.dateStart).toLocaleDateString() : 'unknown';

    // Fetch recent invoices for payment history
    const recentInvoices = await (prisma as any).accountMove?.findMany?.({
        where: {
            partnerId: subscription.partnerId,
            moveType: 'out_invoice',
            state: { in: ['posted', 'cancel'] },
        },
        orderBy: { invoiceDate: 'desc' },
        take: 12,
        select: { state: true, paymentState: true, amountTotal: true, invoiceDate: true, invoiceDateDue: true },
    }) ?? [];

    const overdueCount = (recentInvoices as any[]).filter(
        (inv: any) => inv.paymentState === 'not_paid' &&
            inv.invoiceDateDue && new Date(inv.invoiceDateDue) < new Date()
    ).length;

    const cancelledCount = (recentInvoices as any[]).filter((inv: any) => inv.state === 'cancel').length;

    const prompt = `You are a customer success specialist analyzing subscription churn risk.

Subscription details:
- Customer: ${partnerName}
- Plan: ${plan}
- Monthly Revenue: $${mrr}
- Stage/State: ${stage}
- Start Date: ${startDate}
- Recent invoices analyzed: ${(recentInvoices as any[]).length}
- Overdue invoices: ${overdueCount}
- Cancelled invoices: ${cancelledCount}

Task: Assess churn risk and recommend retention actions.

Respond in JSON:
{
  "churnRiskScore": <0.0 (no risk) to 1.0 (certain churn)>,
  "riskLevel": "low|medium|high|critical",
  "churnReason": "<primary predicted reason for potential churn>",
  "retentionActions": [
    { "action": "<specific action>", "urgency": "immediate|this_week|this_month", "expectedImpact": "<impact>" }
  ],
  "summary": "<one-paragraph churn risk assessment>"
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
        parsed = { churnRiskScore: 0.5, riskLevel: 'medium', retentionActions: [], summary: raw.slice(0, 200) };
    }

    const riskScore = typeof parsed.churnRiskScore === 'number'
        ? Math.max(0, Math.min(1, parsed.churnRiskScore))
        : 0.5;

    return {
        confidence: 0.75,
        summary: parsed.summary ?? `Churn risk assessment for ${partnerName}: ${parsed.riskLevel ?? 'medium'}`,
        suggestions: (parsed.retentionActions ?? []).map((a: any, idx: number) => ({
            field: `retention_action_${idx + 1}`,
            suggestedValue: { action: a.action, urgency: a.urgency, expectedImpact: a.expectedImpact },
            reasoning: a.action ?? '',
            isSensitive: a.urgency === 'immediate',
        })),
        metadata: {
            subscriptionId,
            customerName: partnerName,
            plan,
            mrr,
            churnRiskScore: riskScore,
            riskLevel: parsed.riskLevel ?? 'medium',
            churnReason: parsed.churnReason ?? '',
            overdueInvoices: overdueCount,
        },
    };
}

registerAgent('predict_churn', predictChurn);
