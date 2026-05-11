import { Router } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { firstStepScheduledAt } from '../lib/marketingWorkflow';
import { asyncHandler, getPagination, paginatedResponse } from '../lib/utils';
import { requireAuth } from '../core/auth';

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

function parseId(value: string): number {
    return IdSchema.parse(value);
}

function validationError(res: any, error: z.ZodError) {
    res.status(422).json({
        error: 'Validation failed',
        fields: error.issues.map((issue) => ({
            field: issue.path.join('.'),
            message: issue.message,
        })),
    });
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

campaignRoutes.get('/', asyncHandler(async (req, res) => {
    const { page, limit, skip } = getPagination(req.query);
    const [data, total] = await Promise.all([
        prisma.marketingCampaign.findMany({ skip, take: limit, orderBy: { createdAt: 'desc' } }),
        prisma.marketingCampaign.count(),
    ]);
    res.json(paginatedResponse(data, total, page, limit));
}));

campaignRoutes.get('/:id', asyncHandler(async (req, res) => {
    const campaign = await prisma.marketingCampaign.findUniqueOrThrow({ where: { id: +req.params.id } });
    res.json(campaign);
}));

campaignRoutes.get('/:id/activities', asyncHandler(async (req, res) => {
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

campaignRoutes.post('/:id/activities', asyncHandler(async (req, res) => {
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

campaignRoutes.put('/:id/activities/:activityId', asyncHandler(async (req, res) => {
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

campaignRoutes.post('/:id/activities/:activityId/compose', asyncHandler(async (req, res) => {
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

campaignRoutes.delete('/:id/activities/:activityId', asyncHandler(async (req, res) => {
    const campaignId = parseId(req.params.id);
    const activityId = parseId(req.params.activityId);
    if (!(await ensureCampaignExists(campaignId))) {
        res.status(404).json({ error: 'Campaign not found' });
        return;
    }

    await prisma.campaignActivity.delete({ where: { id: activityId } });
    res.json({ success: true });
}));

campaignRoutes.get('/:id/participants', asyncHandler(async (req, res) => {
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

campaignRoutes.post('/:id/participants/resolve', asyncHandler(async (req, res) => {
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

campaignRoutes.post('/:id/launch', asyncHandler(async (req, res) => {
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

campaignRoutes.post('/', asyncHandler(async (req, res) => {
    const campaign = await prisma.marketingCampaign.create({ data: req.body });
    res.status(201).json(campaign);
}));

campaignRoutes.put('/:id', asyncHandler(async (req, res) => {
    const campaign = await prisma.marketingCampaign.update({ where: { id: +req.params.id }, data: req.body });
    res.json(campaign);
}));

campaignRoutes.delete('/:id', asyncHandler(async (req, res) => {
    await prisma.marketingCampaign.delete({ where: { id: +req.params.id } });
    res.json({ success: true });
}));
