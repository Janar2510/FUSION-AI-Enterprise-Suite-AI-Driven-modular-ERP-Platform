jest.mock('../../lib/prisma', () => ({
    __esModule: true,
    default: { timelineEvent: { create: jest.fn() } },
}));

import prisma from '../../lib/prisma';
import { emitTimeline } from '../timeline';

describe('emitTimeline()', () => {
    beforeEach(() => jest.clearAllMocks());

    test('creates a timeline event with all fields', async () => {
        (prisma as any).timelineEvent.create.mockResolvedValue({});

        await emitTimeline({
            organizationId: 'org-1',
            model: 'SaleOrder',
            recordId: 'so-1',
            type: 'STATUS_CHANGE',
            message: 'Order confirmed',
            userId: 'user-1',
            partnerId: 'p-1',
            meta: { from: 'draft', to: 'sale' },
        });

        const data = (prisma as any).timelineEvent.create.mock.calls[0][0].data;
        expect(data.organizationId).toBe('org-1');
        expect(data.model).toBe('SaleOrder');
        expect(data.recordId).toBe('so-1');
        expect(data.type).toBe('STATUS_CHANGE');
        expect(data.message).toBe('Order confirmed');
        expect(data.userId).toBe('user-1');
        expect(data.partnerId).toBe('p-1');
        expect(JSON.parse(data.meta)).toEqual({ from: 'draft', to: 'sale' });
    });

    test('sets optional fields to null when omitted', async () => {
        (prisma as any).timelineEvent.create.mockResolvedValue({});

        await emitTimeline({
            organizationId: 'org-1',
            model: 'Partner',
            recordId: 'p-1',
            type: 'CREATED',
            message: 'Partner created',
        });

        const data = (prisma as any).timelineEvent.create.mock.calls[0][0].data;
        expect(data.userId).toBeNull();
        expect(data.partnerId).toBeNull();
        expect(data.meta).toBeNull();
    });

    test('does not throw when DB write fails', async () => {
        (prisma as any).timelineEvent.create.mockRejectedValue(new Error('Connection lost'));

        await expect(
            emitTimeline({
                organizationId: 'org-1',
                model: 'Invoice',
                recordId: 'inv-1',
                type: 'NOTE',
                message: 'Test',
            })
        ).resolves.toBeUndefined();
    });

    test('handles every TimelineType without throwing', async () => {
        (prisma as any).timelineEvent.create.mockResolvedValue({});

        const types = [
            'CREATED', 'UPDATED', 'DELETED', 'STATUS_CHANGE',
            'NOTE', 'EMAIL_SENT', 'CALL_LOGGED', 'MEETING_SCHEDULED',
            'DOCUMENT_ATTACHED', 'PAYMENT_RECEIVED', 'CUSTOM',
        ] as const;

        for (const type of types) {
            await expect(
                emitTimeline({ organizationId: 'o', model: 'M', recordId: 'r', type, message: 'msg' })
            ).resolves.toBeUndefined();
        }
        expect((prisma as any).timelineEvent.create).toHaveBeenCalledTimes(types.length);
    });
});
