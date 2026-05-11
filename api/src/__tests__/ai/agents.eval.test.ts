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

import { getAgent } from '../../core/ai/index';

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
    const makeText = (text: string) => ({
        messages: {
            create: jest.fn().mockResolvedValue({
                content: [{ type: 'text', text }],
            }),
        },
    });
    return { default: makeText };
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
        },
        resPartner: {
            findUnique: jest.fn().mockResolvedValue({ id: 1, name: 'ACME Corp' }),
        },
        purchaseOrder: {
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
        const sdk = require('@anthropic-ai/sdk').default;
        sdk.messages.create.mockResolvedValueOnce({
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
                outline: ['Introduction', 'Setup', 'Usage'],
                draft: '# How to use FusionAI\n\nIntroduction...',
                tags: ['erp', 'guide'],
            });
            const agent = getAgent('knowledge-article-draft')!;
            const output = await agent({ userId: 1, orgId: 1, context: { topic: 'FusionAI getting started' } });
            assertValidOutput(output);
            expect(output.metadata).toBeDefined();
            expect(output.metadata?.draft).toBeTruthy();
        });

        it('uses context.articleId to fetch existing article for improvement', async () => {
            const prismaMock = require('../../lib/prisma').default;
            prismaMock.knowledgeArticle.findMany.mockResolvedValueOnce([
                { id: 1, name: 'Old Article', body: 'Old content.' },
            ]);
            mockClaudeReply({
                title: 'Improved Article',
                summary: 'Improved version.',
                outline: [],
                draft: '# Improved\n\nNew content.',
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
                overallRating: 4.2,
                summary: 'Employee is performing well.',
                strengths: ['punctuality', 'output quality'],
                areasForImprovement: ['communication'],
                recommendations: ['schedule 1-on-1 coaching'],
            });
            const agent = getAgent('analyze_performance')!;
            const output = await agent({ userId: 1, orgId: 1, context: { employeeId: 1 } });
            assertValidOutput(output);
            expect(output.metadata?.overallRating).toBeDefined();
        });
    });

    // ── predict_churn ─────────────────────────────────────────────────────────
    describe('predict_churn', () => {
        it('returns churn risk analysis', async () => {
            require('../../core/ai/agents/predictChurn');
            mockClaudeReply({
                overallChurnRisk: 'medium',
                riskScore: 45,
                summary: 'Moderate churn risk detected.',
                riskFactors: ['declining usage'],
                retentionActions: ['send discount offer'],
                highRiskSubscriptions: [],
            });
            const agent = getAgent('predict_churn')!;
            const output = await agent({ userId: 1, orgId: 1, context: { partnerId: 1 } });
            assertValidOutput(output);
            expect(output.metadata?.riskScore).toBeDefined();
        });

        it('confidence is low when no subscriptions data', async () => {
            mockClaudeReply({
                overallChurnRisk: 'low',
                riskScore: 10,
                summary: 'No subscriptions found.',
                riskFactors: [],
                retentionActions: [],
                highRiskSubscriptions: [],
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
