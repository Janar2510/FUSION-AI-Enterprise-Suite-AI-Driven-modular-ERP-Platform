import express from 'express';
import request from 'supertest';
import { campaignRoutes } from '../routes/campaigns';

jest.mock('../core/auth', () => ({
    requireAuth: (_req: any, _res: any, next: any) => next(),
}));

jest.mock('../lib/prisma', () => ({
    __esModule: true,
    default: {
        marketingCampaign: {
            findUnique: jest.fn(),
        },
        campaignActivity: {
            findMany: jest.fn(),
            create: jest.fn(),
        },
        campaignParticipant: {
            findMany: jest.fn(),
            createMany: jest.fn(),
            count: jest.fn(),
        },
        partner: {
            findMany: jest.fn(),
        },
        crmLead: {
            findMany: jest.fn(),
        },
    },
}));

function buildApp() {
    const app = express();
    app.use(express.json());
    app.use('/api/campaigns', campaignRoutes);
    return app;
}

describe('campaign activity endpoints', () => {
    const app = buildApp();
    const prisma = require('../lib/prisma').default;

    beforeEach(() => {
        jest.clearAllMocks();
        prisma.marketingCampaign.findUnique.mockResolvedValue({ id: 1, name: 'Welcome Flow' });
        prisma.campaignActivity.findMany.mockResolvedValue([
            {
                id: 10,
                campaignId: 1,
                name: 'Welcome email',
                type: 'email',
                sequence: 1,
                delayValue: 0,
                delayUnit: 'hours',
                state: 'draft',
            },
        ]);
        prisma.campaignActivity.create.mockImplementation(({ data }: any) =>
            Promise.resolve({ id: 11, ...data })
        );
        prisma.campaignParticipant.findMany.mockResolvedValue([
            {
                id: 20,
                campaignId: 1,
                targetModel: 'partner',
                targetId: 'partner-1',
                name: 'Acme Ltd',
                email: 'buyer@acme.test',
                state: 'queued',
            },
        ]);
        prisma.campaignParticipant.createMany.mockResolvedValue({ count: 2 });
        prisma.campaignParticipant.count.mockResolvedValue(2);
        prisma.partner.findMany.mockResolvedValue([
            { id: 'partner-1', name: 'Acme Ltd', email: 'buyer@acme.test' },
            { id: 'partner-2', name: 'Beta Ltd', email: 'hello@beta.test' },
        ]);
        prisma.crmLead.findMany.mockResolvedValue([
            { id: 100, name: 'Expansion Deal', contactName: 'Jane Doe', emailFrom: 'jane@example.test' },
        ]);
    });

    it('lists activities for a campaign in sequence order', async () => {
        const res = await request(app).get('/api/campaigns/1/activities');

        expect(res.status).toBe(200);
        expect(res.body).toHaveLength(1);
        expect(prisma.campaignActivity.findMany).toHaveBeenCalledWith({
            where: { campaignId: 1 },
            orderBy: [{ sequence: 'asc' }, { createdAt: 'asc' }],
        });
    });

    it('creates a campaign activity with validated defaults', async () => {
        const res = await request(app)
            .post('/api/campaigns/1/activities')
            .send({
                name: 'Send welcome email',
                type: 'email',
                sequence: 1,
                delayValue: 2,
                delayUnit: 'days',
                templateRef: 'welcome-flow-email',
            });

        expect(res.status).toBe(201);
        expect(res.body).toMatchObject({
            campaignId: 1,
            name: 'Send welcome email',
            type: 'email',
            state: 'draft',
        });
        expect(prisma.campaignActivity.create).toHaveBeenCalledWith({
            data: expect.objectContaining({
                campaignId: 1,
                name: 'Send welcome email',
                type: 'email',
                sequence: 1,
                delayValue: 2,
                delayUnit: 'days',
                state: 'draft',
            }),
        });
    });

    it('rejects unsupported activity types', async () => {
        const res = await request(app)
            .post('/api/campaigns/1/activities')
            .send({ name: 'Bad activity', type: 'push' });

        expect(res.status).toBe(422);
        expect(prisma.campaignActivity.create).not.toHaveBeenCalled();
    });

    it('returns 404 when the campaign does not exist', async () => {
        prisma.marketingCampaign.findUnique.mockResolvedValueOnce(null);

        const res = await request(app).get('/api/campaigns/999/activities');

        expect(res.status).toBe(404);
        expect(res.body).toHaveProperty('error', 'Campaign not found');
    });

    it('lists participants for a campaign', async () => {
        const res = await request(app).get('/api/campaigns/1/participants');

        expect(res.status).toBe(200);
        expect(res.body).toHaveLength(1);
        expect(prisma.campaignParticipant.findMany).toHaveBeenCalledWith({
            where: { campaignId: 1 },
            orderBy: { createdAt: 'desc' },
        });
    });

    it('resolves opted-in partner audience into participants', async () => {
        const res = await request(app)
            .post('/api/campaigns/1/participants/resolve')
            .send({
                targetModel: 'partner',
                filters: {
                    consentMarketing: true,
                    isCustomer: true,
                    search: 'Ltd',
                },
            });

        expect(res.status).toBe(201);
        expect(res.body).toMatchObject({ created: 2, totalParticipants: 2 });
        expect(prisma.partner.findMany).toHaveBeenCalledWith({
            where: expect.objectContaining({
                consentMarketing: true,
                isCustomer: true,
                OR: [
                    { name: { contains: 'Ltd', mode: 'insensitive' } },
                    { email: { contains: 'Ltd', mode: 'insensitive' } },
                ],
            }),
            take: 500,
        });
        expect(prisma.campaignParticipant.createMany).toHaveBeenCalledWith({
            data: [
                {
                    campaignId: 1,
                    targetModel: 'partner',
                    targetId: 'partner-1',
                    name: 'Acme Ltd',
                    email: 'buyer@acme.test',
                    state: 'queued',
                },
                {
                    campaignId: 1,
                    targetModel: 'partner',
                    targetId: 'partner-2',
                    name: 'Beta Ltd',
                    email: 'hello@beta.test',
                    state: 'queued',
                },
            ],
            skipDuplicates: true,
        });
    });

    it('resolves CRM leads into participants', async () => {
        const res = await request(app)
            .post('/api/campaigns/1/participants/resolve')
            .send({
                targetModel: 'crm_lead',
                filters: {
                    active: true,
                    minProbability: 50,
                },
            });

        expect(res.status).toBe(201);
        expect(prisma.crmLead.findMany).toHaveBeenCalledWith({
            where: {
                active: true,
                probability: { gte: 50 },
            },
            take: 500,
        });
        expect(prisma.campaignParticipant.createMany).toHaveBeenCalledWith({
            data: [
                {
                    campaignId: 1,
                    targetModel: 'crm_lead',
                    targetId: '100',
                    name: 'Jane Doe',
                    email: 'jane@example.test',
                    state: 'queued',
                },
            ],
            skipDuplicates: true,
        });
    });

    it('rejects unsupported audience target models', async () => {
        const res = await request(app)
            .post('/api/campaigns/1/participants/resolve')
            .send({ targetModel: 'event_registration', filters: {} });

        expect(res.status).toBe(422);
        expect(prisma.campaignParticipant.createMany).not.toHaveBeenCalled();
    });
});
