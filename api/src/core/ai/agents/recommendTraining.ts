/**
 * HR Training Recommendation Agent (agentKey: 'recommend_training')
 *
 * Analyzes an employee's role, performance notes, and skills to recommend
 * relevant training courses or development actions.
 * Output → AiAction PENDING; HR manager approves before sharing with employee.
 */

import { anthropic, AI_MODEL_FAST, registerAgent, AgentInput, AgentOutput } from '../index';
import prisma from '../../../lib/prisma';

async function recommendTraining(input: AgentInput): Promise<AgentOutput> {
    const employeeId = input.entityId ?? input.employeeId;

    const employee = await (prisma as any).hrEmployee?.findUnique?.({
        where: { id: typeof employeeId === 'number' ? employeeId : parseInt(String(employeeId ?? '0'), 10) },
        include: {
            department: { select: { name: true } },
            jobPosition: { select: { name: true } },
        },
    });

    if (!employee) {
        return {
            confidence: 0.3,
            summary: 'Employee not found — cannot generate training recommendations.',
            suggestions: [],
        };
    }

    const name = employee.name ?? 'the employee';
    const jobTitle = employee.jobTitle ?? employee.jobPosition?.name ?? 'Unknown role';
    const dept = employee.department?.name ?? 'Unknown department';
    const notes = String(input.performanceNotes ?? '');

    const prompt = `You are an HR learning & development specialist.

Employee profile:
- Name: ${name}
- Job title: ${jobTitle}
- Department: ${dept}
${notes ? `- Performance notes: ${notes}` : ''}

Task: Recommend 3-5 training courses or development actions tailored to this employee's role and any noted gaps.

For each recommendation provide:
1. Course/action name
2. Learning objective (1 sentence)
3. Priority (high/medium/low)
4. Suggested delivery format (e-learning, workshop, mentoring, etc.)

Respond in JSON:
{
  "summary": "<brief overall recommendation summary>",
  "recommendations": [
    { "name": "<course name>", "objective": "<one-line objective>", "priority": "high|medium|low", "format": "<delivery format>", "reasoning": "<why this course>" }
  ]
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
        parsed = { summary: raw.slice(0, 200), recommendations: [] };
    }

    return {
        confidence: 0.80,
        summary: parsed.summary ?? `Training recommendations for ${name}`,
        suggestions: (parsed.recommendations ?? []).map((r: any, idx: number) => ({
            field: `training_recommendation_${idx + 1}`,
            suggestedValue: {
                name: r.name,
                objective: r.objective,
                priority: r.priority,
                format: r.format,
            },
            reasoning: r.reasoning ?? '',
        })),
        metadata: {
            employeeId,
            employeeName: name,
            department: dept,
            jobTitle,
        },
    };
}

registerAgent('recommend_training', recommendTraining);
