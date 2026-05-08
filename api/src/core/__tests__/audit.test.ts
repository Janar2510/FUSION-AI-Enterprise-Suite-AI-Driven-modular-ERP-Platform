jest.mock('../../lib/prisma', () => ({
    __esModule: true,
    default: { auditLog: { create: jest.fn() } },
}));

import prisma from '../../lib/prisma';
import { audit } from '../audit';

describe('audit()', () => {
    beforeEach(() => jest.clearAllMocks());

    test('creates an audit log row with all fields', async () => {
        (prisma as any).auditLog.create.mockResolvedValue({});

        await audit({
            organizationId: 'org-1',
            userId: 'user-1',
            model: 'Partner',
            recordId: 'p-1',
            action: 'UPDATE',
            before: { name: 'Old' },
            after: { name: 'New' },
            req: { ip: '127.0.0.1', headers: { 'user-agent': 'jest' } } as any,
        });

        expect((prisma as any).auditLog.create).toHaveBeenCalledTimes(1);
        const data = (prisma as any).auditLog.create.mock.calls[0][0].data;
        expect(data.organizationId).toBe('org-1');
        expect(data.actorUserId).toBe('user-1');
        expect(data.action).toBe('UPDATE');
        expect(data.entityType).toBe('Partner');
        expect(data.entityId).toBe('p-1');
        expect(data.before).toEqual({ name: 'Old' });
        expect(data.after).toEqual({ name: 'New' });
        expect(data.ip).toBe('127.0.0.1');
        expect(data.userAgent).toBe('jest');
    });

    test('audit without optional fields sets nulls', async () => {
        (prisma as any).auditLog.create.mockResolvedValue({});

        await audit({
            organizationId: 'org-1',
            model: 'Product',
            recordId: 'prod-1',
            action: 'CREATE',
        });

        const data = (prisma as any).auditLog.create.mock.calls[0][0].data;
        expect(data.actorUserId).toBeNull();
        expect(data.ip).toBeNull();
        expect(data.userAgent).toBeNull();
        expect(data.before).toBeNull();
        expect(data.after).toBeNull();
    });

    test('does not throw when DB write fails', async () => {
        (prisma as any).auditLog.create.mockRejectedValue(new Error('DB down'));

        await expect(
            audit({ organizationId: 'org-1', model: 'X', recordId: 'r', action: 'DELETE' })
        ).resolves.toBeUndefined();
    });

    test('handles ai_action.approve action type', async () => {
        (prisma as any).auditLog.create.mockResolvedValue({});

        await audit({
            organizationId: 'org-1',
            model: 'AiAction',
            recordId: 'ai-1',
            action: 'ai_action.approve',
        });

        const data = (prisma as any).auditLog.create.mock.calls[0][0].data;
        expect(data.action).toBe('ai_action.approve');
    });
});
