/**
 * flow.service.ts — Phase 3 End-to-End Business Flow Service Layer
 *
 * Implements all 5 business flows as pure async functions that operate
 * within Prisma transactions. Routes stay thin; all state-machine logic
 * lives here.
 *
 * Flows:
 *  A  Lead → Qualified → Opportunity → Won → Quotation → SaleOrder(CONFIRMED)
 *  B  SaleOrder(CONFIRMED) → Picking(DRAFT→READY→DONE) → SaleOrder(DELIVERED)
 *  C  SaleOrder(DELIVERED) → Invoice(DRAFT→POSTED) → Payment → Reconciled
 *  D  RFQ → PO(CONFIRMED) → Receipt(DONE) → VendorBill(POSTED) → Payment
 *  E  Ticket → Task → Timesheet → SaleOrderLine(billable)
 */

import prisma from '../lib/prisma';
import { AppError } from './errors';
import { nextval } from './sequence';
import { emitTimeline } from './timeline';

/** Ensure the request is idempotent. Returns existing record or null. */
async function checkIdempotency<T>(
    model: { findUnique: (args: any) => Promise<T | null> },
    idempotencyKey: string | undefined,
    where: object,
): Promise<T | null> {
    if (!idempotencyKey) return null;
    return model.findUnique({ where });
}

// ── FLOW A helpers ─────────────────────────────────────────────────────────────

export async function qualifyLead(leadId: number) {
    const lead = await prisma.crmLead.findUnique({ where: { id: leadId } });
    if (!lead) throw AppError.notFound('CRM Lead');
    if (lead.type === 'opportunity') throw AppError.conflict('Lead is already an opportunity');

    return prisma.crmLead.update({
        where: { id: leadId },
        data: { type: 'opportunity', probability: Math.max(lead.probability, 20) },
        include: { stage: true, partner: true },
    });
}

export async function markWon(leadId: number) {
    const lead = await prisma.crmLead.findUnique({ where: { id: leadId } });
    if (!lead) throw AppError.notFound('CRM Lead');
    if (!lead.active) throw AppError.conflict('Lead is already closed');

    return prisma.crmLead.update({
        where: { id: leadId },
        data: {
            type: 'opportunity',
            probability: 100,
            dateClosed: new Date(),
        },
        include: { stage: true, partner: true, saleOrders: true },
    });
}

/** Create a draft quotation from a won/qualified CRM lead. */
export async function createQuotationFromLead(
    leadId: number,
    payload: {
        lines?: Array<{ name: string; productId?: string; productQty?: number; priceUnit?: number }>;
        idempotencyKey?: string;
    } = {},
) {
    const lead = await prisma.crmLead.findUnique({
        where: { id: leadId },
        include: { partner: true },
    });
    if (!lead) throw AppError.notFound('CRM Lead');
    if (!lead.partnerId) throw AppError.validation('Lead must have a customer before creating a quotation');

    // Idempotency: if we already created a quotation with this key return it
    if (payload.idempotencyKey) {
        const existing = await prisma.saleOrder.findUnique({
            where: { idempotencyKey: payload.idempotencyKey },
            include: { partner: true, lines: true },
        });
        if (existing) return existing;
    }

    const soName = await nextval('sale.order').catch(() => `SO-ERR`);
    const lines = payload.lines ?? [];
    let amountUntaxed = 0;
    const computedLines = lines.map((l, i) => {
        const qty = l.productQty ?? 1;
        const price = l.priceUnit ?? 0;
        const sub = qty * price;
        amountUntaxed += sub;
        return {
            sequence: (i + 1) * 10,
            name: l.name,
            productId: l.productId,
            productQty: qty,
            priceUnit: price,
            priceSubtotal: sub,
            priceTotal: sub * 1.2,
        };
    });
    const amountTax = amountUntaxed * 0.2;

    return prisma.saleOrder.create({
        data: {
            name: soName,
            state: 'draft',
            partnerId: lead.partnerId,
            crmLeadId: leadId,
            organizationId: lead.organizationId,
            idempotencyKey: payload.idempotencyKey,
            amountUntaxed,
            amountTax,
            amountTotal: amountUntaxed + amountTax,
            lines: { create: computedLines },
        },
        include: { partner: true, lines: true },
    });
}

// ── FLOW B helpers ─────────────────────────────────────────────────────────────

