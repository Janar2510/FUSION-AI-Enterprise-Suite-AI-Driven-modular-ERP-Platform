import { Router } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { firstStepScheduledAt } from '../lib/marketingWorkflow';
import { asyncHandler, getPagination, paginatedResponse } from '../lib/utils';
import { requireAuth, requirePermission } from '../core/auth';
import { PERMISSIONS } from '../core/auth/roles';

export const campaignRoutes = Router();
campaignRoutes.use(requireAuth);

const ActivityTypeSchema = z.enum(['email', 'sms', 'server_action']);
const DelayUnitSchema = z.enum(['minutes', 'hours', 'days', 'weeks']);
const ActivityStateSchema = z.enum(['draft', 'active', 'paused', 'done']);

const CampaignActivityCreateSchema = z.object({
    name: z.string().trim().min(1),
    type: ActivityTypeSchema,
    sequence: z.coerce.number().int().positive().default(1),
    delayValue: z.coerce.number().int().min(0).default(0),
    delayUnit: DelayUnitSchema.default('hours'),
    templateRef: z.string().trim().min(1).optional(),
    subject: z.string().trim().min(1).optional(),
    body: z.string().trim().min(1).optional(),
    serverAction: z.string().trim().min(1).optional(),
    state: ActivityStateSchema.default('draft'),
});

const CampaignActivityUpdateSchema = CampaignActivityCreateSchema.partial();
const IdSchema = z.coerce.number().int().positive();
const EmailCompositionSchema = z.object({
    templateMailingId: z.coerce.number().int().positive().optional(),
    subject: z.string().trim().min(1).optional(),
    bodyHtml: z.string().trim().min(1).optional(),
}).refine((value) => value.templateMailingId || (value.subject && value.bodyHtml), {
    message: 'Provide templateMailingId or both subject and bodyHtml',
});

const PartnerAudienceFiltersSchema = z.object({
    consentMarketing: z.coerce.boolean().optional(),
    isCustomer: z.coerce.boolean().optional(),
    isCompany: z.coerce.boolean().optional(),
    city: z.string().trim().min(1).optional(),
    search: z.string().trim().min(1).optional(),
});

const CrmLeadAudienceFiltersSchema = z.object({
    active: z.coerce.boolean().optional(),
    type: z.enum(['lead', 'opportunity']).optional(),
    minProbability: z.coerce.number().min(0).max(100).optional(),
    minExpectedRevenue: z.coerce.number().min(0).optional(),
    search: z.string().trim().min(1).optional(),
});

const AudienceResolveSchema = z.discriminatedUnion('targetModel', [
    z.object({
        targetModel: z.literal('partner'),
        filters: PartnerAudienceFiltersSchema.default({}),
        limit: z.coerce.number().int().positive().max(500).default(500),
    }),
    z.object({
        targetModel: z.literal('crm_lead'),
        filters: CrmLeadAudienceFiltersSchema.default({}),
        limit: z.coerce.number().int().positive().max(500).default(500),
    }),
]);

const LAUNCHABLE_CAMPAIGN_STATES = new Set(['draft', 'paused']);

type TemplateActivity = {
    name: string;
    type: 'email' | 'sms' | 'server_action';
    sequence: number;
    delayValue: number;
    delayUnit: 'minutes' | 'hours' | 'days' | 'weeks';
    subject?: string;
    body?: string;
    serverAction?: string;
};

type CampaignTemplate = {
    id: string;
    name: string;
    description: string;
    type: string;
    activities: TemplateActivity[];
};

