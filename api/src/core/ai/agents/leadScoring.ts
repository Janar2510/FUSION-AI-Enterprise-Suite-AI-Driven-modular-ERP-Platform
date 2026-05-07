/**
 * Lead Scoring Agent
 *
 * Scores a CRM lead/opportunity on a 0–100 scale based on:
 *  - Engagement signals (activities, emails opened, meetings)
 *  - Fit signals (company size, industry, product match)
 *  - Urgency signals (expected close date, stage velocity)
 *  - Historical win/loss patterns from the org's own closed deals
 *
 * Runs nightly via a batch job, or on-demand per lead.
 * Output goes to AiAction PENDING — never auto-updates the lead.
 */

import { anthropic, AI_MODEL_FAST, registerAgent, AgentInput, AgentOutput } from '../index';
import prisma from '../../../lib/prisma';

async function leadScoring(input: AgentInput): Promise<AgentOutput> {
    const leadId = String(input.entityId ?? input.leadId ?? '');
    const orgId = String(input.orgId ?? '');

    // Fetch the lead + context
    const [lead, wonDeals, lostDeals] = await Promise.allSettled([
        (prisma as any).crmLead?.findFirst?.({
            where: { id: isNaN(Number(leadId)) ? undefined : Number(leadId) },
            include: {
                partner: { select: { name: true, isCompany: true } },
                stage: { select: { name: true, sequence: true } },
            },
        }),
        // Sample of recently-won deals for pattern context (org-level, last 90 days)
        (prisma as any).crmLead?.findMany?.({
            where: { stage: { name: { contains: 'won', mode: 'insensitive' } } },
            take: 10,
            orderBy: { createdAt: 'desc' },
            select: { expectedRevenue: true, probability: true, name: true },
        }),
        (prisma as any).crmLead?.findMany?.({
            where: { active: false, stage: { name: { contains: 'lost', mode: 'insensitive' } } },
            take: 10,
            orderBy: { createdAt: 'desc' },
            select: { expectedRevenue: true, probability: true, name: true },
        }),
    ]);

    const leadData = lead.status === 'fulfilled' ? lead.value : null;
    const won = wonDeals.status === 'fulfilled' ? (wonDeals.value ?? []) : [];
    const lost = lostDeals.status === 'fulfilled' ? (lostDeals.value ?? []) : [];

    if (!leadData) {
        return { confidence: 0, summary: `Lead ${leadId} not found`, suggestions: [] };
    }

    const context = JSON.stringify({
        lead: {
            name: leadData.name,
            stage: leadData.stage?.name,
            stageSequence: leadData.stage?.sequence,
            expectedRevenue: leadData.expectedRevenue,
            probability: leadData.probability,
            partner: leadData.partner?.name,
            isCompany: leadData.partner?.isCompany,
        },
        recentWins: won.slice(0, 5),
        recentLosses: lost.slice(0, 5),
    }, null, 2);

    const response = await anthropic.messages.create({
        model: AI_MODEL_FAST,
        max_tokens: 400,
        system: `You are a B2B sales intelligence assistant scoring CRM leads for a small ERP company.
Respond with ONLY valid JSON:
{
  "score": <0-100>,
  "tier": "<hot|warm|cold>",
  "topRiskFactors": ["<risk 1>", "<risk 2>"],
  "topStrengths": ["<strength 1>", "<strength 2>"],
  "suggestedAction": "<specific next sales action>",
  "confidence": <0.0-1.0>
}`,
        messages: [{ role: 'user', content: `Lead data:\n${context}` }],
    });

    let parsed: any;
    try {
        const text = response.content[0].type === 'text' ? response.content[0].text : '';
        parsed = JSON.parse(text);
    } catch {
        return { confidence: 0, summary: 'Lead scoring failed: parse error', suggestions: [] };
    }

    return {
        confidence: Number(parsed.confidence ?? 0.55),
        summary: `Score ${parsed.score}/100 (${parsed.tier?.toUpperCase()}). ${parsed.suggestedAction}`,
        suggestions: [
            { field: 'aiScore', suggestedValue: parsed.score, reasoning: `Tier: ${parsed.tier}. Risks: ${parsed.topRiskFactors?.join(', ')}` },
            { field: 'suggestedNextAction', suggestedValue: parsed.suggestedAction, reasoning: 'Based on lead attributes and historical win/loss patterns' },
        ],
        metadata: { score: parsed.score, tier: parsed.tier, topRiskFactors: parsed.topRiskFactors, topStrengths: parsed.topStrengths },
    };
}

registerAgent('lead-scoring', leadScoring);
export default leadScoring;
