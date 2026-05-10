/**
 * Appraisal Coach Agent
 *
 * Given an employee's review cycle data (goals, ratings, manager comments),
 * produces:
 *  - An objective performance summary
 *  - Skill gap analysis
 *  - Development plan suggestions
 *
 * Outputs go into AiAction.status = PENDING. Agent NEVER updates HR records.
 */

import { anthropic, AI_MODEL, registerAgent, AgentInput, AgentOutput } from '../index';

async function appraisalCoach(input: AgentInput): Promise<AgentOutput> {
    const employeeName = String(input.employeeName ?? 'Employee');
    const goals = Array.isArray(input.goals) ? JSON.stringify(input.goals) : String(input.goals ?? '[]');
    const ratings = Array.isArray(input.ratings) ? JSON.stringify(input.ratings) : String(input.ratings ?? '[]');
    const managerComments = String(input.managerComments ?? '');
    const period = String(input.period ?? 'current review period');

    const response = await anthropic.messages.create({
        model: AI_MODEL,
        max_tokens: 1024,
        system: `You are an expert HR performance coach analyzing an employee appraisal.
Respond ONLY with valid JSON in this exact shape:
{
  "confidence": <0.0-1.0>,
  "overallRating": "<below_expectations|meets_expectations|exceeds_expectations|outstanding>",
  "summary": "<2-3 sentence performance summary>",
  "strengths": ["<strength 1>", "<strength 2>"],
  "developmentAreas": ["<area 1>", "<area 2>"],
  "suggestedGoals": ["<goal 1>", "<goal 2>", "<goal 3>"],
  "reasoning": "<one sentence explanation>"
}`,
        messages: [{
            role: 'user',
            content: `Employee: ${employeeName}\nPeriod: ${period}\nGoals: ${goals}\nRatings: ${ratings}\nManager Comments: ${managerComments || '(none)'}`,
        }],
    });

    let parsed: any;
    try {
        const text = response.content[0].type === 'text' ? response.content[0].text : '';
        parsed = JSON.parse(text);
    } catch {
        return { confidence: 0, summary: 'Appraisal coaching failed: could not parse model response', suggestions: [] };
    }

    return {
        confidence: Number(parsed.confidence ?? 0.6),
        summary: `${employeeName}: ${parsed.overallRating}. ${parsed.summary}`,
        suggestions: [
            { field: 'overallRating', suggestedValue: parsed.overallRating, reasoning: parsed.reasoning },
            { field: 'strengths', suggestedValue: parsed.strengths, reasoning: 'AI-identified top strengths' },
            { field: 'developmentAreas', suggestedValue: parsed.developmentAreas, reasoning: 'AI-identified development areas', isSensitive: true },
            { field: 'suggestedGoals', suggestedValue: parsed.suggestedGoals, reasoning: 'AI-suggested goals for next cycle' },
        ],
        metadata: { overallRating: parsed.overallRating },
    };
}

registerAgent('appraisal-coach', appraisalCoach);
export default appraisalCoach;