const CAMPAIGN_TEMPLATES: CampaignTemplate[] = [
    {
        id: 'welcome-flow',
        name: 'Welcome Flow',
        description: 'Introduce new contacts to your brand with a warm welcome sequence.',
        type: 'email',
        activities: [
            { name: 'Welcome Email', type: 'email', sequence: 1, delayValue: 0, delayUnit: 'hours', subject: 'Welcome to {{company_name}}!', body: '<p>Hi {{name}}, welcome! We\'re thrilled to have you.</p>' },
            { name: 'Feature Introduction', type: 'email', sequence: 2, delayValue: 1, delayUnit: 'days', subject: 'Discover our best features', body: '<p>Here\'s what you can do next...</p>' },
            { name: 'Special Offer', type: 'email', sequence: 3, delayValue: 3, delayUnit: 'days', subject: 'Your exclusive welcome offer', body: '<p>As a new member, enjoy 20% off your first order!</p>' },
        ],
    },
    {
        id: 'double-opt-in',
        name: 'Double Opt-in',
        description: 'Confirm subscriber consent with a verification email, then follow up.',
        type: 'email',
        activities: [
            { name: 'Verification Email', type: 'email', sequence: 1, delayValue: 0, delayUnit: 'hours', subject: 'Please confirm your subscription', body: '<p>Click <a href="{{opt_in_url}}">here</a> to confirm.</p>' },
            { name: 'Reminder', type: 'email', sequence: 2, delayValue: 1, delayUnit: 'days', subject: 'Confirm your subscription (reminder)', body: '<p>Didn\'t confirm yet? <a href="{{opt_in_url}}">Click here</a>.</p>' },
            { name: 'Welcome After Opt-in', type: 'email', sequence: 3, delayValue: 0, delayUnit: 'hours', subject: 'You\'re in! Welcome aboard', body: '<p>Thanks for confirming, {{name}}!</p>' },
        ],
    },
    {
        id: 'tag-hot-contacts',
        name: 'Tag Hot Contacts',
        description: 'Score and tag high-engagement contacts for priority follow-up.',
        type: 'server_action',
        activities: [
            { name: 'Engagement Score', type: 'server_action', sequence: 1, delayValue: 2, delayUnit: 'days', serverAction: 'score_engagement' },
            { name: 'Tag Hot Leads', type: 'server_action', sequence: 2, delayValue: 0, delayUnit: 'hours', serverAction: 'tag_hot_leads' },
            { name: 'Notify Sales', type: 'email', sequence: 3, delayValue: 0, delayUnit: 'hours', subject: 'Hot lead identified: {{name}}', body: '<p>Contact {{name}} ({{email}}) has been tagged as a hot lead.</p>' },
        ],
    },
    {
        id: 'commercial-prospection',
        name: 'Commercial Prospection',
        description: 'Reach out to prospects with a multi-step email sequence to drive conversions.',
        type: 'email',
        activities: [
            { name: 'Initial Outreach', type: 'email', sequence: 1, delayValue: 0, delayUnit: 'hours', subject: 'Quick question, {{name}}', body: '<p>Hi {{name}}, I wanted to reach out about...</p>' },
            { name: 'Follow Up 1', type: 'email', sequence: 2, delayValue: 3, delayUnit: 'days', subject: 'Re: Quick question', body: '<p>Hi {{name}}, following up on my previous email...</p>' },
            { name: 'Follow Up 2', type: 'email', sequence: 3, delayValue: 7, delayUnit: 'days', subject: 'Still interested?', body: '<p>Hi {{name}}, wanted to check if you had any questions.</p>' },
        ],
    },
    {
        id: 'schedule-calls',
        name: 'Schedule Calls',
        description: 'Nurture leads with email sequence and SMS reminders to book a call.',
        type: 'email',
        activities: [
            { name: 'Call Invitation', type: 'email', sequence: 1, delayValue: 0, delayUnit: 'hours', subject: 'Let\'s schedule a quick call', body: '<p>Hi {{name}}, would you be open to a 15-min call? <a href="{{booking_url}}">Book here</a>.</p>' },
            { name: 'SMS Reminder', type: 'sms', sequence: 2, delayValue: 1, delayUnit: 'days' },
            { name: 'Final Reminder', type: 'email', sequence: 3, delayValue: 3, delayUnit: 'days', subject: 'Reminder: Book your call', body: '<p>Hi {{name}}, still available for a call this week?</p>' },
        ],
    },
    {
        id: 'prioritize-hot-leads',
        name: 'Prioritize Hot Leads',
        description: 'Identify high-intent leads and route them for immediate sales follow-up.',
        type: 'server_action',
        activities: [
            { name: 'Lead Scoring', type: 'server_action', sequence: 1, delayValue: 0, delayUnit: 'hours', serverAction: 'score_lead' },
            { name: 'Route to Sales', type: 'server_action', sequence: 2, delayValue: 0, delayUnit: 'hours', serverAction: 'route_to_sales' },
            { name: 'Sales Alert', type: 'email', sequence: 3, delayValue: 0, delayUnit: 'hours', subject: 'High-priority lead assigned to you', body: '<p>A hot lead ({{name}}, {{email}}) has been routed to your queue.</p>' },
        ],
    },
];

