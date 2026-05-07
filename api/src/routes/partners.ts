import { Router } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { asyncHandler, getPagination, paginatedResponse } from '../lib/utils';
import { validate } from '../core/validation';
import { requireAuth } from '../core/auth';

// ── Validation schemas ────────────────────────────────────────────────────────

const CreatePartnerSchema = z.object({
    name: z.string().min(1, 'Name is required').max(200).trim(),
    email: z.string().email('Invalid email').optional().nullable(),
    phone: z.string().max(50).optional().nullable(),
    mobile: z.string().max(50).optional().nullable(),
    website: z.string().url('Invalid URL').optional().nullable(),
    isCompany: z.boolean().optional().default(false),
    isCustomer: z.boolean().optional().default(true),
    isVendor: z.boolean().optional().default(false),
    isEmployee: z.boolean().optional().default(false),
    street: z.string().max(200).optional().nullable(),
    city: z.string().max(100).optional().nullable(),
    state: z.string().max(100).optional().nullable(),
    zip: z.string().max(20).optional().nullable(),
    country: z.string().max(2).optional().nullable(),
    parentId: z.string().optional().nullable(),
    organizationId: z.string().optional(),
    companyId: z.string().optional().nullable(),
    notes: z.string().max(5000).optional().nullable(),
});

const UpdatePartnerSchema = CreatePartnerSchema.partial();

/** Flatten the PartnerToPartnerTag join rows into plain tag objects */
function flattenTags(raw: any[]): any[] {
    return (raw ?? []).map((row: any) => row.partner_tags ?? row);
}

/** Shared include for partner queries */
const PARTNER_INCLUDE = {
    parent: true,
    tags: { include: { partner_tags: true } },
} as const;

export const partnerRoutes = Router();
partnerRoutes.use(requireAuth);

// ── List partners ────────────────────────────────────────────
partnerRoutes.get('/', asyncHandler(async (req, res) => {
    const { skip, page, limit } = getPagination(req.query);
    const search = (req.query.search as string) || '';
    const type = req.query.type as string;
    const isCompany = req.query.is_company;

    const where: any = { active: true };
    if (search) {
        where.OR = [
            { name: { contains: search } },
            { email: { contains: search } },
            { phone: { contains: search } },
        ];
    }
    if (type) where.type = type;
    if (isCompany !== undefined) where.isCompany = isCompany === 'true';

    const [data, total] = await Promise.all([
        prisma.partner.findMany({
            where,
            skip,
            take: limit,
            orderBy: { name: 'asc' },
            include: PARTNER_INCLUDE,
        }),
        prisma.partner.count({ where }),
    ]);

    const mapped = data.map((p: any) => ({ ...p, tags: flattenTags(p.tags) }));
    res.json(paginatedResponse(mapped, total, page, limit));
}));

