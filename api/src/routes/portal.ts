/**
 * Portal routes — unauthenticated public access using short-lived signed tokens.
 *
 * Architecture: ADR-0015 — Portal Access Layer
 *
 * Token format: base64url( JSON({ resourceType, resourceId, exp }) ) + "." + HMAC-SHA256 signature
 * env var required: PORTAL_SECRET (min 32 chars)
 *
 * Supported resources:
 *   - invoices  → GET /api/portal/invoices/:token
 */

import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import prisma from '../lib/prisma';
import { asyncHandler } from '../lib/utils';

export const portalRoutes = Router();

const PORTAL_SECRET = process.env.PORTAL_SECRET || 'change-me-in-production-32chars!';

// ── Token helpers ─────────────────────────────────────────────────────────────

function signToken(payload: object): string {
    const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const sig = crypto.createHmac('sha256', PORTAL_SECRET).update(data).digest('base64url');
    return `${data}.${sig}`;
}

function verifyToken(token: string): { resourceType: string; resourceId: number | string; exp: number } | null {
    const [data, sig] = token.split('.');
    if (!data || !sig) return null;
    const expected = crypto.createHmac('sha256', PORTAL_SECRET).update(data).digest('base64url');
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
    try {
        const payload = JSON.parse(Buffer.from(data, 'base64url').toString());
        if (payload.exp < Date.now()) return null; // expired
        return payload;
    } catch {
        return null;
    }
}

// ── Token generation (internal — call from authenticated routes) ──────────────

/**
 * POST /api/portal/token  (auth required — call from invoicing controller)
 * Body: { resourceType: 'invoice', resourceId: number, ttlHours?: number }
 */
import { requireAuth } from '../core/auth';

portalRoutes.post('/token', requireAuth, asyncHandler(async (req: Request, res: Response) => {
    const { resourceType, resourceId, ttlHours = 72 } = req.body;
    if (!resourceType || !resourceId) {
        res.status(400).json({ error: 'resourceType and resourceId are required' });
        return;
    }
    const token = signToken({ resourceType, resourceId, exp: Date.now() + ttlHours * 3_600_000 });
    res.json({ token, url: `/portal/${resourceType}s/${token}` });
}));

// ── Public invoice view ───────────────────────────────────────────────────────

/**
 * GET /api/portal/invoices/:token
 * Returns a minimal public view of an invoice (no auth required).
 */
portalRoutes.get('/invoices/:token', asyncHandler(async (req: Request, res: Response) => {
    const payload = verifyToken(req.params.token);
    if (!payload || payload.resourceType !== 'invoice') {
        res.status(401).json({ error: 'Invalid or expired token' });
        return;
    }

    const invoice = await prisma.accountMove.findUnique({
        where: { id: Number(payload.resourceId) },
        include: {
            partner: { select: { name: true, email: true, phone: true } },
            lines: { select: { name: true, quantity: true, priceUnit: true, priceSubtotal: true } },
        },
    });

    if (!invoice) { res.status(404).json({ error: 'Invoice not found' }); return; }

    // Return a public-safe subset only
    res.json({
        id: invoice.id,
        name: invoice.name,
        state: invoice.state,
        invoiceDate: invoice.date,
        invoiceDateDue: invoice.dueDate,
        amountUntaxed: invoice.amountUntaxed,
        amountTax: invoice.amountTax,
        amountTotal: invoice.amountTotal,
        amountResidual: invoice.amountResidual,
        partner: invoice.partner,
        lines: invoice.lines,
    });
}));