function validationError(res: any, error: z.ZodError) {
    res.status(422).json({
        error: 'Validation failed',
        fields: error.issues.map((issue) => ({
            field: issue.path.join('.'),
            message: issue.message,
        })),
    });
}

function parseId(value: string): number {
    return IdSchema.parse(value);
}

function removeUndefined<T extends Record<string, unknown>>(value: T): T {
    return Object.fromEntries(Object.entries(value).filter(([, fieldValue]) => fieldValue !== undefined)) as T;
}

async function ensureCampaignExists(campaignId: number) {
    const campaign = await prisma.marketingCampaign.findUnique({ where: { id: campaignId } });
    if (!campaign) {
        return false;
    }
    return true;
}

campaignRoutes.get('/', requirePermission(PERMISSIONS.MARKETING_READ), asyncHandler(async (req, res) => {
    const { page, limit, skip } = getPagination(req.query);
    const [data, total] = await Promise.all([
        prisma.marketingCampaign.findMany({ skip, take: limit, orderBy: { createdAt: 'desc' } }),
        prisma.marketingCampaign.count(),
    ]);
    res.json(paginatedResponse(data, total, page, limit));
}));

campaignRoutes.get('/templates', requirePermission(PERMISSIONS.MARKETING_READ), asyncHandler(async (_req, res) => {
    res.json(CAMPAIGN_TEMPLATES);
}));

campaignRoutes.post('/from-template', requirePermission(PERMISSIONS.MARKETING_WRITE), asyncHandler(async (req, res) => {
    const { templateId, name, ...rest } = req.body as { templateId: string; name?: string };
    const template = CAMPAIGN_TEMPLATES.find((t) => t.id === templateId);
    if (!template) {
        res.status(404).json({ error: 'Template not found' });
        return;
    }
    const campaign = await prisma.marketingCampaign.create({
        data: {
            name: name || template.name,
            description: template.description,
            type: template.type,
            state: 'draft',
            ...rest,
        },
    });
    await prisma.campaignActivity.createMany({
        data: template.activities.map((a) => ({
            campaignId: campaign.id,
            name: a.name,
            type: a.type,
            sequence: a.sequence,
            delayValue: a.delayValue,
            delayUnit: a.delayUnit,
            subject: a.subject,
            body: a.body,
            serverAction: a.serverAction,
            state: 'draft',
        })),
    });
    const activities = await prisma.campaignActivity.findMany({
        where: { campaignId: campaign.id },
        orderBy: [{ sequence: 'asc' }, { id: 'asc' }],
    });
    res.status(201).json({ ...campaign, activities });
}));

campaignRoutes.get('/:id/traces', requirePermission(PERMISSIONS.MARKETING_READ), asyncHandler(async (req, res) => {
    const campaignId = parseId(req.params.id);
    if (!(await ensureCampaignExists(campaignId))) {
        res.status(404).json({ error: 'Campaign not found' });
        return;
    }
    const { page, limit, skip } = getPagination(req.query);
    const [traces, total] = await Promise.all([
        prisma.campaignTrace.findMany({
            where: { campaignId },
            include: {
                activity: { select: { id: true, name: true, type: true } },
                participant: { select: { id: true, name: true, email: true } },
            },
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
        }),
        prisma.campaignTrace.count({ where: { campaignId } }),
    ]);
    res.json(paginatedResponse(traces, total, page, limit));
}));

