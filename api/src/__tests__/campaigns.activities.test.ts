import express from 'express';
import request from 'supertest';
import { campaignRoutes } from '../routes/campaigns';

jest.mock('../core/auth', () => ({
    requireAuth: (_req: any, _res: any, next: any) => next(),
}));

jest.mock('../lib/prisma', () => {
    const prisma: any = {
        marketingCampaign: {
            findUnique: jest.fn(),
            update: jest.fn(),
        },
        campaignActivity: {
            findMany: jest.fn(),
            create: jest.fn(),
            findFirst: jest.fn(),
            update: jest.fn(),
            count: jest.fn(),
        },
        campaignParticipant: {
            findMany: jest.fn(),
            createMany: jest.fn(),
            count: jest.fn(),
            updateMany: jest.fn(),
        },
        partner: {
            findMany: jest.fn(),
        },
        crmLead: {
            findMany: jest.fn(),
        },
        massMailing: {
            findUnique: jest.fn(),
        },
    };
    prisma.$transaction = jest.fn(async (fn: any) => fn(prisma));
    return { __esModule: true, default: prisma };
});

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
        prisma.campaignActivity.findFirst.mockResolvedValue({
            id: 10,
            campaignId: 1,
            name: 'Welcome email',
            type: 'email',
            sequence: 1,
            state: 'draft',
        });
        prisma.campaignActivity.update.mockImplementation(({ data }: any) =>
            Promise.resolve({ id: 10, campaignId: 1, type: 'email', ...data })
        );
        prisma.massMailing.findUnique.mockResolvedValue({
            id: 7,
            subject: 'Welcome {{name}}',
            bodyHtml: '<p>Hello {{name}}</p>',
            state: 'draft',
        });
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

    it('composes an email activity from an existing mass mailing', async () => {
        const res = await request(app)
            .post('/api/campaigns/1/activities/10/compose')
            .send({ templateMailingId: 7 });

        expect(res.status).toBe(200);
        expect(res.body.activity).toMatchObject({
            id: 10,
            subject: 'Welcome {{name}}',
            body: '<p>Hello {{name}}</p>',
            templateRef: 'mass_mailing:7',
        });
        expect(prisma.massMailing.findUnique).toHaveBeenCalledWith({ where: { id: 7 } });
        expect(prisma.campaignActivity.update).toHaveBeenCalledWith({
            where: { id: 10 },
            data: {
                subject: 'Welcome {{name}}',
                body: '<p>Hello {{name}}</p>',
                templateRef: 'mass_mailing:7',
            },
        });
    });

    it('composes an email activity from custom subject and body', async () => {
        const res = await request(app)
            .post('/api/campaigns/1/activities/10/compose')
            .send({
                subject: 'Reminder for {{name}}',
                bodyHtml: '<p>Your demo is ready.</p>',
            });

        expect(res.status).toBe(200);
        expect(prisma.massMailing.findUnique).not.toHaveBeenCalled();
        expect(prisma.campaignActivity.update).toHaveBeenCalledWith({
            where: { id: 10 },
            data: {
                subject: 'Reminder for {{name}}',
                body: '<p>Your demo is ready.</p>',
                templateRef: undefined,
            },
        });
    });

    it('returns 404 when the template mailing does not exist', async () => {
        prisma.massMailing.findUnique.mockResolvedValueOnce(null);

        const res = await request(app)
            .post('/api/campaigns/1/activities/10/compose')
            .send({ templateMailingId: 999 });

        expect(res.status).toBe(404);
        expect(res.body).toHaveProperty('error', 'Email template not found');
        expect(prisma.campaignActivity.update).not.toHaveBeenCalled();
    });

    it('rejects composition for non-email activities', async () => {
        prisma.campaignActivity.findFirst.mockResolvedValueOnce({
            id: 10,
            campaignId: 1,
            name: 'SMS follow-up',
            type: 'sms',
        });

        const res = await request(app)
            .post('/api/campaigns/1/activities/10/compose')
            .send({ subject: 'Nope', bodyHtml: '<p>Nope</p>' });

        expect(res.status).toBe(422);
        expect(res.body).toHaveProperty('error', 'Only email activities support email composition');
    });
});

