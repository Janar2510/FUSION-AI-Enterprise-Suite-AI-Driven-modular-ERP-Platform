jest.mock('../../lib/prisma', () => ({
    __esModule: true,
    default: { outboxEvent: { create: jest.fn() } },
}));

import prisma from '../../lib/prisma';
import { publishEvent } from '../outbox';

describe('publishEvent()', () => {
    beforeEach(() => jest.clearAllMocks());

    test('inserts an OutboxEvent row with correct fields', async () => {
        (prisma as any).outboxEvent.create.mockResolvedValue({});

        await publishEvent({
            organizationId: 'org-1',
            topic: 'partner.created',
            payload: { id: 'p-1', name: 'Acme' },
            correlationId: 'corr-abc',
        });

        const data = (prisma as any).outboxEvent.create.mock.calls[0][0].data;
        expect(data.organizationId).toBe('org-1');
        expect(data.topic).toBe('partner.created');
        expect(JSON.parse(data.payload)).toEqual({ id: 'p-1', name: 'Acme' });
        expect(data.correlationId).toBe('corr-abc');
        expect(data.status).toBe('PENDING');
        expect(data.attempts).toBe(0);
    });

    test('sets correlationId to null when not provided', async () => {
        (prisma as any).outboxEvent.create.mockResolvedValue({});

        await publishEvent({
            organizationId: 'org-1',
            topic: 'order.confirmed',
            payload: { id: 'so-1' },
        });

        const data = (prisma as any).outboxEvent.create.mock.calls[0][0].data;
        expect(data.correlationId).toBeNull();
    });

    test('uses the supplied tx client instead of global prisma', async () => {
        const txMock = { outboxEvent: { create: jest.fn().mockResolvedValue({}) } };

        await publishEvent({
            organizationId: 'org-1',
            topic: 'invoice.posted',
            payload: { id: 'inv-1' },
            tx: txMock as any,
        });

        expect(txMock.outboxEvent.create).toHaveBeenCalledTimes(1);
        expect((prisma as any).outboxEvent.create).not.toHaveBeenCalled();
    });

    test('does not throw when DB write fails', async () => {
        (prisma as any).outboxEvent.create.mockRejectedValue(new Error('Outbox DB error'));

        await expect(
            publishEvent({ organizationId: 'org-1', topic: 'x', payload: {} })
        ).resolves.toBeUndefined();
    });

    test('serialises complex nested payload as JSON string', async () => {
        (prisma as any).outboxEvent.create.mockResolvedValue({});

        const payload = { lines: [{ id: 1, qty: 2 }, { id: 2, qty: 5 }], meta: { source: 'api' } };
        await publishEvent({ organizationId: 'org-1', topic: 'order.lines', payload });

        const data = (prisma as any).outboxEvent.create.mock.calls[0][0].data;
        expect(() => JSON.parse(data.payload)).not.toThrow();
        expect(JSON.parse(data.payload)).toEqual(payload);
    });
});
