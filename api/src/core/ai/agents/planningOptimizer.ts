/**
 * Planning Optimizer Agent
 *
 * Given shift assignments, employee skills, and demand forecast, suggests
 * optimal shift coverage adjustments to reduce overtime and avoid under-staffing.
 *
 * Outputs go into AiAction.status = PENDING. Planners must approve changes.
 */

import { anthropic, AI_MODEL_FAST, registerAgent, AgentInput, AgentOutput } from '../index';

async function planningOptimizer(input: AgentInput): Promise<AgentOutput> {
    const weekStart = String(input.weekStart ?? 'current week');
    const currentShifts = Array.isArray(input.shifts)
        ? JSON.stringify(input.shifts.slice(0, 20))
        : String(input.shifts ?? '[]');
    const demandForecast = Array.isArray(input.demandForecast)
        ? JSON.stringify(input.demandForecast)
        : String(input.demandForecast ?? '[]');
    const constraints = String(input.constraints ?? 'standard 8-hour shifts, 40-hour work week limit');

    const response = await anthropic.messages.create({
        model: AI_MODEL_FAST,
        max_tokens: 896,
        system: `You are a workforce planning optimizer for a business scheduling system.
Analyze shifts and demand, then respond ONLY with valid JSON:
{
  "confidence": <0.0-1.0>,
  "coverageScore": <0.0-1.0>,
  "issues": ["<issue 1>", "<issue 2>"],
  "suggestions": [
    {
      "type": "<add_shift|remove_shift|swap_employee|adjust_hours>",
      "shiftDate": "<YYYY-MM-DD>",
      "description": "<what to change>",
      "reason": "<why>"
    }
  ],
  "summary": "<2 sentence analysis>",
  "reasoning": "<one sentence>"
}`,
        messages: [{
            role: 'user',
            content: `Week: ${weekStart}\nConstraints: ${constraints}\nCurrent shifts: ${currentShifts}\nDemand forecast: ${demandForecast || '(none provided)'}`,
        }],
    });

    let parsed: any;
    try {
        const text = response.content[0].type === 'text' ? response.content[0].text : '';
        parsed = JSON.parse(text);
    } catch {
        return { confidence: 0, summary: 'Planning optimization failed: could not parse model response', suggestions: [] };
    }

    const rawSuggestions = Array.isArray(parsed.suggestions) ? parsed.suggestions : [];

    return {
        confidence: Number(parsed.confidence ?? 0.65),
        summary: `Coverage score: ${Math.round((parsed.coverageScore ?? 0) * 100)}%. ${parsed.summary}`,
        suggestions: rawSuggestions.map((s: any, i: number) => ({
            field: `shift_adjustment_${i + 1}`,
            suggestedValue: { type: s.type, shiftDate: s.shiftDate, description: s.description },
            reasoning: s.reason,
        })),
        metadata: {
            coverageScore: parsed.coverageScore,
            issueCount: (parsed.issues ?? []).length,
            issues: parsed.issues ?? [],
        },
    };
}

registerAgent('planning-optimizer', planningOptimizer);
export default planningOptimizer;
