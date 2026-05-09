/**
 * Partner Deduplication Agent
 *
 * Detects likely duplicate Partner records by comparing name similarity,
 * email, phone, and VAT. Returns a ranked list of suspected duplicates
 * for human review — never merges or deletes automatically.
 *
 * Hard rule: agent is read-only. Output is PENDING until a human confirms.
 */

import { anthropic, AI_MODEL_FAST, registerAgent, AgentInput, AgentOutput } from '../index';
import prisma from '../../../lib/prisma';

async function partnerDedup(input: AgentInput): Promise<AgentOutput> {
    const orgId = String(input.orgId ?? '');
    const targetPartnerId = input.entityId ? String(input.entityId) : null;

    // Fetch partners for comparison (org-scoped)
    const partners = await prisma.partner.findMany({
        where: {
            active: true,
            ...(orgId ? { organizationId: orgId } : {}),
        },
        select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            vat: true,
            isCompany: true,
            city: true,
            country: true,
        },
        take: 500,
    });

    if (partners.length < 2) {
        return {
            confidence: 1.0,
            summary: 'Fewer than 2 partners found — no duplicates possible.',
            suggestions: [],
            metadata: { totalPartners: partners.length },
        };
    }

    const target = targetPartnerId
        ? partners.find(p => p.id === targetPartnerId)
        : null;

    const context = target
        ? `Focus on finding duplicates for this partner:\n${JSON.stringify(target, null, 2)}\n\nAll partners (sample):\n`
        : `Scan all partners for duplicates:\n`;

    const sample = partners
        .slice(0, 80)
        .map(p => `id=${p.id} | "${p.name}" | email=${p.email ?? '-'} | phone=${p.phone ?? '-'} | vat=${p.vat ?? '-'} | ${p.city ?? ''} ${p.country ?? ''}`)
        .join('\n');

    const prompt = `You are a data quality agent for an ERP system.

${context}${sample}

Task: Identify partner records that are likely duplicates of each other.
Look for: same or very similar name, same email, same phone, same VAT number.

Respond in JSON with this schema:
{
  "suspectedDuplicateGroups": [
    {
      "partnerIds": ["id1", "id2"],
      "partnerNames": ["Name A", "Name B"],
      "reason": "why these are suspected duplicates",
      "confidence": 0.0-1.0,
      "recommendedKeepId": "id of the record that should be kept (most complete)"
    }
  ],
  "summary": "summary of findings"
}

Only include groups with confidence ≥ 0.70. Return empty array if none found.`;

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
        parsed = { suspectedDuplicateGroups: [], summary: 'Parsing failed' };
    }

    const groups: any[] = parsed.suspectedDuplicateGroups ?? [];
    const avgConfidence = groups.length > 0
        ? groups.reduce((sum: number, g: any) => sum + (g.confidence ?? 0.7), 0) / groups.length
        : 0.9;

    return {
        confidence: avgConfidence,
        summary: parsed.summary ?? `Found ${groups.length} suspected duplicate group(s).`,
        suggestions: groups.map((g: any) => ({
            field: 'duplicate_group',
            suggestedValue: {
                partnerIds: g.partnerIds,
                partnerNames: g.partnerNames,
                recommendedKeepId: g.recommendedKeepId,
            },
            reasoning: g.reason ?? '',
            isSensitive: true,
        })),
        metadata: {
            totalPartnersScanned: Math.min(partners.length, 80),
            duplicateGroupsFound: groups.length,
        },
    };
}

registerAgent('partner-dedup', partnerDedup);