/** Confirm a sale order: state=sale, auto-create a delivery picking. */
export async function confirmSaleOrder(orderId: number, idempotencyKey?: string) {
    const order = await prisma.saleOrder.findUnique({
        where: { id: orderId },
        include: { lines: { include: { product: true } } },
    });
    if (!order) throw AppError.notFound('Sale Order');
    if (order.state === 'sale') return order; // idempotent
    if (order.state === 'cancel') throw AppError.conflict('Cancelled orders cannot be confirmed');

    // Find a default delivery picking type (OUT)
    const pickingType = await prisma.stockPickingType.findFirst({
        where: { code: 'outgoing' },
    });
    if (!pickingType) throw AppError.conflict('No outgoing picking type configured. Set up a warehouse first.');

    // Also get an atomic picking name before the transaction
    const pickName = await nextval('stock.picking.out').catch(
        () => `${pickingType.sequenceCode ?? 'WH/OUT'}${String(Date.now()).slice(-5)}`
    );

    const result = await prisma.$transaction(async (tx) => {
        await tx.saleOrder.update({ where: { id: orderId }, data: { state: 'sale' } });

        await tx.stockPicking.create({
            data: {
                name: pickName,
                state: 'draft',
                pickingTypeId: pickingType.id,
                locationId: pickingType.defaultLocationSrcId ?? undefined,
                locationDestId: pickingType.defaultLocationDestId ?? undefined,
                saleOrderId: orderId,
                partnerId: order.partnerId,
                moves: {
                    create: order.lines
                        .filter((l) => l.productId)
                        .map((l) => ({
                            name: l.name,
                            productId: l.productId!,
                            productQty: l.productQty,
                            qtyDone: 0,
                            locationId: pickingType.defaultLocationSrcId ?? 1,
                            locationDestId: pickingType.defaultLocationDestId ?? 1,
                        })),
                },
            },
        });

        return tx.saleOrder.findUnique({
            where: { id: orderId },
            include: { partner: true, lines: true, pickings: true },
        });
    });

    // Emit timeline after the transaction commits
    void emitTimeline({
        organizationId: order.organizationId ?? '',
        model: 'SaleOrder',
        recordId: String(orderId),
        type: 'STATUS_CHANGE',
        message: `Sales order ${order.name} confirmed — delivery ${pickName} created`,
        partnerId: order.partnerId ?? null,
    });

    return result;
}

export async function markPickingReady(pickingId: number) {
    const picking = await prisma.stockPicking.findUnique({ where: { id: pickingId } });
    if (!picking) throw AppError.notFound('Stock Picking');
    if (!['draft', 'waiting', 'confirmed'].includes(picking.state)) {
        throw AppError.conflict(`Picking cannot transition from '${picking.state}' to ready`);
    }
    return prisma.stockPicking.update({
        where: { id: pickingId },
        data: { state: 'assigned' },
        include: { moves: true },
    });
}

export async function validatePicking(pickingId: number) {
    const picking = await prisma.stockPicking.findUnique({
        where: { id: pickingId },
        include: { moves: true },
    });
    if (!picking) throw AppError.notFound('Stock Picking');
    if (picking.state === 'done') return picking; // idempotent
    if (picking.state !== 'assigned') {
        throw AppError.conflict(`Picking must be in 'assigned' state to validate (current: '${picking.state}')`);
    }

    const result = await prisma.$transaction(async (tx) => {
        // Mark all moves done
        await tx.stockMove.updateMany({
            where: { pickingId },
            data: { state: 'done', qtyDone: { /* use productQty proxy */ } as any },
        });

        // Set moves qtyDone = productQty
        const moves = picking.moves;
        for (const move of moves) {
            await tx.stockMove.update({
                where: { id: move.id },
                data: { state: 'done', qtyDone: move.productQty },
            });
        }

        const donePicking = await tx.stockPicking.update({
            where: { id: pickingId },
            data: { state: 'done', dateDone: new Date() },
            include: { moves: true },
        });

        // If linked to a sale order, mark delivered
        if ((picking as any).saleOrderId) {
            await tx.saleOrder.update({
                where: { id: (picking as any).saleOrderId },
                data: { state: 'done' },
            });
        }

        return donePicking;
    });

    void emitTimeline({
        organizationId: (picking as any).organizationId ?? '',
        model: 'StockPicking',
        recordId: String(pickingId),
        type: 'STATUS_CHANGE',
        message: `Picking ${picking.name} validated — all moves done`,
        partnerId: (picking as any).partnerId ?? null,
    });

    return result;
}

