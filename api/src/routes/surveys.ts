import { Router } from 'express';
import prisma from '../lib/prisma';
import { asyncHandler, getPagination, paginatedResponse } from '../lib/utils';
import { requireAuth } from '../core/auth';
import { AppError } from '../core/errors';
import { randomBytes } from 'crypto';

export const surveyRoutes = Router();

// ── Public portal route with access token (no auth) ───────────────────────────
surveyRoutes.get('/portal/:token', asyncHandler(async (req, res) => {
    const s = await prisma.survey.findUnique({
        where: { accessToken: req.params.token },
        include: { questions: { orderBy: { sequence: 'asc' }, include: { answers: { orderBy: { sequence: 'asc' } } } } },
    });
    if (!s || s.state !== 'open') {
        res.status(404).json({ error: 'Survey not found or not open' });
        return;
    }
    res.json({ id: s.id, title: s.title, description: s.description, questions: s.questions });
}));

surveyRoutes.post('/portal/:token/submit', asyncHandler(async (req, res) => {
    const s = await prisma.survey.findUnique({ where: { accessToken: req.params.token } });
    if (!s || s.state !== 'open') {
        res.status(404).json({ error: 'Survey not found or not open' });
        return;
    }
    const { email } = req.body;
    const input = await prisma.surveyUserInput.create({
        data: { surveyId: s.id, email: email ?? null, state: 'done', endDatetime: new Date() },
    });
    res.status(201).json({ inputId: input.id });
}));

// ── Public route (no auth) — participate in a survey ─────────────────────────
surveyRoutes.get('/public/:id', asyncHandler(async (req, res) => {
    const s = await prisma.survey.findUnique({
        where: { id: parseInt(req.params.id) },
        include: { questions: { where: {}, orderBy: { sequence: 'asc' }, include: { answers: { orderBy: { sequence: 'asc' } } } } },
    });
    if (!s || s.state !== 'open') {
        res.status(404).json({ error: 'Survey not found or not open' });
        return;
    }
    // Strip internal-only fields
    res.json({ id: s.id, title: s.title, description: s.description, questions: s.questions });
}));

surveyRoutes.post('/public/:id/submit', asyncHandler(async (req, res) => {
    const surveyId = parseInt(req.params.id);
    const s = await prisma.survey.findUnique({ where: { id: surveyId } });
    if (!s || s.state !== 'open') {
        res.status(404).json({ error: 'Survey not found or not open' });
        return;
    }
    const { email, answers } = req.body;
    const input = await prisma.surveyUserInput.create({
        data: {
            surveyId,
            email: email ?? null,
            state: 'done',
            endDatetime: new Date(),
        },
    });
    res.status(201).json({ inputId: input.id });
}));

// ── Authenticated routes ──────────────────────────────────────────────────────
surveyRoutes.use(requireAuth);

surveyRoutes.get('/', asyncHandler(async (req, res) => {
    const { skip, page, limit } = getPagination(req.query);
    const [data, total] = await Promise.all([
        prisma.survey.findMany({
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: { _count: { select: { questions: true, responses: true } } },
        }),
        prisma.survey.count(),
    ]);
    res.json(paginatedResponse(data, total, page, limit));
}));

surveyRoutes.get('/:id', asyncHandler(async (req, res) => {
    const s = await prisma.survey.findUnique({
        where: { id: parseInt(req.params.id) },
        include: {
            questions: { orderBy: { sequence: 'asc' }, include: { answers: { orderBy: { sequence: 'asc' } } } },
            responses: true,
        },
    });
    if (!s) throw AppError.notFound('Survey');
    res.json(s);
}));

surveyRoutes.post('/', asyncHandler(async (req, res) => {
    const s = await prisma.survey.create({
        data: { ...req.body, accessToken: randomBytes(16).toString('hex') },
    });
    res.status(201).json(s);
}));

surveyRoutes.put('/:id', asyncHandler(async (req, res) => {
    const s = await prisma.survey.update({ where: { id: parseInt(req.params.id) }, data: req.body });
    res.json(s);
}));

