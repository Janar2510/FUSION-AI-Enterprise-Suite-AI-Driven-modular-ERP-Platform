import { Router } from 'express';
import prisma from '../lib/prisma';
import { asyncHandler, getPagination, paginatedResponse } from '../lib/utils';
import { requireAuth } from '../core/auth';
import { AppError } from '../core/errors';
import { publishEvent } from '../core/outbox';

export const recruitmentRoutes = Router();
recruitmentRoutes.use(requireAuth);

// ── Stages ────────────────────────────────────────────────────────────────────

recruitmentRoutes.get('/stages', asyncHandler(async (_req, res) => {
    const stages = await prisma.hrRecruitmentStage.findMany({
        where: { active: true },
        orderBy: { sequence: 'asc' },
        include: { _count: { select: { applicants: true } } },
    });
    res.json(stages);
}));

recruitmentRoutes.post('/stages', asyncHandler(async (req, res) => {
    const stage = await prisma.hrRecruitmentStage.create({ data: req.body });
    res.status(201).json(stage);
}));

recruitmentRoutes.put('/stages/:id', asyncHandler(async (req, res) => {
    const stage = await prisma.hrRecruitmentStage.update({
        where: { id: parseInt(req.params.id) },
        data: req.body,
    });
    res.json(stage);
}));

recruitmentRoutes.delete('/stages/:id', asyncHandler(async (req, res) => {
    await prisma.hrRecruitmentStage.update({
        where: { id: parseInt(req.params.id) },
        data: { active: false },
    });
    res.json({ success: true });
}));

// ── Pipeline (kanban view) ────────────────────────────────────────────────────

recruitmentRoutes.get('/pipeline', asyncHandler(async (_req, res) => {
    const stages = await prisma.hrRecruitmentStage.findMany({
        where: { active: true },
        orderBy: { sequence: 'asc' },
        include: {
            applicants: {
                where: { active: true },
                include: { job: { select: { id: true, name: true } } },
                orderBy: { createdAt: 'desc' },
            },
        },
    });
    res.json(stages);
}));

// ── Applicants ────────────────────────────────────────────────────────────────

recruitmentRoutes.get('/', asyncHandler(async (req, res) => {
    const { skip, page, limit } = getPagination(req.query);
    const stageId = req.query.stageId ? parseInt(req.query.stageId as string) : undefined;
    const where: any = { active: true };
    if (stageId) where.stageId = stageId;
    const [data, total] = await Promise.all([
        prisma.hrApplicant.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: { job: true, department: true, recruitStage: { select: { id: true, name: true } } },
        }),
        prisma.hrApplicant.count({ where }),
    ]);
    res.json(paginatedResponse(data, total, page, limit));
}));

recruitmentRoutes.get('/:id', asyncHandler(async (req, res) => {
    const a = await prisma.hrApplicant.findUnique({
        where: { id: parseInt(req.params.id) },
        include: { job: true, department: true, recruitStage: { select: { id: true, name: true } } },
    });
    if (!a) throw AppError.notFound('Applicant');
    res.json(a);
}));

recruitmentRoutes.post('/', asyncHandler(async (req, res) => {
    const a = await prisma.hrApplicant.create({
        data: req.body,
        include: { job: true, department: true },
    });
    res.status(201).json(a);
}));

recruitmentRoutes.put('/:id', asyncHandler(async (req, res) => {
    const a = await prisma.hrApplicant.update({ where: { id: parseInt(req.params.id) }, data: req.body });
    res.json(a);
}));

// Move applicant to a new stage — triggers email notification via outbox
recruitmentRoutes.patch('/:id/stage', asyncHandler(async (req, res) => {
    const { stageId, stage } = req.body;
    const id = parseInt(req.params.id);

    const updateData: any = {};
    if (stageId) updateData.stageId = parseInt(stageId);
    if (stage) updateData.stage = stage;

    const a = await prisma.hrApplicant.update({
        where: { id },
        data: updateData,
        include: { job: true, recruitStage: { select: { id: true, name: true } } },
    });

    // Stage-change notification via transactional outbox (email.send relay)
    if (a.email) {
        await publishEvent({
            organizationId: req.user?.orgId ?? 'default',
            eventKey: 'email.send',
            payload: {
                to: a.email,
                templateKey: 'recruitment-stage-change',
                vars: {
                    applicantName: a.name,
                    jobName: a.job?.name ?? 'Position',
                    stageName: a.recruitStage?.name ?? stage ?? 'Next Stage',
                },
            },
        });
    }

    res.json(a);
}));

// Resume upload — stores URL (actual file storage delegated to Documents module / S3)
recruitmentRoutes.patch('/:id/resume', asyncHandler(async (req, res) => {
    const { resumeUrl } = req.body;
    if (!resumeUrl) throw AppError.validation('resumeUrl required');
    const a = await prisma.hrApplicant.update({
        where: { id: parseInt(req.params.id) },
        data: { resumeUrl },
    });
    res.json(a);
}));

recruitmentRoutes.delete('/:id', asyncHandler(async (req, res) => {
    await prisma.hrApplicant.update({ where: { id: parseInt(req.params.id) }, data: { active: false } });
    res.json({ success: true });
}));

// ── Chatter (shared thread per applicant) ─────────────────────────────────────
import { createChatterRouter } from '../core/chatter';
recruitmentRoutes.use('/', createChatterRouter('hr.applicant'));