// ── FLOW C helpers ─────────────────────────────────────────────────────────────

/** Create a customer invoice from a confirmed/delivered sale order (idempotent). */
export async function createSaleInvoice(orderId: number, idempotencyKey?: string) {
    if (idempotencyKey) {
        const existing = await prisma.accountMove.findUnique({
            where: { idempotencyKey },
            include: { partner: true, lines: true },
        });
        if (existing) return existing;
    }

    const order = await prisma.saleOrder.findUnique({
        where: { id: orderId },
        include: { lines: true },
    });
    if (!order) throw AppError.notFound('Sale Order');
    if (!['sale', 'done'].includes(order.state)) {
        throw AppError.conflict('Only confirmed or delivered sale orders can be invoiced');
    }

    let journal = await prisma.accountJournal.findFirst({ where: { type: 'sale', active: true } });
    if (!journal) {
        journal = await prisma.accountJournal.create({
            data: { name: 'Customer Invoices', code: 'INV', type: 'sale' },
        });
    }

    const invName = await nextval('account.move.out_invoice').catch(() => `INV-ERR`);
    return prisma.accountMove.create({
        data: {
            name: invName,
            moveType: 'out_invoice',
            state: 'draft',
            amountUntaxed: order.amountUntaxed,
            amountTax: order.amountTax,
            amountTotal: order.amountTotal,
            amountResidual: order.amountTotal,
            organizationId: order.organizationId,
            journalId: journal.id,
            partnerId: order.partnerId,
            saleOrderId: order.id,
            idempotencyKey,
            lines: {
                create: [
                    { name: `A/R – ${order.name}`, debit: order.amountTotal, credit: 0, balance: order.amountTotal },
                    { name: `Revenue – ${order.name}`, debit: 0, credit: order.amountUntaxed, balance: -order.amountUntaxed },
                    ...(order.amountTax > 0
                        ? [{ name: `Tax 20% – ${order.name}`, debit: 0, credit: order.amountTax, balance: -order.amountTax }]
                        : []),
                ],
            },
        },
        include: { partner: true, lines: true },
    });
}

/** Post (confirm) an invoice — immutable once posted. */
export async function postInvoice(moveId: number) {
    const move = await prisma.accountMove.findUnique({
        where: { id: moveId },
        include: { lines: true },
    });
    if (!move) throw AppError.notFound('Invoice');
    if (move.state === 'posted') throw AppError.conflict('Invoice is already posted and cannot be modified');
    if (move.lines.length === 0) throw AppError.validation('Cannot post an empty invoice');

    const totalDebit = move.lines.reduce((s: number, l: any) => s + (l.debit || 0), 0);
    const totalCredit = move.lines.reduce((s: number, l: any) => s + (l.credit || 0), 0);
    if (Math.abs(totalDebit - totalCredit) > 0.001) {
        throw AppError.validation(
            `Debits (${totalDebit.toFixed(2)}) must equal Credits (${totalCredit.toFixed(2)})`,
        );
    }

    const posted = await prisma.accountMove.update({
        where: { id: moveId },
        data: { state: 'posted', postedAt: new Date() },
        include: { partner: true, lines: true, journal: true },
    });

    void emitTimeline({
        organizationId: move.organizationId ?? '',
        model: 'AccountMove',
        recordId: String(moveId),
        type: 'STATUS_CHANGE',
        message: `${move.moveType === 'out_invoice' ? 'Invoice' : 'Bill'} ${move.name} posted — amount €${move.amountTotal.toFixed(2)}`,
        partnerId: move.partnerId ?? null,
    });

    return posted;
}