surveyRoutes.patch('/:id/publish', requireAuth, asyncHandler(async (req, res) => {
    const s = await prisma.survey.update({ where: { id: parseInt(req.params.id) }, data: { state: 'open' } });
    res.json(s);
}));

surveyRoutes.patch('/:id/close', requireAuth, asyncHandler(async (req, res) => {
    const s = await prisma.survey.update({ where: { id: parseInt(req.params.id) }, data: { state: 'closed' } });
    res.json(s);
}));

surveyRoutes.delete('/:id', asyncHandler(async (req, res) => {
    await prisma.survey.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ success: true });
}));

// ── Questions ─────────────────────────────────────────────────────────────────

surveyRoutes.post('/:id/questions', asyncHandler(async (req, res) => {
    const { title, questionType, sequence, isRequired, answers } = req.body;
    if (!title) throw AppError.validation('title required');
    const q = await prisma.surveyQuestion.create({
        data: {
            surveyId: parseInt(req.params.id),
            title,
            questionType: questionType ?? 'text_box',
            sequence: sequence ?? 10,
            isRequired: isRequired ?? false,
            answers: answers?.length
                ? { create: answers.map((a: { value: string; sequence?: number; isCorrect?: boolean }) => ({ value: a.value, sequence: a.sequence ?? 10, isCorrect: a.isCorrect ?? false })) }
                : undefined,
        },
        include: { answers: true },
    });
    res.status(201).json(q);
}));

surveyRoutes.put('/questions/:qId', asyncHandler(async (req, res) => {
    const { answers, ...rest } = req.body;
    const q = await prisma.surveyQuestion.update({
        where: { id: parseInt(req.params.qId) },
        data: rest,
        include: { answers: true },
    });
    res.json(q);
}));

surveyRoutes.delete('/questions/:qId', asyncHandler(async (req, res) => {
    await prisma.surveyQuestion.delete({ where: { id: parseInt(req.params.qId) } });
    res.json({ success: true });
}));

// ── Answer options ────────────────────────────────────────────────────────────

surveyRoutes.post('/questions/:qId/answers', asyncHandler(async (req, res) => {
    const ans = await prisma.surveyAnswer.create({
        data: { ...req.body, questionId: parseInt(req.params.qId) },
    });
    res.status(201).json(ans);
}));

surveyRoutes.delete('/answers/:aId', asyncHandler(async (req, res) => {
    await prisma.surveyAnswer.delete({ where: { id: parseInt(req.params.aId) } });
    res.json({ success: true });
}));

// ── Results / analytics ───────────────────────────────────────────────────────

surveyRoutes.get('/:id/results', asyncHandler(async (req, res) => {
    const surveyId = parseInt(req.params.id);
    const survey = await prisma.survey.findUnique({
        where: { id: surveyId },
        include: { questions: { orderBy: { sequence: 'asc' }, include: { answers: { orderBy: { sequence: 'asc' } } } } },
    });
    if (!survey) throw AppError.notFound('Survey');

    const responseCount = await prisma.surveyUserInput.count({ where: { surveyId } });

    // Return question structure with answer options for UI rendering.
    // Detailed per-answer counts require a UserInputLine model (future work).
    const questionStats = survey.questions.map(q => ({
        questionId: q.id,
        title: q.title,
        questionType: q.questionType,
        totalAnswers: 0,
        options: ['multiple_choice', 'multiple_choice_multi'].includes(q.questionType)
            ? q.answers.map(a => ({ label: a.value, count: 0 }))
            : undefined,
        numericAvg: null,
        numericMin: null,
        numericMax: null,
    }));

    res.json({
        surveyId,
        title: survey.title,
        state: survey.state,
        totalResponses: responseCount,
        questions: questionStats,
    });
}));

// Submit response (authenticated)
surveyRoutes.post('/:id/respond', asyncHandler(async (req, res) => {
    const r = await prisma.surveyUserInput.create({
        data: { ...req.body, surveyId: parseInt(req.params.id) },
    });
    res.status(201).json(r);
}));
