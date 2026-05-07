/**
 * Helpdesk Triage Agent
 *
 * Given a ticket name + description, classifies:
 *  - category (bug / billing / feature-request / access / other)
 *  - priority (0 = normal, 1 = high, 2 = urgent)
 *  - suggested first reply
 *
 * Outputs go into AiAction.status = PENDING.
 * Agent NEVER updates the ticket directly.
 */

import { anthropic, AI_MODEL_FAST, registerAgent, AgentInput, AgentOutput } from '../index';

async function helpdeskTriage(input: AgentInput): Promise<AgentOutput> {
    const name = String(input.name ?? '');
    const description = String(input.description ?? '');

    const response = await anthropic.messages.create({
        model: AI_MODEL_FAST,
        max_tokens: 512,
        system: `You are a helpdesk triage assistant for a B2B ERP platform.
Analyze the support ticket and respond with ONLY valid JSON in this exact shape:
{
  "category": "<bug|billing|feature-request|access|other>",
  "priority": <0|1|2>,
  "confidence": <0.0-1.0>,
  "reasoning": "<one sentence>",
  "suggestedReply": "<short first-contact reply, max 3 sentences>"
}`,
        messages: [
            {
                role: 'user',
                content: `Ticket subject: ${name}\n\nDescription: ${description || '(no description provided)'}`,
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
            summary: 'Triage failed: could not parse model response',
            suggestions: [],
        };
    }

    return {
        confidence: Number(parsed.confidence ?? 0.5),
        summary: `Category: ${parsed.category}, Priority: ${parsed.priority}. ${parsed.reasoning}`,
        suggestions: [
            {
                field: 'category',
                suggestedValue: parsed.category,
                reasoning: parsed.reasoning,
            },
            {
                field: 'priority',
                suggestedValue: parsed.priority,
                reasoning: parsed.reasoning,
            },
            {
                field: 'suggestedReply',
                suggestedValue: parsed.suggestedReply,
                reasoning: 'AI-generated first-contact reply. Review before sending.',
            },
        ],
        metadata: { rawCategory: parsed.category, rawPriority: parsed.priority },
    };
}

registerAgent('helpdesk-triage', helpdeskTriage);
export default helpdeskTriage;