// ── GET /partners/:id/profile  — 360° aggregated view ───────
partnerRoutes.get('/:id/profile', asyncHandler(async (req, res) => {
    const id = req.params.id;

    const partner = await prisma.partner.findFirst({
        where: { id, active: true },
        include: {
            parent: true,
            children: { where: { active: true }, take: 20 },
            tags: { include: { partner_tags: true } },
        },
    });

    if (!partner) {
        res.status(404).json({ error: 'Partner not found' });
        return;
    }

    // Helper: safely call an optional Prisma delegate method, returning [] on
    // any failure or when the model/method doesn't yet exist in the client.
    const safeFind = (promise: unknown): Promise<unknown[]> =>
        Promise.resolve(promise).then(r => (r as unknown[] | undefined) ?? []).catch(() => []);

    // Fetch related data in parallel for performance
    const [
        addresses,
        contacts,
        crmLeads,
        saleOrders,
        purchaseOrders,
        invoices,
        helpdesk,
        timeline,
        activities,
        documents,
    ] = await Promise.all([
        safeFind((prisma as any).spinePartnerAddress?.findMany?.({
            where: { partnerId: id },
        })),

        safeFind((prisma as any).spinePartnerContact?.findMany?.({
            where: { partnerId: id },
        })),

        safeFind(prisma.crmLead.findMany({
            where: { partnerId: id },
            orderBy: { createdAt: 'desc' },
            take: 10,
            select: { id: true, name: true, stage: true, probability: true, expectedRevenue: true, createdAt: true },
        })),

        safeFind(prisma.saleOrder.findMany({
            where: { partnerId: id },
            orderBy: { createdAt: 'desc' },
            take: 10,
            select: { id: true, name: true, state: true, amountTotal: true, createdAt: true },
        })),

        safeFind(prisma.purchaseOrder.findMany({
            where: { partnerId: id },
            orderBy: { createdAt: 'desc' },
            take: 10,
            select: { id: true, name: true, state: true, amountTotal: true, createdAt: true },
        })),

        safeFind((prisma as any).accountMove?.findMany?.({
            where: { partnerId: id, moveType: { in: ['out_invoice', 'in_invoice', 'out_refund'] } },
            orderBy: { createdAt: 'desc' },
            take: 10,
            select: { id: true, name: true, moveType: true, state: true, amountTotal: true, invoiceDate: true, invoiceDateDue: true },
        })),

        safeFind((prisma as any).helpdeskTicket?.findMany?.({
            where: { partnerId: id },
            orderBy: { createdAt: 'desc' },
            take: 10,
            select: { id: true, name: true, priority: true, stage: true, createdAt: true },
        })),

        safeFind((prisma as any).timelineEvent?.findMany?.({
            where: { model: 'Partner', recordId: id },
            orderBy: { createdAt: 'desc' },
            take: 30,
        })),

        safeFind((prisma as any).activity?.findMany?.({
            where: { partnerId: id },
            orderBy: { dueDate: 'asc' },
            take: 10,
        })),

        safeFind((prisma as any).spineDocument?.findMany?.({
            where: { partnerId: id },
            orderBy: { createdAt: 'desc' },
            take: 10,
        })),
    ]);

    // Compute summary KPIs
    const saleTotal = (saleOrders as any[]).reduce((s: number, o: any) => s + (o.amountTotal ?? 0), 0);
    const purchaseTotal = (purchaseOrders as any[]).reduce((s: number, o: any) => s + (o.amountTotal ?? 0), 0);
    const openLeads = (crmLeads as any[]).filter((l: any) => l.stage !== 'won' && l.stage !== 'lost').length;
    const openTickets = (helpdesk as any[]).filter((t: any) => t.stage !== 'done' && t.stage !== 'closed').length;

    res.json({
        partner: { ...(partner as any), tags: flattenTags((partner as any).tags) },
        addresses,
        contacts,
        summary: {
            saleOrderCount: (saleOrders as any[]).length,
            saleTotal,
            purchaseOrderCount: (purchaseOrders as any[]).length,
            purchaseTotal,
            openLeads,
            openTickets,
            invoiceCount: (invoices as any[]).length,
        },
        crm: crmLeads,
        sales: saleOrders,
        purchases: purchaseOrders,
        invoices,
        helpdesk,
        activities,
        documents,
        timeline,
    });
}));

// ── GET /partners/:id ────────────────────────────────────────
partnerRoutes.get('/:id', asyncHandler(async (req, res) => {
    const partner = await prisma.partner.findFirst({
        where: { id: req.params.id },
        include: {
            parent: true,
            children: { include: { tags: { include: { partner_tags: true } } } },
            tags: { include: { partner_tags: true } },
        },
    });
    if (!partner) {
        res.status(404).json({ error: 'Partner not found' });
        return;
    }
    res.json({
        ...partner,
        tags: flattenTags((partner as any).tags),
        children: ((partner as any).children ?? []).map((c: any) => ({
            ...c,
            tags: flattenTags(c.tags),
        })),
    });
}));

// ── Create partner ───────────────────────────────────────────
partnerRoutes.post('/', validate(CreatePartnerSchema), asyncHandler(async (req, res) => {
    const data = req.body as z.infer<typeof CreatePartnerSchema>;
    const partner = await prisma.partner.create({ data: data as any });
    res.status(201).json(partner);
}));

// ── Update partner ───────────────────────────────────────────
partnerRoutes.put('/:id', validate(UpdatePartnerSchema), asyncHandler(async (req, res) => {
    const data = req.body as z.infer<typeof UpdatePartnerSchema>;
    const partner = await prisma.partner.update({
        where: { id: req.params.id },
        data: data as any,
    });
    res.json(partner);
}));

// ── Archive (soft delete) ────────────────────────────────────
partnerRoutes.delete('/:id', asyncHandler(async (req, res) => {
    await prisma.partner.update({
        where: { id: req.params.id },
        data: { active: false },
    });
    res.json({ success: true });
}));