/** Register a payment against a posted invoice (idempotent). */
export async function registerPayment(
    moveId: number,
    payload: {
        amount: number;
        journalId?: number;
        memo?: string;
        idempotencyKey?: string;
    },
) {
    if (payload.idempotencyKey) {
        const existing = await prisma.accountPayment.findUnique({
            where: { idempotencyKey: payload.idempotencyKey },
        });
        if (existing) return existing;
    }

    const move = await prisma.accountMove.findUnique({
        where: { id: moveId },
        include: { journal: true },
    });
    if (!move) throw AppError.notFound('Invoice');
    if (move.state !== 'posted') throw AppError.conflict('Invoice must be posted before registering payment');

    // Default to a bank/cash journal if not specified
    let journalId = payload.journalId;
    if (!journalId) {
        const bankJournal = await prisma.accountJournal.findFirst({
            where: { type: { in: ['bank', 'cash'] }, active: true },
        });
        if (!bankJournal) throw AppError.conflict('No bank or cash journal configured');
        journalId = bankJournal.id;
    }

    const paymentType = move.moveType === 'out_invoice' ? 'inbound' : 'outbound';
    const partnerType = move.moveType === 'out_invoice' ? 'customer' : 'supplier';

    const paySeqKey = move.moveType === 'out_invoice' ? 'account.payment.customer' : 'account.payment.vendor';
    const payName = await nextval(paySeqKey).catch(() => `PAY-ERR`);
    const payment = await prisma.$transaction(async (tx) => {
        const payment = await tx.accountPayment.create({
            data: {
                name: payName,
                moveType: move.moveType,
                paymentType,
                partnerType,
                state: 'posted',
                date: new Date(),
                amount: payload.amount,
                memo: payload.memo,
                journalId,
                partnerId: move.partnerId,
                moveId,
                idempotencyKey: payload.idempotencyKey,
            },
        });

        // Update residual on the invoice
        const newResidual = Math.max(0, (move.amountResidual || 0) - payload.amount);
        const newPaymentState = newResidual <= 0.001 ? 'paid' : 'partial';
        await tx.accountMove.update({
            where: { id: moveId },
            data: { amountResidual: newResidual, paymentState: newPaymentState },
        });

        return payment;
    });

    void emitTimeline({
        organizationId: move.organizationId ?? '',
        model: 'AccountPayment',
        recordId: String(payment?.id ?? 0),
        type: 'PAYMENT_RECEIVED',
        message: `Payment ${payName} registered — €${payload.amount.toFixed(2)} against ${move.name}`,
        partnerId: move.partnerId ?? null,
    });

    return payment;
}

// ── FLOW D helpers ─────────────────────────────────────────────────────────────

/** Confirm a Purchase Order (RFQ → PO): creates an incoming receipt picking. */
export async function confirmPurchaseOrder(orderId: number) {
    const order = await prisma.purchaseOrder.findUnique({
        where: { id: orderId },
        include: { lines: { include: { product: true } } },
    });
    if (!order) throw AppError.notFound('Purchase Order');
    if (order.state === 'purchase') return order; // idempotent
    if (order.state === 'cancel') throw AppError.conflict('Cancelled POs cannot be confirmed');

    const pickingType = await prisma.stockPickingType.findFirst({ where: { code: 'incoming' } });
    if (!pickingType) throw AppError.conflict('No incoming picking type configured');

    const receiptName = await nextval('stock.picking.in').catch(
        () => `${pickingType.sequenceCode ?? 'WH/IN'}${String(Date.now()).slice(-5)}`
    );

    const confirmed = await prisma.$transaction(async (tx) => {
        await tx.purchaseOrder.update({
            where: { id: orderId },
            data: { state: 'purchase', dateApprove: new Date() },
        });

        await tx.stockPicking.create({
            data: {
                name: receiptName,
                state: 'draft',
                pickingTypeId: pickingType.id,
                locationId: pickingType.defaultLocationSrcId ?? undefined,
                locationDestId: pickingType.defaultLocationDestId ?? undefined,
                purchaseOrderId: orderId,
                partnerId: order.partnerId,
                moves: {
                    create: order.lines
                        .filter((l) => l.productId)
                        .map((l) => ({
                            name: l.name,
                            productId: l.productId!,
                            productQty: l.productQty,
                            qtyDone: 0,
                            locationId: pickingType.defaultLocationSrcId ?? 1,
                            locationDestId: pickingType.defaultLocationDestId ?? 1,
                        })),
                },
            },
        });

        return tx.purchaseOrder.findUnique({
            where: { id: orderId },
            include: { partner: true, lines: true, pickings: true },
        });
    });

    void emitTimeline({
        organizationId: (order as any).organizationId ?? '',
        model: 'PurchaseOrder',
        recordId: String(orderId),
        type: 'STATUS_CHANGE',
        message: `Purchase order ${order.name} confirmed — receipt ${receiptName} created`,
        partnerId: order.partnerId ?? null,
    });

    return confirmed;
}

