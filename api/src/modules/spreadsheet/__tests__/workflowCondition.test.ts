import { FormulaService } from '../formulaService';
import {
    evaluateStructuredCondition,
    isCronOnlyConditionSpec,
    looksLikeStructuredConditionSpec,
} from '../workflowCondition';

describe('workflowCondition primitives', () => {
    test('isCronOnlyConditionSpec', () => {
        expect(isCronOnlyConditionSpec({ cron: '0 * * * *' })).toBe(true);
        expect(isCronOnlyConditionSpec({ schedule: '0 * * * *' })).toBe(true);
        expect(isCronOnlyConditionSpec({ cron: 'x', foo: 'y' })).toBe(false);
        expect(isCronOnlyConditionSpec({ field: 'a' })).toBe(false);
    });

    test('looksLikeStructuredConditionSpec', () => {
        expect(looksLikeStructuredConditionSpec({ all: [] })).toBe(true);
        expect(looksLikeStructuredConditionSpec({ field: 'status' })).toBe(true);
        expect(looksLikeStructuredConditionSpec({ changed: true, field: 'x' })).toBe(true);
        expect(looksLikeStructuredConditionSpec({ foo: 1 })).toBe(false);
    });

    test('evaluateStructuredCondition — eq / changed', () => {
        const ctx = { status: 'done', __previous: { status: 'open' } } as Record<string, unknown>;
        expect(
            evaluateStructuredCondition({ field: 'status', eq: 'done' }, ctx, 'ON_UPDATE'),
        ).toBe(true);
        expect(
            evaluateStructuredCondition({ field: 'status', eq: 'open' }, ctx, 'ON_UPDATE'),
        ).toBe(false);

        expect(
            evaluateStructuredCondition(
                { field: 'status', changed: true },
                ctx,
                'ON_CREATE',
            ),
        ).toBe(false);
        expect(
            evaluateStructuredCondition(
                { field: 'status', changed: true },
                ctx,
                'ON_UPDATE',
            ),
        ).toBe(true);
        expect(
            evaluateStructuredCondition(
                { field: 'note', changed: true },
                { note: 'a', __previous: { note: 'a' } },
                'ON_UPDATE',
            ),
        ).toBe(false);
    });

    test('evaluateStructuredCondition — all / any / not', () => {
        const ctx = { phase: 2 } as Record<string, unknown>;
        expect(
            evaluateStructuredCondition({ all: [{ field: 'phase', gt: 1 }, { field: 'phase', lt: 10 }] }, ctx, 'ON_UPDATE'),
        ).toBe(true);
        expect(
            evaluateStructuredCondition({ any: [{ field: 'phase', eq: 99 }, { field: 'phase', eq: 2 }] }, ctx, 'ON_UPDATE'),
        ).toBe(true);
        expect(
            evaluateStructuredCondition({ not: { field: 'phase', eq: 2 } }, ctx, 'ON_UPDATE'),
        ).toBe(false);
    });
});

describe('FormulaService.evaluateWorkflowCondition', () => {
    test('JSON structured path', async () => {
        const ctx = { x: 1 } as Record<string, unknown>;
        await expect(
            FormulaService.evaluateWorkflowCondition(
                '{"all":[{"field":"x","eq":1}]}',
                ctx,
                'ON_CREATE',
            ),
        ).resolves.toBe(true);
    });

    test('cron-only JSON rejects document triggers', async () => {
        await expect(
            FormulaService.evaluateWorkflowCondition(
                '{"cron":"0 * * * *"}',
                { id: '1' },
                'ON_UPDATE',
            ),
        ).resolves.toBe(false);
    });

    test('cron-only JSON supplementary gate passes', async () => {
        await expect(
            FormulaService.evaluateWorkflowCondition(
                '{"cron":"0 * * * *"}',
                {},
                'ON_CREATE',
                { supplementaryCronGate: true },
            ),
        ).resolves.toBe(true);
    });

    test('falls back to legacy snippet', async () => {
        await expect(
            FormulaService.evaluateWorkflowCondition(
                'status === "done"',
                { status: 'done' } as Record<string, unknown>,
                'ON_CREATE',
            ),
        ).resolves.toBe(true);
    });
});
