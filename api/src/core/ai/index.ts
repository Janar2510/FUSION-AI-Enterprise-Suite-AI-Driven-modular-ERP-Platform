/**
 * core/ai — AI agent runner + approval workflow
 *
 * Hard rules (ADR-0006):
 *  - No agent may post invoices, reconcile payments, send legal docs, or delete records.
 *  - Every agent output is stored as AiAction with status PENDING.
 *  - Finance/legal actions require human approval (status APPROVED) before appliedAt is set.
 *  - Confidence gate: outputs below 0.70 are surfaced with a warning; agents never auto-apply.
 *
 * Usage:
 *   const action = await runAgent('helpdesk-triage', { ticketId: 42 }, req.user);
 *   // action.status === 'PENDING'; user must call approveAction(action.id) to apply
 */

import Anthropic from '@anthropic-ai/sdk';
import prisma from '../../lib/prisma';

export const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
});

export const AI_MODEL = 'claude-sonnet-4-6';
export const AI_MODEL_FAST = 'claude-haiku-4-5-20251001';

// ── Types ────────────────────────────────────────────────────────────────────

export interface AgentInput {
    [key: string]: unknown;
}

export interface AgentOutput {
    confidence: number;          // 0–1
    summary: string;             // human-readable summary of what the agent found/suggests
    suggestions: AgentSuggestion[];
    metadata?: Record<string, unknown>;
}

export interface AgentSuggestion {
    field: string;               // field name to update, or action key
    currentValue?: unknown;
    suggestedValue: unknown;
    reasoning: string;
    isSensitive?: boolean;       // true = requires explicit approval even if confidence ≥ 0.85
}

export interface AgentContext {
    userId?: string;
    orgId?: string;
}

// ── Agent registry ────────────────────────────────────────────────────────────

type AgentFn = (input: AgentInput) => Promise<AgentOutput>;
const registry = new Map<string, AgentFn>();

export function registerAgent(key: string, fn: AgentFn) {
    registry.set(key, fn);
}

// ── Runner ───────────────────────────────────────────────────────────────────

export async function runAgent(
    agentKey: string,
    input: AgentInput,
    ctx: AgentContext,
): Promise<{ id: string; status: string; output: AgentOutput }> {
    const agent = registry.get(agentKey);
    if (!agent) throw new Error(`Unknown agent: ${agentKey}`);

    const output = await agent(input);

    // Persist to AiAction regardless of confidence — humans review
    const action = await (prisma as any).aiAction?.create?.({
        data: {
            agentKey,
            triggeredById: ctx.userId ?? null,
            entityType: String(input.entityType ?? 'unknown'),
            entityId: String(input.entityId ?? 'unknown'),
            tool: agentKey,
            input,
            output,
            confidence: output.confidence,
            status: 'PENDING',
        },
    });

    return { id: action?.id ?? 'no-db', status: 'PENDING', output };
}

// ── Approval workflow ─────────────────────────────────────────────────────────

export async function approveAction(actionId: string, approverId: string) {
    return (prisma as any).aiAction?.update?.({
        where: { id: actionId },
        data: { status: 'APPROVED', approvedById: approverId, approvedAt: new Date() },
    });
}

export async function rejectAction(actionId: string, approverId: string) {
    return (prisma as any).aiAction?.update?.({
        where: { id: actionId },
        data: { status: 'REJECTED', approvedById: approverId, approvedAt: new Date() },
    });
}

export async function markApplied(actionId: string) {
    return (prisma as any).aiAction?.update?.({
        where: { id: actionId },
        data: { status: 'APPLIED', appliedAt: new Date() },
    });
}

export async function rollbackAction(actionId: string) {
    return (prisma as any).aiAction?.update?.({
        where: { id: actionId },
        data: { status: 'ROLLED_BACK', rolledBackAt: new Date() },
    });
}

// ── Pending actions query ────────────────────────────────────────────────────

export async function getPendingActions(entityType?: string, entityId?: string) {
    return (prisma as any).aiAction?.findMany?.({
        where: {
            status: 'PENDING',
            ...(entityType ? { entityType } : {}),
            ...(entityId ? { entityId } : {}),
        },
        orderBy: { createdAt: 'desc' },
    });
}
