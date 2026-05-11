import { runCampaignWorkflowTick } from '../jobs/campaignWorkflowRunner';
import prisma from '../lib/prisma';

jest.mock('../lib/prisma', () => {
    const p: any = {
        campaignParticipant: { findMany: jest.fn() },
        $transaction: jest.fn(),
    };
    return { __esModule: true, default: p };
});

describe('campaign workflow runner', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('does nothing when no participants are due', async () => {
        (prisma.campaignParticipant.findMany as jest.Mock).mockResolvedValue([]);
        await runCampaignWorkflowTick();
        expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('dispatches email via outbox and advances participant using the following activity delay', async () => {
        const now = new Date('2026-05-11T12:00:00.000Z');
        jest.useFakeTimers({ now });
        const p = prisma as any;
        p.campaignParticipant.findMany.mockResolvedValue([
            {
                id: 50,
                campaignId: 1,
                lastActivityId: null,
                nextActionAt: now,
                state: 'queued',
                email: 'buyer@example.test',
                phone: null,
                campaign: {
                    id: 1,
                    state: 'active',
                    activities: [
                        {
                            id: 2,
                            sequence: 10,
                            type: 'email',
                            delayValue: 0,
                            delayUnit: 'hours',
                            subject: 'Hi',
                            body: '<p>x</p>',
                            serverAction: null,
                        },
                        {
                            id: 3,
                            sequence: 20,
                            type: 'email',
                            delayValue: 2,
                            delayUnit: 'hours',
                            subject: 'Follow',
                            body: '<p>y</p>',
                            serverAction: null,
                        },
                    ],
                },
            },
        ]);

        const tx = {
            campaignTrace: {
                create: jest.fn().mockResolvedValue({ id: 900 }),
                update: jest.fn().mockResolvedValue({}),
            },
            outboxEvent: {
                create: jest.fn().mockResolvedValue({ id: 'out-1' }),
            },
            campaignActivity: {
                update: jest.fn().mockResolvedValue({}),
            },
            campaignParticipant: {
                update: jest.fn().mockResolvedValue({}),
            },
        };
        p.$transaction.mockImplementation(async (fn: (t: typeof tx) => Promise<void>) => fn(tx));

        await runCampaignWorkflowTick();

        expect(tx.outboxEvent.create).toHaveBeenCalledWith({
            data: {
                organizationId: '',
                eventKey: 'email.send',
                payload: expect.objectContaining({
                    templateKey: 'marketing-campaign',
                    traceId: 900,
                    activityId: 2,
                    to: 'buyer@example.test',
                }),
            },
        });
        expect(tx.campaignParticipant.update).toHaveBeenCalledWith({
            where: { id: 50 },
            data: {
                lastActivityId: 2,
                state: 'active',
                nextActionAt: new Date(now.getTime() + 2 * 3600000),
            },
        });
        jest.useRealTimers();
    });

    it('rejects email when participant has no email and still advances', async () => {
        const now = new Date('2026-05-11T12:00:00.000Z');
        jest.useFakeTimers({ now });
        const p = prisma as any;
        p.campaignParticipant.findMany.mockResolvedValue([
            {
                id: 51,
                campaignId: 1,
                lastActivityId: null,
                nextActionAt: now,
                state: 'queued',
                email: null,
                phone: null,
                campaign: {
                    id: 1,
                    state: 'active',
                    activities: [
                        {
                            id: 2,
                            sequence: 1,
                            type: 'email',
                            delayValue: 0,
                            delayUnit: 'hours',
                            subject: 'Hi',
                            body: '<p>x</p>',
                            serverAction: null,
                        },
                    ],
                },
            },
        ]);

        const tx = {
            campaignTrace: {
                create: jest.fn().mockResolvedValue({ id: 901 }),
                update: jest.fn().mockResolvedValue({}),
            },
            outboxEvent: { create: jest.fn() },
            campaignActivity: { update: jest.fn().mockResolvedValue({}) },
            campaignParticipant: { update: jest.fn().mockResolvedValue({}) },
        };
        p.$transaction.mockImplementation(async (fn: (t: typeof tx) => Promise<void>) => fn(tx));

        await runCampaignWorkflowTick();

        expect(tx.outboxEvent.create).not.toHaveBeenCalled();
        expect(tx.campaignTrace.update).toHaveBeenCalledWith({
            where: { id: 901 },
            data: expect.objectContaining({ status: 'rejected', reason: 'missing_email' }),
        });
        expect(tx.campaignActivity.update).toHaveBeenCalledWith({
            where: { id: 2 },
            data: { rejectedCount: { increment: 1 } },
        });
        expect(tx.campaignParticipant.update).toHaveBeenCalledWith({
            where: { id: 51 },
            data: {
                lastActivityId: 2,
                state: 'completed',
                nextActionAt: null,
            },
        });
        jest.useRealTimers();
    });

    it('uses activity chain order by sequence then id (not insertion id)', async () => {
        const now = new Date('2026-05-11T12:00:00.000Z');
        jest.useFakeTimers({ now });
        const p = prisma as any;
        p.campaignParticipant.findMany.mockResolvedValue([
            {
                id: 52,
                campaignId: 1,
                lastActivityId: 99,
                nextActionAt: now,
                state: 'active',
                email: 'x@test.com',
                phone: null,
                campaign: {
                    id: 1,
                    state: 'active',
                    activities: [
                        { id: 99, sequence: 1, type: 'email', delayValue: 0, delayUnit: 'hours', subject: 'A', body: '<p>a</p>', serverAction: null },
                        { id: 5, sequence: 2, type: 'email', delayValue: 0, delayUnit: 'hours', subject: 'B', body: '<p>b</p>', serverAction: null },
                    ],
                },
            },
        ]);

        const tx = {
            campaignTrace: {
                create: jest.fn().mockResolvedValue({ id: 902 }),
                update: jest.fn().mockResolvedValue({}),
            },
            outboxEvent: { create: jest.fn().mockResolvedValue({ id: 'o2' }) },
            campaignActivity: { update: jest.fn().mockResolvedValue({}) },
            campaignParticipant: { update: jest.fn().mockResolvedValue({}) },
        };
        p.$transaction.mockImplementation(async (fn: (t: typeof tx) => Promise<void>) => fn(tx));

        await runCampaignWorkflowTick();

        expect(tx.outboxEvent.create).toHaveBeenCalledWith({
            data: {
                organizationId: '',
                eventKey: 'email.send',
                payload: expect.objectContaining({
                    activityId: 5,
                    vars: expect.objectContaining({ subjectLine: 'B', htmlBody: '<p>b</p>' }),
                }),
            },
        });
        jest.useRealTimers();
    });

    it('marks unknown server_action as rejected', async () => {
        const now = new Date('2026-05-11T12:00:00.000Z');
        jest.useFakeTimers({ now });
        const p = prisma as any;
        p.campaignParticipant.findMany.mockResolvedValue([
            {
                id: 53,
                campaignId: 1,
                lastActivityId: null,
                nextActionAt: now,
                state: 'queued',
                email: null,
                phone: null,
                campaign: {
                    id: 1,
                    state: 'active',
                    activities: [
                        {
                            id: 8,
                            sequence: 1,
                            type: 'server_action',
                            delayValue: 0,
                            delayUnit: 'hours',
                            subject: null,
                            body: null,
                            serverAction: 'unknown.op',
                        },
                    ],
                },
            },
        ]);

        const tx = {
            campaignTrace: {
                create: jest.fn().mockResolvedValue({ id: 903 }),
                update: jest.fn().mockResolvedValue({}),
            },
            outboxEvent: { create: jest.fn() },
            campaignActivity: { update: jest.fn().mockResolvedValue({}) },
            campaignParticipant: { update: jest.fn().mockResolvedValue({}) },
        };
        p.$transaction.mockImplementation(async (fn: (t: typeof tx) => Promise<void>) => fn(tx));

        await runCampaignWorkflowTick();

        expect(tx.outboxEvent.create).not.toHaveBeenCalled();
        expect(tx.campaignTrace.update).toHaveBeenCalledWith({
            where: { id: 903 },
            data: expect.objectContaining({ status: 'rejected', reason: 'unsupported_action' }),
        });
        jest.useRealTimers();
    });
});
