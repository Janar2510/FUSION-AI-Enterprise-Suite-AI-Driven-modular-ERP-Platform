/**
 * Manufacturing Schedule Optimizer Agent
 *
 * Analyzes confirmed manufacturing orders + available work centers and
 * returns an optimized production schedule with reasoning. Output goes to
 * AiAction PENDING — operator must confirm before the schedule is applied.
 *
 * Hard rule (ADR-0006): agent never mutates MO records directly.
 */

import { anthropic, AI_MODEL_FAST, registerAgent, AgentInput, AgentOutput } from '../index';
import prisma from '../../../lib/prisma';

async function manufacturingScheduler(input: AgentInput): Promise<AgentOutput> {
    const orgId = String(input.orgId ?? '');

    const [orders, workcenters] = await Promise.all([
        (prisma as any).mrpProduction?.findMany?.({
            where: { state: { in: ['confirmed', 'progress'] } },
            include: { product: { select: { name: true } }, bom: { select: { name: true } } },
            orderBy: { scheduledDate: 'asc' },
            take: 50,
        }) ?? [],
        (prisma as any).mrpWorkcenter?.findMany?.({
            where: { active: true },
            select: { id: true, name: true, timeEfficiency: true, capacityPerCycle: true },
        }) ?? [],
    ]);

    const ordersText = (orders as any[]).length
        ? (orders as any[]).map((o: any, i: number) =>
            `${i + 1}. MO ${o.name}: product="${o.product?.name ?? 'N/A'}", qty=${o.productQty}, scheduled=${o.scheduledDate ?? 'unscheduled'}, state=${o.state}`
          ).join('\n')
        : 'No confirmed orders found.';

    const wcText = (workcenters as any[]).length
        ? (workcenters as any[]).map((w: any) =>
            `- ${w.name} (id=${w.id}, efficiency=${w.timeEfficiency}%, capacity=${w.capacityPerCycle})`
          ).join('\n')
        : 'No active work centers found.';

    const prompt = `You are a manufacturing operations optimizer for an ERP system.

Current manufacturing orders (confirmed or in-progress):
${ordersText}

Available work centers:
${wcText}

Task: Produce an optimized production schedule. For each order:
1. Recommend the best work center based on capacity and efficiency
2. Suggest a start time sequence to minimize idle time and bottlenecks
3. Flag any scheduling conflicts or resource constraints
4. Estimate overall throughput improvement vs. current order

Respond in JSON matching this schema exactly:
{
  "summary": "One-sentence summary of the optimization",
  "schedule": [
    {
      "orderId": <number>,
      "orderName": "<string>",
      "recommendedWorkcenterId": <number>,
      "recommendedWorkcenterName": "<string>",
      "suggestedStartOffset": <hours from now>,
      "reasoning": "<short reasoning>"
    }
  ],
  "conflicts": ["<conflict description>"],
  "estimatedThroughputGain": "<percentage or 'N/A'>"
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
        parsed = { summary: raw.slice(0, 200), schedule: [], conflicts: [] };
    }

    const hasOrders = (orders as any[]).length > 0 && (workcenters as any[]).length > 0;

    return {
        confidence: hasOrders ? 0.82 : 0.40,
        summary: parsed.summary ?? 'Schedule optimization complete.',
        suggestions: (parsed.schedule ?? []).map((s: any) => ({
            field: `mo_${s.orderId}_workcenter`,
            currentValue: 'unassigned',
            suggestedValue: {
                workcenterId: s.recommendedWorkcenterId,
                workcenterName: s.recommendedWorkcenterName,
                startOffsetHours: s.suggestedStartOffset,
            },
            reasoning: s.reasoning ?? '',
        })),
        metadata: {
            conflicts: parsed.conflicts ?? [],
            estimatedThroughputGain: parsed.estimatedThroughputGain ?? 'N/A',
            ordersAnalyzed: (orders as any[]).length,
            workcentersAvailable: (workcenters as any[]).length,
        },
    };
}

registerAgent('manufacturing-scheduler', manufacturingScheduler);
