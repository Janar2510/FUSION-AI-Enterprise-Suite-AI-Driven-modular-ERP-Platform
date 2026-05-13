import prisma from '../../../lib/prisma';
import * as wd from '../webhookDelivery';
import {
    canQueueWebhookConfig,
    isWebhookQueueEnabled,
    processWebhookQueueBatch,
    WEBHOOK_QUEUE_MAX_RUNS,
    enqueueWebhookFromAutomation,
} from '../webhookQueue';

jest.mock('../webhookDelivery', () => {
    const actual = jest.requireActual('../webhookDelivery');
    return {
        ...actual,
        deliverWebhook: jest.fn(),
    };
});

const deliverWebhook = wd.deliverWebhook as jest.MockedFunction<typeof wd.deliverWebhook>;

jest.mock('../../../lib/prisma', () => ({
    __esModule: true,
    default: {
        automationWebhookDelivery: {
            findMany: jest.fn(),
            delete: jest.fn(),
            update: jest.fn(),
            create: jest.fn(),
        },
    },
}));

describe('webhookQueue config', () => {
    const prev = process.env.AUTOMATION_WEBHOOK_QUEUE;

    afterEach(() => {
        process.env.AUTOMATION_WEBHOOK_QUEUE = prev;
    });

    test('isWebhookQueueEnabled respects env', () => {
        delete process.env.AUTOMATION_WEBHOOK_QUEUE;
        expect(isWebhookQueueEnabled()).toBe(false);
        process.env.AUTOMATION_WEBHOOK_QUEUE = '1';
        expect(isWebhookQueueEnabled()).toBe(true);
    });

    test('canQueueWebhookConfig rejects inline hmacSecret', () => {
        expect(canQueueWebhookConfig({ hmacSecret: 'x' })).toBe(false);
        expect(canQueueWebhookConfig({ hmacSecretEnv: 'K' })).toBe(true);
        expect(canQueueWebhookConfig({})).toBe(true);
    });
});

describe('processWebhookQueueBatch', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (prisma.automationWebhookDelivery.findMany as jest.Mock).mockResolvedValue([]);
    });

    test('no rows', async () => {
        const r = await processWebhookQueueBatch();
        expect(r).toEqual({ attempted: 0, dead: 0 });
    });

    test('deletes row on deliver success', async () => {
        (prisma.automationWebhookDelivery.findMany as jest.Mock).mockResolvedValue([
            {
                id: 1,
                status: 'queued',
                attempts: 0,
                payload: {
                    url: 'https://example.test/h',
                    method: 'POST',
                    headers: {},
                    body: '{}',
                    timeoutMs: 5000,
                    maxRetries: 0,
                    workflowId: 9,
                },
                workflowId: 9,
                nextRetryAt: null,
            },
        ]);
        deliverWebhook.mockResolvedValue({ ok: true, status: 200, attempts: 1 });
        (prisma.automationWebhookDelivery.delete as jest.Mock).mockResolvedValue({});

        const r = await processWebhookQueueBatch();
        expect(r.attempted).toBe(1);
        expect(r.dead).toBe(0);
        expect(prisma.automationWebhookDelivery.delete).toHaveBeenCalledWith({ where: { id: 1 } });
    });

    test('dead-letters after max worker runs', async () => {
        (prisma.automationWebhookDelivery.findMany as jest.Mock).mockResolvedValue([
            {
                id: 2,
                status: 'queued',
                attempts: WEBHOOK_QUEUE_MAX_RUNS - 1,
                payload: {
                    url: 'https://example.test/h',
                    method: 'POST',
                    headers: {},
                    body: '{}',
                    timeoutMs: 5000,
                    maxRetries: 0,
                    workflowId: 1,
                },
                workflowId: 1,
                nextRetryAt: null,
            },
        ]);
        deliverWebhook.mockResolvedValue({ ok: false, status: 503, attempts: 1 });
        (prisma.automationWebhookDelivery.update as jest.Mock).mockResolvedValue({});

        const r = await processWebhookQueueBatch();
        expect(r.dead).toBe(1);
        expect(prisma.automationWebhookDelivery.update).toHaveBeenCalledWith(
            expect.objectContaining({
                where: { id: 2 },
                data: expect.objectContaining({ status: 'dead' }),
            }),
        );
    });
});

describe('enqueueWebhookFromAutomation', () => {
    test('creates queued row', async () => {
        (prisma.automationWebhookDelivery.create as jest.Mock).mockResolvedValue({ id: 3 });
        await enqueueWebhookFromAutomation({
            workflowId: 7,
            url: 'https://example.test/x',
            method: 'POST',
            headers: {},
            timeoutMs: 1000,
            maxRetries: 0,
        });
        expect(prisma.automationWebhookDelivery.create).toHaveBeenCalledWith({
            data: {
                status: 'queued',
                payload: expect.objectContaining({ workflowId: 7 }),
                workflowId: 7,
            },
        });
    });
});
