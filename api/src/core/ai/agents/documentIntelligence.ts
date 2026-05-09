/**
 * Document Intelligence Agent
 *
 * Classifies an uploaded document, extracts key fields, and suggests
 * where it should be filed in the ERP. Confidence gate ≥ 0.85 required
 * before the classification is surfaced as a suggestion.
 *
 * Hard rule: agent never creates or modifies records — output is PENDING
 * until a human applies it.
 */

import { anthropic, AI_MODEL_FAST, registerAgent, AgentInput, AgentOutput } from '../index';

async function documentIntelligence(input: AgentInput): Promise<AgentOutput> {
    const filename = String(input.filename ?? 'unknown.pdf');
    const textContent = String(input.textContent ?? '');
    const mimeType = String(input.mimeType ?? 'application/pdf');

    if (!textContent.trim()) {
        return {
            confidence: 0.0,
            summary: 'No text content provided — OCR extraction required before classification.',
            suggestions: [],
            metadata: { error: 'empty_content' },
        };
    }

    const truncated = textContent.slice(0, 3000);

    const prompt = `You are a document intelligence system for an enterprise ERP.

Analyze the following document and respond in JSON with this exact schema:
{
  "documentType": "invoice | purchase_order | contract | receipt | payslip | bank_statement | report | correspondence | other",
  "confidence": 0.0-1.0,
  "extractedFields": {
    "date": "ISO date or null",
    "amount": "number or null",
    "currency": "3-letter code or null",
    "vendorOrCustomer": "company/person name or null",
    "referenceNumber": "document number/ID or null",
    "description": "brief document purpose"
  },
  "suggestedERP": {
    "module": "accounting | purchases | sales | hr | documents | other",
    "action": "what the operator should do with this document",
    "linkedEntityType": "AccountMove | PurchaseOrder | Partner | HrEmployee | null",
    "reasoning": "why you chose this module"
  },
  "summary": "One sentence describing what this document is"
}

Filename: ${filename}
MIME type: ${mimeType}
Document content (first 3000 chars):
${truncated}`;

    const msg = await anthropic.messages.create({
        model: AI_MODEL_FAST,
        max_tokens: 512,
        messages: [{ role: 'user', content: prompt }],
    });

    const raw = (msg.content[0] as any).text ?? '{}';
    let parsed: any = {};
    try {
        const match = raw.match(/\{[\s\S]*\}/);
        parsed = match ? JSON.parse(match[0]) : {};
    } catch {
        parsed = { confidence: 0.3, summary: 'Classification parsing failed', documentType: 'other' };
    }

    const confidence = typeof parsed.confidence === 'number' ? parsed.confidence : 0.5;

    return {
        confidence,
        summary: parsed.summary ?? `Document classified as ${parsed.documentType ?? 'unknown'}`,
        suggestions: [
            {
                field: 'documentType',
                suggestedValue: parsed.documentType ?? 'other',
                reasoning: parsed.suggestedERP?.reasoning ?? '',
                isSensitive: false,
            },
            {
                field: 'erpModule',
                suggestedValue: parsed.suggestedERP?.module ?? 'documents',
                reasoning: parsed.suggestedERP?.action ?? '',
                isSensitive: false,
            },
        ],
        metadata: {
            extractedFields: parsed.extractedFields ?? {},
            suggestedERP: parsed.suggestedERP ?? {},
            filename,
            belowConfidenceGate: confidence < 0.85,
        },
    };
}

registerAgent('document-intelligence', documentIntelligence);
