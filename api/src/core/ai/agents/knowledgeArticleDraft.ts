/**
 * Knowledge Article Draft Generation Agent (agentKey: 'knowledge-article-draft')
 *
 * Given a topic/title, generates a structured article draft using Claude.
 * Output goes to AiAction PENDING — knowledge manager must review before publishing.
 */

import { anthropic, AI_MODEL_FAST, registerAgent, AgentInput, AgentOutput } from '../index';
import prisma from '../../../lib/prisma';

async function knowledgeArticleDraft(input: AgentInput): Promise<AgentOutput> {
    const title = String(input.title ?? input.topic ?? '');
    const category = String(input.category ?? 'General');
    const context = String(input.context ?? '');

    // Fetch recent articles in the same category for context/style consistency
    const relatedArticles = await (prisma as any).knowledgeArticle?.findMany?.({
        where: { ...(category !== 'General' ? { category } : {}), isPublished: true },
        select: { title: true, body: true },
        orderBy: { updatedAt: 'desc' },
        take: 3,
    }) ?? [];

    const relatedContext = (relatedArticles as any[]).length
        ? `\nRelated articles for style reference:\n${(relatedArticles as any[]).map((a: any) =>
              `- "${a.title}": ${String(a.body ?? '').slice(0, 300)}...`
          ).join('\n')}`
        : '';

    const prompt = `You are a technical documentation writer for an enterprise ERP system.

Task: Write a comprehensive knowledge base article draft.
Title: "${title}"
Category: ${category}
${context ? `Additional context: ${context}` : ''}
${relatedContext}

Write a well-structured article with:
1. A brief introduction (2-3 sentences)
2. Step-by-step instructions or explanation (use numbered lists where appropriate)
3. Common issues / FAQ (2-3 items)
4. A brief summary

Format the response as JSON:
{
  "title": "<article title>",
  "body": "<full markdown body>",
  "summary": "<one-line summary for the article list>",
  "tags": ["<tag1>", "<tag2>"]
}`;

    const msg = await anthropic.messages.create({
        model: AI_MODEL_FAST,
        max_tokens: 2048,
        messages: [{ role: 'user', content: prompt }],
    });

    const raw = (msg.content[0] as any).text ?? '{}';
    let parsed: any = {};
    try {
        const match = raw.match(/\{[\s\S]*\}/);
        parsed = match ? JSON.parse(match[0]) : {};
    } catch {
        parsed = { title, body: raw, summary: raw.slice(0, 100), tags: [] };
    }

    return {
        confidence: title ? 0.85 : 0.50,
        summary: `Article draft generated: "${parsed.title ?? title}"`,
        suggestions: [
            {
                field: 'title',
                currentValue: title,
                suggestedValue: parsed.title ?? title,
                reasoning: 'AI-generated article title',
            },
            {
                field: 'body',
                currentValue: '',
                suggestedValue: parsed.body ?? '',
                reasoning: 'AI-generated article body in Markdown',
                isSensitive: false,
            },
        ],
        metadata: {
            tags: parsed.tags ?? [],
            summary: parsed.summary ?? '',
            category,
        },
    };
}

registerAgent('knowledge-article-draft', knowledgeArticleDraft);