/** Create a vendor bill from a confirmed PO (idempotent). */
export async function createVendorBill(orderId: number, idempotencyKey?: string) {
    if (idempotencyKey) {
        const existing = await prisma.accountMove.findUnique({
            where: { idempotencyKey },
            include: { partner: true, lines: true },
        });
        if (existing) return existing;
    }

    const order = await prisma.purchaseOrder.findUnique({ where: { id: orderId }, include: { lines: true } });
    if (!order) throw AppError.notFound('Purchase Order');
    if (order.state !== 'purchase') throw AppError.conflict('Only confirmed purchase orders can be billed');

    let journal = await prisma.accountJournal.findFirst({ where: { type: 'purchase', active: true } });
    if (!journal) {
        journal = await prisma.accountJournal.create({
            data: { name: 'Vendor Bills', code: 'BILL', type: 'purchase' },
        });
    }

    const billName = await nextval('account.move.in_invoice').catch(() => `BILL-ERR`);
    return prisma.accountMove.create({
        data: {
            name: billName,
            moveType: 'in_invoice',
            state: 'draft',
            amountUntaxed: order.amountUntaxed,
            amountTax: order.amountTax,
            amountTotal: order.amountTotal,
            amountResidual: order.amountTotal,
            organizationId: order.organizationId,
            journalId: journal.id,
            partnerId: order.partnerId,
            purchaseOrderId: order.id,
            idempotencyKey,
            lines: {
                create: [
                    { name: `A/P – ${order.name}`, debit: 0, credit: order.amountTotal, balance: -order.amountTotal },
                    { name: `Expense – ${order.name}`, debit: order.amountUntaxed, credit: 0, balance: order.amountUntaxed },
                    ...(order.amountTax > 0
                        ? [{ name: `Tax 15% – ${order.name}`, debit: order.amountTax, credit: 0, balance: order.amountTax }]
                        : []),
                ],
            },
        },
        include: { partner: true, lines: true },
    });
}

// ── FLOW E helpers ─────────────────────────────────────────────────────────────

/** Create a project task from a helpdesk ticket. */
export async function createTaskFromTicket(
    ticketId: number,
    payload: {
        projectId: number;
        name?: string;
        saleOrderLineId?: number;
    },
) {
    const ticket = await prisma.helpdeskTicket.findUnique({ where: { id: ticketId } });
    if (!ticket) throw AppError.notFound('Helpdesk Ticket');
    if (ticket.projectTaskId) {
        // Already linked — return existing task
        return prisma.projectTask.findUnique({
            where: { id: ticket.projectTaskId },
            include: { project: true, stage: true },
        });
    }

    // Find first project stage
    const stage = await prisma.projectStage.findFirst({ orderBy: { sequence: 'asc' } });
    if (!stage) throw AppError.conflict('No project stages configured');

    return prisma.$transaction(async (tx) => {
        const task = await tx.projectTask.create({
            data: {
                name: payload.name ?? ticket.name,
                projectId: payload.projectId,
                stageId: stage.id,
                saleOrderLineId: payload.saleOrderLineId,
            },
            include: { project: true, stage: true },
        });

        await tx.helpdeskTicket.update({
            where: { id: ticketId },
            data: { projectId: payload.projectId, projectTaskId: task.id },
        });

        return task;
    });
}

/** Add a timesheet entry to a task. If billable, increments qtyDelivered on the linked sale order line. */
export async function addTimesheetToTask(
    taskId: number,
    payload: {
        name: string;
        unitAmount: number;
        date?: Date;
        isBillable?: boolean;
        saleOrderLineId?: number;
        employeeId: number;
    },
) {
    const task = await prisma.projectTask.findUnique({ where: { id: taskId } });
    if (!task) throw AppError.notFound('Project Task');

    const solId = payload.saleOrderLineId ?? task.saleOrderLineId ?? undefined;

    return prisma.$transaction(async (tx) => {
        const ts = await tx.hrTimesheet.create({
            data: {
                name: payload.name,
                unitAmount: payload.unitAmount,
                date: payload.date ?? new Date(),
                isBillable: payload.isBillable ?? false,
                taskId,
                projectId: task.projectId,
                employeeId: payload.employeeId,
                saleOrderLineId: solId,
            },
        });

        // Update qtyDelivered on the sale order line if billable
        if (payload.isBillable && solId) {
            await tx.saleOrderLine.update({
                where: { id: solId },
                data: { qtyDelivered: { increment: payload.unitAmount } },
            });
        }

        return ts;
    });
}