campaignRoutes.get('/:id/analytics', requirePermission(PERMISSIONS.MARKETING_READ), asyncHandler(async (req, res) => {
    const campaignId = parseId(req.params.id);
    const campaign = await prisma.marketingCampaign.findUnique({ where: { id: campaignId } });
    if (!campaign) {
        res.status(404).json({ error: 'Campaign not found' });
        return;
    }
    const [totalParticipants, queued, active, completed, traces, activityStats] = await Promise.all([
        prisma.campaignParticipant.count({ where: { campaignId } }),
        prisma.campaignParticipant.count({ where: { campaignId, state: 'queued' } }),
        prisma.campaignParticipant.count({ where: { campaignId, state: 'active' } }),
        prisma.campaignParticipant.count({ where: { campaignId, state: 'completed' } }),
        prisma.campaignTrace.groupBy({
            by: ['status'],
            where: { campaignId },
            _count: true,
        }),
        Promise.all(
            (await prisma.campaignActivity.findMany({
                where: { campaignId },
                select: {
                    id: true,
                    name: true,
                    type: true,
                    successCount: true,
                    rejectedCount: true,
                    traces: {
                        select: {
                            status: true,
                            createdAt: true,
                        },
                        take: 100,
                        orderBy: { createdAt: 'desc' },
                    },
                },
                orderBy: [{ sequence: 'asc' }, { id: 'asc' }],
            })).map(async (a) => {
                const traceCounts = await prisma.campaignTrace.groupBy({
                    by: ['status'],
                    where: { activityId: a.id },
                    _count: true,
                });
                return { ...a, traceCounts };
            })
        ),
    ]);
    const statusMap = Object.fromEntries(traces.map((t) => [t.status, t._count]));
    res.json({
        campaign: {
            id: campaign.id,
            name: campaign.name,
            state: campaign.state,
            leads: campaign.leads,
            conversions: campaign.conversions,
        },
        participants: { total: totalParticipants, queued, active, completed },
        tracesByStatus: statusMap,
        activities: activityStats,
    });
}));

campaignRoutes.post('/:id/test', requirePermission(PERMISSIONS.MARKETING_WRITE), asyncHandler(async (req, res) => {
    const campaignId = parseId(req.params.id);
    const campaign = await prisma.marketingCampaign.findUnique({
        where: { id: campaignId },
        include: { activities: { orderBy: [{ sequence: 'asc' }, { id: 'asc' }] } },
    });
    if (!campaign) {
        res.status(404).json({ error: 'Campaign not found' });
        return;
    }
    const { email } = req.body as { email?: string };
    if (!email) {
        res.status(422).json({ error: 'testEmail is required' });
        return;
    }
    const firstActivity = campaign.activities[0];
    if (!firstActivity || firstActivity.type !== 'email') {
        res.status(422).json({ error: 'Campaign has no email activity to test' });
        return;
    }
    const subject = firstActivity.subject || `Test: ${campaign.name}`;
    const body = firstActivity.body || '<p>Test email body</p>';
    const ev = await prisma.outboxEvent.create({
        data: {
            organizationId: '',
            eventKey: 'email.send',
            payload: {
                to: email,
                templateKey: 'marketing-campaign-test',
                vars: { subjectLine: subject, htmlBody: body, isTest: true },
            },
        },
    });
    res.json({ success: true, outboxEventId: ev.id, activityId: firstActivity.id });
}));

campaignRoutes.get('/:id', requirePermission(PERMISSIONS.MARKETING_READ), asyncHandler(async (req, res) => {
    const campaign = await prisma.marketingCampaign.findUniqueOrThrow({ where: { id: +req.params.id } });
    res.json(campaign);
}));

campaignRoutes.get('/:id/activities', requirePermission(PERMISSIONS.MARKETING_READ), asyncHandler(async (req, res) => {
    const campaignId = parseId(req.params.id);
    if (!(await ensureCampaignExists(campaignId))) {
        res.status(404).json({ error: 'Campaign not found' });
        return;
    }

    const activities = await prisma.campaignActivity.findMany({
        where: { campaignId },
        orderBy: [{ sequence: 'asc' }, { createdAt: 'asc' }],
    });
    res.json(activities);
}));

campaignRoutes.post('/:id/activities', requirePermission(PERMISSIONS.MARKETING_WRITE), asyncHandler(async (req, res) => {
    const campaignId = parseId(req.params.id);
    if (!(await ensureCampaignExists(campaignId))) {
        res.status(404).json({ error: 'Campaign not found' });
        return;
    }

    const parsed = CampaignActivityCreateSchema.safeParse(req.body);
    if (!parsed.success) {
        validationError(res, parsed.error);
        return;
    }

    const activity = await prisma.campaignActivity.create({
        data: {
            campaignId,
            ...parsed.data,
        },
    });
    res.status(201).json(activity);
}));

campaignRoutes.put('/:id/activities/:activityId', requirePermission(PERMISSIONS.MARKETING_WRITE), asyncHandler(async (req, res) => {
    const campaignId = parseId(req.params.id);
    const activityId = parseId(req.params.activityId);
    if (!(await ensureCampaignExists(campaignId))) {
        res.status(404).json({ error: 'Campaign not found' });
        return;
    }

    const parsed = CampaignActivityUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
        validationError(res, parsed.error);
        return;
    }

    const activity = await prisma.campaignActivity.update({
        where: { id: activityId },
        data: parsed.data,
    });
    res.json(activity);
}));

