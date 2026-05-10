import { Router, Request } from 'express';
import prisma from '../lib/prisma';
import { requireAuth } from '../core/auth';
import { asyncHandler, getPagination, paginatedResponse } from '../lib/utils';

export const signRoutes = Router();
signRoutes.use(requireAuth);

// ── Helpers ────────────────────────────────────────────────────────────────────

function mapRequest(r: any) {
    return {
        id: r.id,
        document_title: r.documentTitle,
        document_url: r.documentUrl ?? '',
        status: r.status,
        created_at: r.createdAt.toISOString(),
        updated_at: r.updatedAt?.toISOString() ?? null,
        due_date: r.dueDate?.toISOString() ?? null,
        signers: (r.signers ?? []).map(mapSigner),
        created_by: r.createdBy,
        is_urgent: r.isUrgent,
        requires_witness: r.requiresWitness,
        witness_email: r.witnessEmail,
        witness_name: r.witnessName,
        witness_signed_at: r.witnessSignedAt?.toISOString() ?? null,
        witness_signature_data: r.witnessSignatureData,
        witness_ip_address: r.witnessIpAddress,
        message: r.message ?? '',
        metadata: r.metadata ?? {},
    };
}

function mapSigner(s: any) {
    return {
        id: s.id,
        name: s.name,
        email: s.email,
        role: s.role,
        status: s.status,
        signed_at: s.signedAt?.toISOString() ?? null,
        signature_data: s.signatureData,
        signature_method: s.signatureMethod,
        ip_address: s.ipAddress,
        verification_status: s.verificationStatus,
    };
}

const INCLUDE_SIGNERS = { signers: { orderBy: { id: 'asc' as const } } };

// ── GET /requests ─────────────────────────────────────────────────────────────
signRoutes.get('/requests', asyncHandler(async (req: Request, res) => {
    const { skip, page, limit } = getPagination(req.query);
    const status = req.query.status as string | undefined;
    const isUrgent = req.query.is_urgent === 'true' ? true
        : req.query.is_urgent === 'false' ? false : undefined;

    const where: any = {};
    if (status) where.status = status;
    if (isUrgent !== undefined) where.isUrgent = isUrgent;

    const [data, total] = await Promise.all([
        prisma.signRequest.findMany({
            where, skip, take: limit,
            orderBy: { createdAt: 'desc' },
            include: INCLUDE_SIGNERS,
        }),
        prisma.signRequest.count({ where }),
    ]);
    res.json(paginatedResponse(data.map(mapRequest), total, page, limit));
}));

// ── GET /requests/:id ─────────────────────────────────────────────────────────
signRoutes.get('/requests/:id', asyncHandler(async (req, res) => {
    const record = await prisma.signRequest.findUnique({
        where: { id: parseInt(req.params.id) },
        include: INCLUDE_SIGNERS,
    });
    if (!record) { res.status(404).json({ error: 'Not found' }); return; }
    res.json(mapRequest(record));
}));

// ── POST /requests ────────────────────────────────────────────────────────────
signRoutes.post('/requests', asyncHandler(async (req: Request, res) => {
    const {
        document_title, document_url, due_date, is_urgent = false,
        requires_witness = false, witness_email, witness_name,
        message, metadata, signers = [],
    } = req.body;

    if (!document_title) { res.status(400).json({ error: 'document_title required' }); return; }

    const userId = (req.user as any)?.id ?? null;
    const record = await prisma.signRequest.create({
        data: {
            documentTitle: document_title,
            documentUrl: document_url,
            dueDate: due_date ? new Date(due_date) : undefined,
            isUrgent: Boolean(is_urgent),
            requiresWitness: Boolean(requires_witness),
            witnessEmail: witness_email,
            witnessName: witness_name,
            message,
            metadata: metadata ?? {},
            createdBy: userId,
            status: signers.length > 0 ? 'in_progress' : 'pending',
            signers: {
                create: signers.map((s: any) => ({
                    name: s.name,
                    email: s.email,
                    role: s.role ?? 'other',
                    status: 'pending',
                })),
            },
        },
        include: INCLUDE_SIGNERS,
    });
    res.status(201).json(mapRequest(record));
}));

