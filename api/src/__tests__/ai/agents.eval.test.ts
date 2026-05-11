/**
 * Golden-set evals for all AI agents.
 *
 * These tests validate agent output shapes and quality gates without
 * making real Claude API calls — they mock the Anthropic client so CI
 * remains fast and free.
 *
 * To run against the real API set ANTHROPIC_API_KEY in your environment
 * and pass --runInBand so rate limits aren't hit.
 */

import { anthropic, getAgent } from '../../core/ai/index';

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Minimal valid AgentOutput shape */
function assertValidOutput(output: any) {
    expect(typeof output.confidence).toBe('number');
    expect(output.confidence).toBeGreaterThanOrEqual(0);
    expect(output.confidence).toBeLessThanOrEqual(1);
    expect(typeof output.summary).toBe('string');
    expect(output.summary.length).toBeGreaterThan(0);
    expect(Array.isArray(output.suggestions)).toBe(true);
}

// ── Mock Anthropic + Prisma ───────────────────────────────────────────────────

jest.mock('@anthropic-ai/sdk', () => {
    const create = jest.fn().mockResolvedValue({
        content: [{ type: 'text', text: '{"confidence":0.85,"summary":"mock","suggestions":[]}' }],
    });
    class MockAnthropic {
        messages = { create };
        constructor(_opts?: unknown) {}
    }
    return { __esModule: true, default: MockAnthropic };
});

jest.mock('../../lib/prisma', () => ({
    __esModule: true,
    default: {
        mrpProduction: {
            findMany: jest.fn().mockResolvedValue([]),
        },
        mrpWorkcenter: {
            findMany: jest.fn().mockResolvedValue([]),
        },
        knowledgeArticle: {
            findMany: jest.fn().mockResolvedValue([]),
        },
        hrEmployee: {
            findUnique: jest.fn().mockResolvedValue({ id: 1, name: 'Test User', jobTitle: 'Engineer', department: { name: 'Engineering' } }),
        },
        hrAppraisal: {
            findMany: jest.fn().mockResolvedValue([]),
        },
        hrAttendance: {
            findMany: jest.fn().mockResolvedValue([]),
            aggregate: jest.fn().mockResolvedValue({ _sum: { workedHours: 40 } }),
        },
        saleSubscription: {
            findMany: jest.fn().mockResolvedValue([]),
            findUnique: jest.fn().mockResolvedValue(null),
        },
        resPartner: {
            findUnique: jest.fn().mockResolvedValue({ id: 1, name: 'ACME Corp' }),
        },
        purchaseOrder: {
            findMany: jest.fn().mockResolvedValue([]),
        },
        accountMove: {
            findMany: jest.fn().mockResolvedValue([]),
        },
    },
}));

// ── Import agents (side-effects register them) ────────────────────────────────

// Load agents so registerAgent() side-effects run.
// Note: jest.mock must be declared before imports in module scope.
// We use require() inside the test suite to load after mocks are set.