describe('campaign launch endpoint', () => {
    const app = buildApp();
    const prisma = require('../lib/prisma').default;

    beforeEach(() => {
        jest.clearAllMocks();
        prisma.marketingCampaign.findUnique.mockResolvedValue({
            id: 1,
            name: 'Welcome Flow',
            state: 'draft',
            startDate: null,
        });
        prisma.marketingCampaign.update.mockImplementation(({ where, data }: any) =>
            Promise.resolve({ id: where.id, name: 'Welcome Flow', ...data })
        );
        prisma.campaignActivity.count.mockResolvedValue(2);
        prisma.campaignActivity.findFirst.mockResolvedValue({
            id: 10,
            sequence: 1,
            delayValue: 0,
            delayUnit: 'hours',
        });
        prisma.campaignParticipant.updateMany.mockResolvedValue({ count: 3 });
    });

    it('launches a draft campaign that has activities', async () => {
        const res = await request(app).post('/api/campaigns/1/launch');

        expect(res.status).toBe(200);
        expect(res.body).toMatchObject({ id: 1, state: 'active' });
        expect(prisma.$transaction).toHaveBeenCalled();
        expect(prisma.marketingCampaign.update).toHaveBeenCalledWith({
            where: { id: 1 },
            data: expect.objectContaining({
                state: 'active',
                startDate: expect.any(Date),
            }),
        });
        expect(prisma.campaignParticipant.updateMany).toHaveBeenCalledWith({
            where: { campaignId: 1, nextActionAt: null },
            data: { nextActionAt: expect.any(Date) },
        });
    });

    it('preserves an existing startDate on launch', async () => {
        const existingStart = new Date('2026-05-01T00:00:00.000Z');
        prisma.marketingCampaign.findUnique.mockResolvedValueOnce({
            id: 1,
            name: 'Welcome Flow',
            state: 'draft',
            startDate: existingStart,
        });

        const res = await request(app).post('/api/campaigns/1/launch');

        expect(res.status).toBe(200);
        expect(prisma.$transaction).toHaveBeenCalled();
        expect(prisma.marketingCampaign.update).toHaveBeenCalledWith({
            where: { id: 1 },
            data: {
                state: 'active',
                startDate: existingStart,
            },
        });
    });

    it('resumes a paused campaign on launch', async () => {
        prisma.marketingCampaign.findUnique.mockResolvedValueOnce({
            id: 1,
            name: 'Welcome Flow',
            state: 'paused',
            startDate: new Date('2026-04-01T00:00:00.000Z'),
        });

        const res = await request(app).post('/api/campaigns/1/launch');

        expect(res.status).toBe(200);
        expect(res.body.state).toBe('active');
        expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('offsets participant nextActionAt by the first activity delay', async () => {
        prisma.campaignActivity.findFirst.mockResolvedValueOnce({
            id: 10,
            sequence: 1,
            delayValue: 2,
            delayUnit: 'hours',
        });

        const before = Date.now();
        const res = await request(app).post('/api/campaigns/1/launch');
        const after = Date.now();

        expect(res.status).toBe(200);
        const call = prisma.campaignParticipant.updateMany.mock.calls[0][0];
        const nextAt = call.data.nextActionAt.getTime();
        expect(nextAt).toBeGreaterThanOrEqual(before + 2 * 3600000 - 1000);
        expect(nextAt).toBeLessThanOrEqual(after + 2 * 3600000 + 1000);
    });

    it('returns 422 when the campaign has no activities', async () => {
        prisma.campaignActivity.count.mockResolvedValueOnce(0);

        const res = await request(app).post('/api/campaigns/1/launch');

        expect(res.status).toBe(422);
        expect(res.body).toHaveProperty('error', 'Cannot launch a campaign with no activities');
        expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('returns 409 when the campaign is already active', async () => {
        prisma.marketingCampaign.findUnique.mockResolvedValueOnce({
            id: 1,
            name: 'Welcome Flow',
            state: 'active',
            startDate: new Date(),
        });

        const res = await request(app).post('/api/campaigns/1/launch');

        expect(res.status).toBe(409);
        expect(res.body).toMatchObject({ state: 'active' });
        expect(prisma.$transaction).not.toHaveBeenCalled();
        expect(prisma.marketingCampaign.update).not.toHaveBeenCalled();
        expect(prisma.campaignActivity.count).not.toHaveBeenCalled();
    });

    it('returns 409 when the campaign is completed', async () => {
        prisma.marketingCampaign.findUnique.mockResolvedValueOnce({
            id: 1,
            name: 'Welcome Flow',
            state: 'completed',
            startDate: new Date(),
        });

        const res = await request(app).post('/api/campaigns/1/launch');

        expect(res.status).toBe(409);
        expect(prisma.$transaction).not.toHaveBeenCalled();
        expect(prisma.marketingCampaign.update).not.toHaveBeenCalled();
    });

    it('returns 404 when the campaign does not exist', async () => {
        prisma.marketingCampaign.findUnique.mockResolvedValueOnce(null);

        const res = await request(app).post('/api/campaigns/999/launch');

        expect(res.status).toBe(404);
        expect(prisma.$transaction).not.toHaveBeenCalled();
        expect(prisma.marketingCampaign.update).not.toHaveBeenCalled();
    });
});
