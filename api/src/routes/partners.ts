import { Router } from 'express';
import prisma from '../lib/prisma';
import { asyncHandler, getPagination, paginatedResponse } from '../lib/utils';

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
            include: { parent: true, tags: true },
        }),
        prisma.partner.count({ where }),
    ]);

    res.json(paginatedResponse(data, total, page, limit));
}));

// ── GET /partners/:id/profile  — 360° aggregated view ───────
partnerRoutes.get('/:id/profile', asyncHandler(async (req, res) => {
    const id = req.params.id;

    const partner = await prisma.partner.findFirst({
        where: { id, active: true },
        include: {
            parent: true,
            children: { where: { active: true }, take: 20 },
            tags: true,
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
        partner,
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
        include: { parent: true, children: true, tags: true },
    });
    if (!partner) {
        res.status(404).json({ error: 'Partner not found' });
        return;
    }
    res.json(partner);
}));

// ── Create partner ───────────────────────────────────────────
partnerRoutes.post('/', asyncHandler(async (req, res) => {
    const partner = await prisma.partner.create({ data: req.body });
    res.status(201).json(partner);
}));

// ── Update partner ───────────────────────────────────────────
partnerRoutes.put('/:id', asyncHandler(async (req, res) => {
    const partner = await prisma.partner.update({
        where: { id: req.params.id },
        data: req.body,
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
