/**
 * Quote Drafter Agent
 *
 * Given a sale order ID (in DRAFT state), generates a professional
 * quotation body (email text + line item summary) for the sales rep
 * to review and send. The agent never changes the sale order state
 * or sends any email — output is PENDING for human review.
 *
 * Hard rule: agent only reads; it never calls /confirm, /send, or any
 * mutating endpoint.
 */

import { anthropic, AI_MODEL, registerAgent, AgentInput, AgentOutput } from '../index';
import prisma from '../../../lib/prisma';

async function quoteDrafter(input: AgentInput): Promise<AgentOutput> {
    const orderId = Number(input.entityId ?? input.orderId ?? 0);

    if (!orderId) {
        return {
            confidence: 0.0,
            summary: 'No orderId provided.',
            suggestions: [],
        };
    }

    const order = await prisma.saleOrder.findUnique({
        where: { id: orderId },
        include: {
            partner: { select: { name: true, email: true, city: true, country: true } },
            lines: {
                include: {
                    product: { select: { name: true, description: true } },
                },
            },
        },
    });

    if (!order) {
        return {
            confidence: 0.0,
            summary: `Sale order ${orderId} not found.`,
            suggestions: [],
        };
    }

    if (order.state !== 'draft' && order.state !== 'sent') {
        return {
            confidence: 0.0,
            summary: `Quote drafter only works on DRAFT or SENT orders. Current state: ${order.state}.`,
            suggestions: [],
            metadata: { state: order.state },
        };
    }

    const linesSummary = order.lines.map((l, i) =>
        `${i + 1}. ${l.product?.name ?? 'Item'} — qty: ${l.productQty}, unit price: ${l.priceUnit}, subtotal: ${l.priceSubtotal}`
    ).join('\n');

    const prompt = `You are a professional sales writer for a B2B ERP company.

Draft a personalized quotation email for this sale order.

Customer: ${order.partner?.name ?? 'Valued Customer'} (${order.partner?.email ?? 'N/A'})
Location: ${order.partner?.city ?? ''} ${order.partner?.country ?? ''}
Order reference: ${order.name}
Order date: ${order.dateOrder?.toISOString().split('T')[0] ?? 'today'}
Validity: ${order.validityDate ? order.validityDate.toISOString().split('T')[0] : '30 days from today'}
Total: ${order.amountTotal} EUR

Line items:
${linesSummary || 'No line items yet.'}

Write a professional, warm quotation email. Include:
1. Greeting and thank-you for their interest
2. Brief summary of what is quoted and its value
3. Line item table (Markdown format)
4. Next steps (accept by clicking a link, or contact the sales rep)
5. Professional closing

Respond in JSON:
{
  "subject": "Email subject line",
  "emailBody": "Full email body in Markdown",
  "keySellingPoints": ["point1", "point2"],
  "expiryNote": "Note about quote validity",
  "confidence": 0.0-1.0,
  "summary": "One sentence describing what was drafted"
}`;

    const msg = await anthropic.messages.create({
        model: AI_MODEL,
        max_tokens: 1500,
        messages: [{ role: 'user', content: prompt }],
    });

    const raw = (msg.content[0] as any).text ?? '{}';
    let parsed: any = {};
    try {
        const match = raw.match(/\{[\s\S]*\}/);
        parsed = match ? JSON.parse(match[0]) : {};
    } catch {
        parsed = { confidence: 0.5, summary: 'Draft generated', emailBody: raw, subject: `Quotation ${order.name}` };
    }

    return {
        confidence: parsed.confidence ?? 0.85,
        summary: parsed.summary ?? `Draft quotation for ${order.name} ready for review.`,
        suggestions: [
            {
                field: 'emailSubject',
                suggestedValue: parsed.subject ?? `Quotation ${order.name}`,
                reasoning: 'Generated email subject',
                isSensitive: false,
            },
            {
                field: 'emailBody',
                suggestedValue: parsed.emailBody ?? '',
                reasoning: 'Full draft quotation email — review and send manually',
                isSensitive: false,
            },
        ],
        metadata: {
            orderId,
            orderName: order.name,
            partnerName: order.partner?.name,
            partnerEmail: order.partner?.email,
            keySellingPoints: parsed.keySellingPoints ?? [],
            expiryNote: parsed.expiryNote ?? '',
            lineCount: order.lines.length,
        },
    };
}

registerAgent('quote-drafter', quoteDrafter);