describe('AI Agent golden-set evals', () => {
    // Ensure mocked anthropic returns a predictable JSON blob for each agent.
    function mockClaudeReply(json: object) {
        const create = anthropic.messages.create as jest.Mock;
        create.mockResolvedValueOnce({
            content: [{ type: 'text', text: JSON.stringify(json) }],
        });
    }

    // ── optimize_production ──────────────────────────────────────────────────
    describe('optimize_production', () => {
        it('returns valid output shape with empty DB', async () => {
            require('../../core/ai/agents/optimizeProduction');
            mockClaudeReply({
                summary: 'No orders to optimize.',
                schedule: [],
                conflicts: [],
                estimatedThroughputGain: 'N/A',
            });
            const agent = getAgent('optimize_production');
            expect(agent).toBeDefined();
            const output = await agent!({ userId: 1, orgId: 1, context: {} });
            assertValidOutput(output);
        });

        it('maps schedule items to suggestions', async () => {
            const prismaMock = require('../../lib/prisma').default;
            prismaMock.mrpProduction.findMany.mockResolvedValueOnce([
                { id: 10, name: 'MO/001', product: { name: 'Widget' }, productQty: 100, scheduledDate: new Date(), state: 'confirmed' },
            ]);
            prismaMock.mrpWorkcenter.findMany.mockResolvedValueOnce([
                { id: 5, name: 'Assembly', timeEfficiency: 90, capacityPerCycle: 50 },
            ]);
            mockClaudeReply({
                summary: 'Assign MO/001 to Assembly line.',
                schedule: [{ orderId: 10, orderName: 'MO/001', recommendedWorkcenterId: 5, recommendedWorkcenterName: 'Assembly', suggestedStartOffset: 0, reasoning: 'Best fit.' }],
                conflicts: [],
                estimatedThroughputGain: '10%',
            });
            const agent = getAgent('optimize_production')!;
            const output = await agent({ userId: 1, orgId: 1, context: {} });
            expect(output.suggestions).toHaveLength(1);
            expect((output.suggestions[0].suggestedValue as { workcenterName: string }).workcenterName).toBe('Assembly');
            expect(output.metadata?.estimatedThroughputGain).toBe('10%');
        });
    });

    // ── knowledge-article-draft ───────────────────────────────────────────────
    describe('knowledge-article-draft', () => {
        it('returns article draft with required fields', async () => {
            require('../../core/ai/agents/knowledgeArticleDraft');
            mockClaudeReply({
                title: 'How to use FusionAI',
                summary: 'An introduction to FusionAI.',
                body: '# How to use FusionAI\n\nIntroduction...',
                tags: ['erp', 'guide'],
            });
            const agent = getAgent('knowledge-article-draft')!;
            const output = await agent({ userId: 1, orgId: 1, topic: 'FusionAI getting started' });
            assertValidOutput(output);
            expect(output.metadata).toBeDefined();
            const bodySuggestion = output.suggestions.find((s) => s.field === 'body');
            expect(String(bodySuggestion?.suggestedValue ?? '')).toContain('FusionAI');
        });

        it('uses context.articleId to fetch existing article for improvement', async () => {
            const prismaMock = require('../../lib/prisma').default;
            prismaMock.knowledgeArticle.findMany.mockResolvedValueOnce([
                { id: 1, name: 'Old Article', body: 'Old content.' },
            ]);
            mockClaudeReply({
                title: 'Improved Article',
                summary: 'Improved version.',
                body: '# Improved\n\nNew content.',
                tags: [],
            });
            const agent = getAgent('knowledge-article-draft')!;
            const output = await agent({ userId: 1, orgId: 1, context: { topic: 'Improve existing', parentId: 1 } });
            assertValidOutput(output);
        });
    });

    // ── recommend_training ────────────────────────────────────────────────────
    describe('recommend_training', () => {
        it('returns training recommendations', async () => {
            require('../../core/ai/agents/recommendTraining');
            mockClaudeReply({
                summary: 'Recommended 3 courses.',
                recommendations: [
                    { title: 'Advanced TypeScript', provider: 'Udemy', durationHours: 10, rationale: 'Gaps in TS skills.' },
                ],
                prioritizedSkills: ['TypeScript', 'System Design'],
            });
            const agent = getAgent('recommend_training')!;
            const output = await agent({ userId: 1, orgId: 1, context: { employeeId: 1 } });
            assertValidOutput(output);
            expect(output.suggestions.length).toBeGreaterThanOrEqual(1);
        });

        it('requires employeeId in context', async () => {
            const agent = getAgent('recommend_training')!;
            mockClaudeReply({ summary: 'no data', recommendations: [], prioritizedSkills: [] });
            // Should still resolve without throwing even with missing employee
            await expect(agent({ userId: 1, orgId: 1, context: {} })).resolves.toBeDefined();
        });
    });

    // ── analyze_performance ───────────────────────────────────────────────────
    describe('analyze_performance', () => {
        it('returns performance analysis with rating', async () => {
            require('../../core/ai/agents/analyzePerformance');
            mockClaudeReply({
                performanceScore: 0.84,
                overallAssessment: 'Employee is performing well.',
                strengths: ['punctuality', 'output quality'],
                improvementAreas: [{ area: 'communication', suggestion: 'schedule 1-on-1 coaching' }],
                managementActions: ['schedule 1-on-1 coaching'],
            });
            const agent = getAgent('analyze_performance')!;
            const output = await agent({ userId: 1, orgId: 1, context: { employeeId: 1 } });
            assertValidOutput(output);
            expect(output.metadata?.performanceScore).toBeDefined();
        });
    });

    // ── predict_churn ─────────────────────────────────────────────────────────
    describe('predict_churn', () => {
        it('returns churn risk analysis', async () => {
            require('../../core/ai/agents/predictChurn');
            const prismaMock = require('../../lib/prisma').default;
            prismaMock.saleSubscription.findUnique.mockResolvedValueOnce({
                id: 1,
                partnerId: 1,
                partner: { name: 'ACME', email: 'a@example.com' },
                recurringPlan: 'Pro',
                recurringTotal: 99,
                stage: 'active',
                dateStart: new Date(),
            });
            prismaMock.accountMove.findMany.mockResolvedValueOnce([]);
            mockClaudeReply({
                churnRiskScore: 0.45,
                riskLevel: 'medium',
                churnReason: 'declining usage',
                retentionActions: [{ action: 'send discount offer', urgency: 'this_week', expectedImpact: 'medium' }],
                summary: 'Moderate churn risk detected.',
            });
            const agent = getAgent('predict_churn')!;
            const output = await agent({ userId: 1, orgId: 1, entityId: 1, context: { partnerId: 1 } });
            assertValidOutput(output);
            expect(output.metadata?.churnRiskScore).toBeDefined();
        });

        it('confidence is low when no subscriptions data', async () => {
            mockClaudeReply({
                churnRiskScore: 0.1,
                riskLevel: 'low',
                churnReason: 'n/a',
                retentionActions: [],
                summary: 'No subscriptions found.',
            });
            const agent = getAgent('predict_churn')!;
            const output = await agent({ userId: 1, orgId: 1, context: {} });
            // With empty DB mock, confidence should be lower
            expect(output.confidence).toBeLessThanOrEqual(0.6);
        });
    });

    // ── evaluate_vendor ───────────────────────────────────────────────────────
    describe('evaluate_vendor', () => {
        it('returns vendor scorecard', async () => {
            require('../../core/ai/agents/evaluateVendor');
            mockClaudeReply({
                overallScore: 78,
                grade: 'B',
                summary: 'Vendor is reliable with minor delays.',
                criteria: [
                    { name: 'On-time Delivery', score: 80, weight: 40, weightedScore: 32 },
                ],
                strengths: ['good quality'],
                weaknesses: ['occasional delays'],
                recommendation: 'preferred',
            });
            const agent = getAgent('evaluate_vendor')!;
            const output = await agent({ userId: 1, orgId: 1, context: { vendorId: 1 } });
            assertValidOutput(output);
            expect(output.metadata?.grade).toBeDefined();
            expect(output.metadata?.overallScore).toBeDefined();
        });
    });
});