campaignRoutes.post('/:id/activities/:activityId/compose', requirePermission(PERMISSIONS.MARKETING_WRITE), asyncHandler(async (req, res) => {
    const campaignId = parseId(req.params.id);
    const activityId = parseId(req.params.activityId);
    if (!(await ensureCampaignExists(campaignId))) {
        res.status(404).json({ error: 'Campaign not found' });
        return;
    }

    const parsed = EmailCompositionSchema.safeParse(req.body);
    if (!parsed.success) {
        validationError(res, parsed.error);
        return;
    }

    const activity = await prisma.campaignActivity.findFirst({
        where: { id: activityId, campaignId },
    });
    if (!activity) {
        res.status(404).json({ error: 'Activity not found' });
        return;
    }
    if (activity.type !== 'email') {
        res.status(422).json({ error: 'Only email activities support email composition' });
        return;
    }

    let templateSubject: string | undefined;
    let templateBody: string | undefined;
    let templateRef: string | undefined;
    if (parsed.data.templateMailingId) {
        const template = await prisma.massMailing.findUnique({
            where: { id: parsed.data.templateMailingId },
        });
        if (!template) {
            res.status(404).json({ error: 'Email template not found' });
            return;
        }
        templateSubject = template.subject;
        templateBody = template.bodyHtml || undefined;
        templateRef = `mass_mailing:${template.id}`;
    }

    const subject = parsed.data.subject || templateSubject;
    const body = parsed.data.bodyHtml || templateBody;
    if (!subject || !body) {
        res.status(422).json({ error: 'Email composition requires subject and body content' });
        return;
    }

    const updated = await prisma.campaignActivity.update({
        where: { id: activityId },
        data: {
            subject,
            body,
            templateRef,
        },
    });

    res.json({
        activity: updated,
        mergeFields: ['name', 'email', 'phone'],
    });
}));

campaignRoutes.delete('/:id/activities/:activityId', requirePermission(PERMISSIONS.MARKETING_WRITE), asyncHandler(async (req, res) => {
    const campaignId = parseId(req.params.id);
    const activityId = parseId(req.params.activityId);
    if (!(await ensureCampaignExists(campaignId))) {
        res.status(404).json({ error: 'Campaign not found' });
        return;
    }

    await prisma.campaignActivity.delete({ where: { id: activityId } });
    res.json({ success: true });
}));

campaignRoutes.get('/:id/participants', requirePermission(PERMISSIONS.MARKETING_READ), asyncHandler(async (req, res) => {
    const campaignId = parseId(req.params.id);
    if (!(await ensureCampaignExists(campaignId))) {
        res.status(404).json({ error: 'Campaign not found' });
        return;
    }

    const participants = await prisma.campaignParticipant.findMany({
        where: { campaignId },
        orderBy: { createdAt: 'desc' },
    });
    res.json(participants);
}));