// ── PUT /requests/:id ─────────────────────────────────────────────────────────
signRoutes.put('/requests/:id', asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id);
    const {
        document_title, document_url, status, due_date,
        is_urgent, requires_witness, witness_email, witness_name, message, metadata,
    } = req.body;

    const existing = await prisma.signRequest.findUnique({ where: { id } });
    if (!existing) { res.status(404).json({ error: 'Not found' }); return; }

    const record = await prisma.signRequest.update({
        where: { id },
        data: {
            ...(document_title !== undefined && { documentTitle: document_title }),
            ...(document_url !== undefined && { documentUrl: document_url }),
            ...(status !== undefined && { status }),
            ...(due_date !== undefined && { dueDate: new Date(due_date) }),
            ...(is_urgent !== undefined && { isUrgent: Boolean(is_urgent) }),
            ...(requires_witness !== undefined && { requiresWitness: Boolean(requires_witness) }),
            ...(witness_email !== undefined && { witnessEmail: witness_email }),
            ...(witness_name !== undefined && { witnessName: witness_name }),
            ...(message !== undefined && { message }),
            ...(metadata !== undefined && { metadata }),
        },
        include: INCLUDE_SIGNERS,
    });
    res.json(mapRequest(record));
}));

// ── DELETE /requests/:id ──────────────────────────────────────────────────────
signRoutes.delete('/requests/:id', asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id);
    const existing = await prisma.signRequest.findUnique({ where: { id } });
    if (!existing) { res.status(404).json({ error: 'Not found' }); return; }
    await prisma.signRequest.delete({ where: { id } });
    res.json({ success: true });
}));

// ── PUT /requests/:id/sign  (signer submits their signature) ─────────────────
signRoutes.put('/requests/:id/sign', asyncHandler(async (req: Request, res) => {
    const requestId = parseInt(req.params.id);
    const { signer_id, signature_data, signature_method = 'draw' } = req.body;

    if (!signer_id || !signature_data) {
        res.status(400).json({ error: 'signer_id and signature_data required' });
        return;
    }

    const signerId = parseInt(signer_id);
    const ip = req.headers['x-forwarded-for']?.toString().split(',')[0]?.trim()
        ?? req.socket.remoteAddress
        ?? null;

    // Update the signer row
    const signer = await prisma.signSigner.updateMany({
        where: { id: signerId, requestId },
        data: {
            status: 'signed',
            signedAt: new Date(),
            signatureData: signature_data,
            signatureMethod: signature_method,
            ipAddress: ip,
            verificationStatus: 'verified',
        },
    });
    if (!signer.count) { res.status(404).json({ error: 'Signer not found' }); return; }

    // Check if all signers have signed → auto-complete the request
    const pending = await prisma.signSigner.count({
        where: { requestId, status: { not: 'signed' } },
    });
    if (pending === 0) {
        await prisma.signRequest.update({
            where: { id: requestId },
            data: { status: 'signed' },
        });
    }

    const record = await prisma.signRequest.findUnique({
        where: { id: requestId },
        include: INCLUDE_SIGNERS,
    });
    res.json(mapRequest(record!));
}));

// ── POST /requests/:id/signers  (add a signer to an existing request) ────────
signRoutes.post('/requests/:id/signers', asyncHandler(async (req, res) => {
    const requestId = parseInt(req.params.id);
    const { name, email, role = 'other' } = req.body;
    if (!name || !email) { res.status(400).json({ error: 'name and email required' }); return; }

    const signer = await prisma.signSigner.create({
        data: { requestId, name, email, role, status: 'pending' },
    });
    // Move request to in_progress if it was pending
    await prisma.signRequest.updateMany({
        where: { id: requestId, status: 'pending' },
        data: { status: 'in_progress' },
    });
    res.status(201).json(mapSigner(signer));
}));
