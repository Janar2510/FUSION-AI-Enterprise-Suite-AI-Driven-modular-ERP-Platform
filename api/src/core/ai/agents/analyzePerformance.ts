/**
 * HR Performance Analysis Agent (agentKey: 'analyze_performance')
 *
 * Synthesizes attendance data, appraisal scores, and timesheet trends for an
 * employee and produces a structured performance assessment with actionable
 * suggestions for the manager.
 * Output → AiAction PENDING; manager must approve before sharing.
 */

import { anthropic, AI_MODEL_FAST, registerAgent, AgentInput, AgentOutput } from '../index';
import prisma from '../../../lib/prisma';

async function analyzePerformance(input: AgentInput): Promise<AgentOutput> {
    const employeeId = input.entityId ?? input.employeeId;
    const empIdNum = typeof employeeId === 'number' ? employeeId : parseInt(String(employeeId ?? '0'), 10);

    const [employee, recentAttendance, appraisals] = await Promise.all([
        (prisma as any).hrEmployee?.findUnique?.({
            where: { id: empIdNum },
            include: { department: { select: { name: true } }, jobPosition: { select: { name: true } } },
        }),
        (prisma as any).hrAttendance?.findMany?.({
            where: { employeeId: empIdNum },
            orderBy: { checkIn: 'desc' },
            take: 30,
            select: { checkIn: true, checkOut: true, workedHours: true },
        }) ?? [],
        (prisma as any).hrAppraisal?.findMany?.({
            where: { employeeId: empIdNum },
            orderBy: { dateClose: 'desc' },
            take: 5,
            select: { state: true, rating: true, managerId: true, dateClose: true, note: true },
        }) ?? [],
    ]);

    if (!employee) {
        return { confidence: 0.3, summary: 'Employee not found.', suggestions: [] };
    }

    const name = employee.name ?? 'the employee';
    const jobTitle = employee.jobTitle ?? employee.jobPosition?.name ?? 'Unknown role';
    const dept = employee.department?.name ?? 'Unknown department';

    const totalHours = (recentAttendance as any[]).reduce((s: number, a: any) => s + (a.workedHours ?? 0), 0);
    const avgHoursPerDay = (recentAttendance as any[]).length
        ? (totalHours / (recentAttendance as any[]).length).toFixed(1)
        : 'N/A';

    const appraisalText = (appraisals as any[]).length
        ? (appraisals as any[]).map((a: any) =>
              `- State: ${a.state}, Rating: ${a.rating ?? 'N/A'}, Notes: ${String(a.note ?? '').slice(0, 200)}`
          ).join('\n')
        : 'No appraisals on record.';

    const prompt = `You are an HR performance analytics specialist.

Employee: ${name} | Role: ${jobTitle} | Dept: ${dept}

Attendance summary (last 30 records):
- Total hours worked: ${totalHours.toFixed(1)}h
- Average hours per day: ${avgHoursPerDay}h

Recent appraisals:
${appraisalText}

Task: Provide a comprehensive performance analysis including:
1. Overall performance assessment (1-2 sentences)
2. Key strengths identified from the data
3. Areas for improvement with specific, actionable suggestions
4. Recommended management actions (e.g., recognition, coaching, PIP)

Respond in JSON:
{
  "overallAssessment": "<string>",
  "performanceScore": <0.0 to 1.0>,
  "strengths": ["<strength1>", "<strength2>"],
  "improvementAreas": [{ "area": "<area>", "suggestion": "<action>" }],
  "managementActions": ["<action1>", "<action2>"]
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
        parsed = { overallAssessment: raw.slice(0, 200), performanceScore: 0.5, strengths: [], improvementAreas: [], managementActions: [] };
    }

    const score = typeof parsed.performanceScore === 'number'
        ? Math.max(0, Math.min(1, parsed.performanceScore))
        : 0.5;

    return {
        confidence: (recentAttendance as any[]).length > 0 || (appraisals as any[]).length > 0 ? 0.78 : 0.45,
        summary: parsed.overallAssessment ?? `Performance analysis for ${name}`,
        suggestions: [
            ...((parsed.improvementAreas ?? []).map((area: any, idx: number) => ({
                field: `improvement_${idx + 1}`,
                suggestedValue: { area: area.area, action: area.suggestion },
                reasoning: area.suggestion ?? '',
            }))),
            ...((parsed.managementActions ?? []).map((action: string, idx: number) => ({
                field: `management_action_${idx + 1}`,
                suggestedValue: action,
                reasoning: 'Recommended management action based on performance data',
                isSensitive: true,
            }))),
        ],
        metadata: {
            employeeId,
            employeeName: name,
            performanceScore: score,
            strengths: parsed.strengths ?? [],
            totalHoursAnalyzed: totalHours,
            appraisalsAnalyzed: (appraisals as any[]).length,
        },
    };
}

registerAgent('analyze_performance', analyzePerformance);