campaignRoutes.post('/:id/participants/resolve', requirePermission(PERMISSIONS.MARKETING_WRITE), asyncHandler(async (req, res) => {
    const campaignId = parseId(req.params.id);
    if (!(await ensureCampaignExists(campaignId))) {
        res.status(404).json({ error: 'Campaign not found' });
        return;
    }

    const parsed = AudienceResolveSchema.safeParse(req.body);
    if (!parsed.success) {
        validationError(res, parsed.error);
        return;
    }

    if (parsed.data.targetModel === 'partner') {
        const where: Record<string, unknown> = {};
        if (parsed.data.filters.consentMarketing !== undefined) {
            where.consentMarketing = parsed.data.filters.consentMarketing;
        }
        if (parsed.data.filters.isCustomer !== undefined) {
            where.isCustomer = parsed.data.filters.isCustomer;
        }
        if (parsed.data.filters.isCompany !== undefined) {
            where.isCompany = parsed.data.filters.isCompany;
        }
        if (parsed.data.filters.city) {
            where.city = { contains: parsed.data.filters.city, mode: 'insensitive' };
        }
        if (parsed.data.filters.search) {
            where.OR = [
                { name: { contains: parsed.data.filters.search, mode: 'insensitive' } },
                { email: { contains: parsed.data.filters.search, mode: 'insensitive' } },
            ];
        }

        const targets = await prisma.partner.findMany({ where, take: parsed.data.limit });
        const created = await prisma.campaignParticipant.createMany({
            data: targets.map((target) => removeUndefined({
                campaignId,
                targetModel: 'partner',
                targetId: target.id,
                name: target.name,
                email: target.email,
                phone: target.phone,
                state: 'queued',
            })),
            skipDuplicates: true,
        });
        const totalParticipants = await prisma.campaignParticipant.count({ where: { campaignId } });
        res.status(201).json({ created: created.count, totalParticipants, targetModel: 'partner' });
        return;
    }

    const where: Record<string, unknown> = {};
    if (parsed.data.filters.active !== undefined) {
        where.active = parsed.data.filters.active;
    }
    if (parsed.data.filters.type) {
        where.type = parsed.data.filters.type;
    }
    if (parsed.data.filters.minProbability !== undefined) {
        where.probability = { gte: parsed.data.filters.minProbability };
    }
    if (parsed.data.filters.minExpectedRevenue !== undefined) {
        where.expectedRevenue = { gte: parsed.data.filters.minExpectedRevenue };
    }
    if (parsed.data.filters.search) {
        where.OR = [
            { name: { contains: parsed.data.filters.search, mode: 'insensitive' } },
            { contactName: { contains: parsed.data.filters.search, mode: 'insensitive' } },
            { emailFrom: { contains: parsed.data.filters.search, mode: 'insensitive' } },
        ];
    }

    const targets = await prisma.crmLead.findMany({ where, take: parsed.data.limit });
    const created = await prisma.campaignParticipant.createMany({
        data: targets.map((target) => removeUndefined({
            campaignId,
            targetModel: 'crm_lead',
            targetId: String(target.id),
            name: target.contactName || target.name,
            email: target.emailFrom,
            phone: target.phone,
            state: 'queued',
        })),
        skipDuplicates: true,
    });
    const totalParticipants = await prisma.campaignParticipant.count({ where: { campaignId } });
    res.status(201).json({ created: created.count, totalParticipants, targetModel: 'crm_lead' });
}));

campaignRoutes.post('/:id/launch', requirePermission(PERMISSIONS.MARKETING_WRITE), asyncHandler(async (req, res) => {
    const campaignId = parseId(req.params.id);
    const campaign = await prisma.marketingCampaign.findUnique({ where: { id: campaignId } });
    if (!campaign) {
        res.status(404).json({ error: 'Campaign not found' });
        return;
    }

    if (!LAUNCHABLE_CAMPAIGN_STATES.has(campaign.state)) {
        res.status(409).json({
            error: `Campaign cannot be launched from state '${campaign.state}'`,
            state: campaign.state,
        });
        return;
    }

    const activityCount = await prisma.campaignActivity.count({ where: { campaignId } });
    if (activityCount === 0) {
        res.status(422).json({ error: 'Cannot launch a campaign with no activities' });
        return;
    }

    const updated = await prisma.$transaction(async (tx) => {
        const record = await tx.marketingCampaign.update({
            where: { id: campaignId },
            data: {
                state: 'active',
                startDate: campaign.startDate ?? new Date(),
            },
        });

        const firstActivity = await tx.campaignActivity.findFirst({
            where: { campaignId },
            orderBy: [{ sequence: 'asc' }, { id: 'asc' }],
        });

        if (firstActivity) {
            const nextAt = firstStepScheduledAt(firstActivity, new Date());
            await tx.campaignParticipant.updateMany({
                where: { campaignId, nextActionAt: null },
                data: { nextActionAt: nextAt },
            });
        }

        return record;
    });
    res.json(updated);
}));

campaignRoutes.post('/', requirePermission(PERMISSIONS.MARKETING_WRITE), asyncHandler(async (req, res) => {
    const campaign = await prisma.marketingCampaign.create({ data: req.body });
    res.status(201).json(campaign);
}));

campaignRoutes.put('/:id', requirePermission(PERMISSIONS.MARKETING_WRITE), asyncHandler(async (req, res) => {
    const campaign = await prisma.marketingCampaign.update({ where: { id: +req.params.id }, data: req.body });
    res.json(campaign);
}));

campaignRoutes.delete('/:id', requirePermission(PERMISSIONS.MARKETING_WRITE), asyncHandler(async (req, res) => {
    await prisma.marketingCampaign.delete({ where: { id: +req.params.id } });
    res.json({ success: true });
}));
