/**
 * Recruitment Candidate Ranker Agent
 *
 * Given a job description and a list of applicant summaries, ranks candidates
 * and provides a shortlist recommendation.
 *
 * Outputs go into AiAction.status = PENDING. Agent NEVER moves applicants.
 */

import { anthropic, AI_MODEL, registerAgent, AgentInput, AgentOutput } from '../index';

async function recruitmentRanker(input: AgentInput): Promise<AgentOutput> {
    const jobTitle = String(input.jobTitle ?? 'Position');
    const jobDescription = String(input.jobDescription ?? '');
    const candidates = Array.isArray(input.candidates)
        ? JSON.stringify(input.candidates)
        : String(input.candidates ?? '[]');

    const response = await anthropic.messages.create({
        model: AI_MODEL,
        max_tokens: 1024,
        system: `You are an expert recruitment consultant ranking job applicants.
Respond ONLY with valid JSON:
{
  "confidence": <0.0-1.0>,
  "shortlist": [
    {
      "candidateId": "<id>",
      "rank": <1-based number>,
      "fitScore": <0.0-1.0>,
      "strengths": ["<s1>"],
      "concerns": ["<c1>"],
      "recommendation": "<invite_for_interview|hold|decline>"
    }
  ],
  "summary": "<overall assessment in 2 sentences>",
  "reasoning": "<one sentence>"
}`,
        messages: [{
            role: 'user',
            content: `Job: ${jobTitle}\nDescription: ${jobDescription || '(not provided)'}\nCandidates: ${candidates}`,
        }],
    });

    let parsed: any;
    try {
        const text = response.content[0].type === 'text' ? response.content[0].text : '';
        parsed = JSON.parse(text);
    } catch {
        return { confidence: 0, summary: 'Candidate ranking failed: could not parse model response', suggestions: [] };
    }

    const shortlist = Array.isArray(parsed.shortlist) ? parsed.shortlist : [];

    return {
        confidence: Number(parsed.confidence ?? 0.65),
        summary: parsed.summary ?? `Ranked ${shortlist.length} candidates for ${jobTitle}`,
        suggestions: shortlist.map((c: any) => ({
            field: `candidate_${c.candidateId}`,
            suggestedValue: {
                rank: c.rank,
                fitScore: c.fitScore,
                recommendation: c.recommendation,
                strengths: c.strengths,
                concerns: c.concerns,
            },
            reasoning: `Rank ${c.rank}: fit score ${c.fitScore}`,
            isSensitive: true,
        })),
        metadata: { shortlistCount: shortlist.length, topCandidate: shortlist[0]?.candidateId },
    };
}

registerAgent('recruitment-ranker', recruitmentRanker);
export default recruitmentRanker;
