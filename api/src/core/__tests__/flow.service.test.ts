/**
 * Unit tests for core/flow.service.ts — all 13 exported functions.
 * Prisma is fully mocked; no database required.
 */

// ── Mocks (must be before imports) ───────────────────────────────────────────
jest.mock('../../lib/prisma', () => {
    const mockTx = {
        crmLead: { update: jest.fn(), findUnique: jest.fn() },
        saleOrder: { update: jest.fn(), findUnique: jest.fn(), create: jest.fn() },
        stockPicking: { update: jest.fn(), create: jest.fn(), findUnique: jest.fn() },
        stockMove: { update: jest.fn(), updateMany: jest.fn() },
        accountMove: { update: jest.fn(), create: jest.fn(), findUnique: jest.fn() },
        accountPayment: { create: jest.fn(), findUnique: jest.fn() },
        purchaseOrder: { update: jest.fn(), findUnique: jest.fn() },
        projectTask: { create: jest.fn(), findUnique: jest.fn() },
        helpdeskTicket: { update: jest.fn(), findUnique: jest.fn() },
        hrTimesheet: { create: jest.fn() },
        saleOrderLine: { findFirst: jest.fn(), update: jest.fn() },
    };
    const client = {
        crmLead: { findUnique: jest.fn(), update: jest.fn() },
        saleOrder: { findUnique: jest.fn(), update: jest.fn(), create: jest.fn() },
        stockPicking: { findUnique: jest.fn(), update: jest.fn(), create: jest.fn() },
        stockMove: { update: jest.fn(), updateMany: jest.fn() },
        stockPickingType: { findFirst: jest.fn() },
        accountMove: { findUnique: jest.fn(), update: jest.fn(), create: jest.fn() },
        accountJournal: { findFirst: jest.fn(), create: jest.fn() },
        accountPayment: { findUnique: jest.fn(), create: jest.fn() },
        purchaseOrder: { findUnique: jest.fn(), update: jest.fn() },
        projectTask: { findUnique: jest.fn(), create: jest.fn() },
        projectStage: { findFirst: jest.fn() },
        helpdeskTicket: { findUnique: jest.fn(), update: jest.fn() },
        hrTimesheet: { create: jest.fn() },
        saleOrderLine: { findFirst: jest.fn(), update: jest.fn() },
        accountTax: { findMany: jest.fn().mockResolvedValue([]) },
        $transaction: jest.fn().mockImplementation((cb: any) => cb(mockTx)),
        _mockTx: mockTx,
    };
    return { __esModule: true, default: client };
});

jest.mock('../sequence', () => ({
    nextval: jest.fn().mockResolvedValue('SO0001'),
}));

jest.mock('../timeline', () => ({
    emitTimeline: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../accounting/periodCheck', () => ({
    assertPeriodOpen: jest.fn().mockResolvedValue(undefined),
}));

import prisma from '../../lib/prisma';
import { AppError } from '../errors';
import {
    qualifyLead,
    markWon,
    createQuotationFromLead,
    confirmSaleOrder,
    markPickingReady,
    validatePicking,
    createSaleInvoice,
    postInvoice,
    registerPayment,
    confirmPurchaseOrder,
    createVendorBill,
    createTaskFromTicket,
    addTimesheetToTask,
} from '../flow.service';

const db = prisma as any;
const tx = (prisma as any)._mockTx;

beforeEach(() => jest.clearAllMocks());

// ── qualifyLead ───────────────────────────────────────────────────────────────

describe('qualifyLead()', () => {
    test('promotes a lead to opportunity', async () => {
        db.crmLead.findUnique.mockResolvedValue({ id: 1, type: 'lead', probability: 10, active: true, organizationId: 'org-1' });
        db.crmLead.update.mockResolvedValue({ id: 1, type: 'opportunity', probability: 20, stage: {}, partner: {} });

        const result = await qualifyLead(1);
        expect(db.crmLead.update).toHaveBeenCalledWith(expect.objectContaining({
            where: { id: 1 },
            data: expect.objectContaining({ type: 'opportunity', probability: 20 }),
        }));
        expect(result.type).toBe('opportunity');
    });

    test('throws NOT_FOUND when lead does not exist', async () => {
        db.crmLead.findUnique.mockResolvedValue(null);
        await expect(qualifyLead(99)).rejects.toThrow(AppError);
        await expect(qualifyLead(99)).rejects.toMatchObject({ status: 404 });
    });

    test('throws CONFLICT when already an opportunity', async () => {
        db.crmLead.findUnique.mockResolvedValue({ id: 1, type: 'opportunity', probability: 50 });
        await expect(qualifyLead(1)).rejects.toMatchObject({ status: 409 });
    });

    test('preserves probability when it is already above 20', async () => {
        db.crmLead.findUnique.mockResolvedValue({ id: 1, type: 'lead', probability: 60 });
        db.crmLead.update.mockResolvedValue({ id: 1, type: 'opportunity', probability: 60 });

        await qualifyLead(1);
        expect(db.crmLead.update).toHaveBeenCalledWith(expect.objectContaining({
            data: expect.objectContaining({ probability: 60 }),
        }));
    });
});

// ── markWon ───────────────────────────────────────────────────────────────────

describe('markWon()', () => {
    test('marks an active opportunity as won', async () => {
        db.crmLead.findUnique.mockResolvedValue({ id: 1, type: 'opportunity', probability: 60, active: true });
        db.crmLead.update.mockResolvedValue({ id: 1, probability: 100, dateClosed: new Date().toISOString(), stage: {}, partner: {}, saleOrders: [] });

        const result = await markWon(1);
        expect(result.probability).toBe(100);
    });

    test('throws NOT_FOUND when lead does not exist', async () => {
        db.crmLead.findUnique.mockResolvedValue(null);
        await expect(markWon(1)).rejects.toMatchObject({ status: 404 });
    });

    test('throws CONFLICT when lead is already closed', async () => {
        db.crmLead.findUnique.mockResolvedValue({ id: 1, active: false });
        await expect(markWon(1)).rejects.toMatchObject({ status: 409 });
    });
});

// ── createQuotationFromLead ───────────────────────────────────────────────────

describe('createQuotationFromLead()', () => {
    const lead = { id: 1, partnerId: 'p-1', organizationId: 'org-1', partner: {} };

    test('creates a draft sale order from a lead', async () => {
        db.crmLead.findUnique.mockResolvedValue(lead);
        db.saleOrder.findUnique.mockResolvedValue(null); // no existing idempotency hit
        db.saleOrder.create.mockResolvedValue({ id: 10, name: 'SO0001', state: 'draft', partner: {}, lines: [] });

        const result = await createQuotationFromLead(1, { lines: [{ name: 'Product A', productQty: 2, priceUnit: 100 }] });
        expect(db.saleOrder.create).toHaveBeenCalled();
        expect(result.state).toBe('draft');
    });

    test('throws NOT_FOUND when lead missing', async () => {
        db.crmLead.findUnique.mockResolvedValue(null);
        await expect(createQuotationFromLead(99)).rejects.toMatchObject({ status: 404 });
    });

    test('throws VALIDATION when lead has no partner', async () => {
        db.crmLead.findUnique.mockResolvedValue({ ...lead, partnerId: null });
        await expect(createQuotationFromLead(1)).rejects.toMatchObject({ status: 422 });
    });

    test('returns existing order on idempotency hit', async () => {
        const existing = { id: 10, name: 'SO0001', state: 'draft', partner: {}, lines: [] };
        db.crmLead.findUnique.mockResolvedValue(lead);
        db.saleOrder.findUnique.mockResolvedValue(existing);

        const result = await createQuotationFromLead(1, { idempotencyKey: 'k-1' });
        expect(db.saleOrder.create).not.toHaveBeenCalled();
        expect(result).toBe(existing);
    });
});

// ── confirmSaleOrder ──────────────────────────────────────────────────────────

describe('confirmSaleOrder()', () => {
    const order = { id: 10, name: 'SO0001', state: 'draft', partnerId: 'p-1', organizationId: 'org-1', lines: [] };
    const pickingType = { id: 1, code: 'outgoing', sequenceCode: 'WH/OUT', defaultLocationSrcId: 8, defaultLocationDestId: 5 };

    test('confirms a draft sale order and creates a picking', async () => {
        db.saleOrder.findUnique.mockResolvedValue(order);
        db.stockPickingType.findFirst.mockResolvedValue(pickingType);
        tx.saleOrder.update.mockResolvedValue({});
        tx.stockPicking.create.mockResolvedValue({});
        tx.saleOrder.findUnique.mockResolvedValue({ ...order, state: 'sale', pickings: [] });

        const result = await confirmSaleOrder(10);
        expect(tx.saleOrder.update).toHaveBeenCalledWith(expect.objectContaining({ data: { state: 'sale' } }));
    });

    test('is idempotent when order is already confirmed', async () => {
        db.saleOrder.findUnique.mockResolvedValue({ ...order, state: 'sale' });
        const result = await confirmSaleOrder(10);
        expect(db.stockPickingType.findFirst).not.toHaveBeenCalled();
    });

    test('throws NOT_FOUND when order missing', async () => {
        db.saleOrder.findUnique.mockResolvedValue(null);
        await expect(confirmSaleOrder(99)).rejects.toMatchObject({ status: 404 });
    });

    test('throws CONFLICT for cancelled order', async () => {
        db.saleOrder.findUnique.mockResolvedValue({ ...order, state: 'cancel' });
        await expect(confirmSaleOrder(10)).rejects.toMatchObject({ status: 409 });
    });

    test('throws CONFLICT when no outgoing picking type configured', async () => {
        db.saleOrder.findUnique.mockResolvedValue(order);
        db.stockPickingType.findFirst.mockResolvedValue(null);
        await expect(confirmSaleOrder(10)).rejects.toMatchObject({ status: 409 });
    });
});

// ── markPickingReady ──────────────────────────────────────────────────────────

describe('markPickingReady()', () => {
    test('transitions picking to assigned', async () => {
        db.stockPicking.findUnique.mockResolvedValue({ id: 20, state: 'draft' });
        db.stockPicking.update.mockResolvedValue({ id: 20, state: 'assigned', moves: [] });

        const result = await markPickingReady(20);
        expect(db.stockPicking.update).toHaveBeenCalledWith(expect.objectContaining({ data: { state: 'assigned' } }));
    });

    test('throws NOT_FOUND when picking missing', async () => {
        db.stockPicking.findUnique.mockResolvedValue(null);
        await expect(markPickingReady(99)).rejects.toMatchObject({ status: 404 });
    });

    test('throws CONFLICT from invalid state', async () => {
        db.stockPicking.findUnique.mockResolvedValue({ id: 20, state: 'done' });
        await expect(markPickingReady(20)).rejects.toMatchObject({ status: 409 });
    });
});

// ── validatePicking ───────────────────────────────────────────────────────────

describe('validatePicking()', () => {
    const picking = { id: 20, name: 'WH/OUT/001', state: 'assigned', pickingTypeId: 1, saleOrderId: 10, organizationId: 'org-1', partnerId: 'p-1', moves: [{ id: 1, productQty: 5 }] };

    test('validates a ready picking', async () => {
        db.stockPicking.findUnique.mockResolvedValue(picking);
        db.stockPickingType.findFirst.mockResolvedValue({ id: 1, code: 'outgoing' });
        tx.stockMove.updateMany.mockResolvedValue({});
        tx.stockMove.update.mockResolvedValue({});
        tx.stockPicking.update.mockResolvedValue({ ...picking, state: 'done', moves: [] });
        tx.saleOrder.update.mockResolvedValue({});

        const result = await validatePicking(20);
        expect(tx.stockPicking.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ state: 'done' }) }));
    });

    test('is idempotent when already done', async () => {
        db.stockPicking.findUnique.mockResolvedValue({ ...picking, state: 'done' });
        const result = await validatePicking(20);
        expect(db.$transaction).not.toHaveBeenCalled();
    });

    test('throws CONFLICT when not in assigned state', async () => {
        db.stockPicking.findUnique.mockResolvedValue({ ...picking, state: 'draft' });
        await expect(validatePicking(20)).rejects.toMatchObject({ status: 409 });
    });
});

// ── postInvoice ───────────────────────────────────────────────────────────────

describe('postInvoice()', () => {
    const lines = [
        { debit: 1200, credit: 0 },
        { debit: 0, credit: 1000 },
        { debit: 0, credit: 200 },
    ];
    const invoice = { id: 30, name: 'INV/001', state: 'draft', moveType: 'out_invoice', amountTotal: 1200, organizationId: 'org-1', partnerId: 'p-1', lines, date: null };

    test('posts a draft invoice with balanced lines', async () => {
        db.accountMove.findUnique.mockResolvedValue(invoice);
        db.accountMove.update.mockResolvedValue({ ...invoice, state: 'posted', partner: {}, journal: {} });

        const result = await postInvoice(30);
        expect(db.accountMove.update).toHaveBeenCalledWith(expect.objectContaining({
            data: expect.objectContaining({ state: 'posted' }),
        }));
    });

    test('throws CONFLICT when already posted', async () => {
        db.accountMove.findUnique.mockResolvedValue({ ...invoice, state: 'posted' });
        await expect(postInvoice(30)).rejects.toMatchObject({ status: 409 });
    });

    test('throws VALIDATION when lines are empty', async () => {
        db.accountMove.findUnique.mockResolvedValue({ ...invoice, lines: [] });
        await expect(postInvoice(30)).rejects.toMatchObject({ status: 422 });
    });

    test('throws VALIDATION when debits ≠ credits', async () => {
        db.accountMove.findUnique.mockResolvedValue({
            ...invoice,
            lines: [{ debit: 1200, credit: 0 }, { debit: 0, credit: 500 }],
        });
        await expect(postInvoice(30)).rejects.toMatchObject({ status: 422 });
    });

    test('throws NOT_FOUND when invoice missing', async () => {
        db.accountMove.findUnique.mockResolvedValue(null);
        await expect(postInvoice(99)).rejects.toMatchObject({ status: 404 });
    });
});

// ── registerPayment ───────────────────────────────────────────────────────────

describe('registerPayment()', () => {
    const move = { id: 30, name: 'INV/001', state: 'posted', moveType: 'out_invoice', amountResidual: 1200, partnerId: 'p-1', organizationId: 'org-1', journal: {} };
    const bankJournal = { id: 5, type: 'bank', active: true };

    test('registers a full payment and marks invoice paid', async () => {
        db.accountPayment.findUnique.mockResolvedValue(null);
        db.accountMove.findUnique.mockResolvedValue(move);
        db.accountJournal.findFirst.mockResolvedValue(bankJournal);
        tx.accountPayment.create.mockResolvedValue({ id: 1, name: 'PAY0001', amount: 1200 });
        tx.accountMove.update.mockResolvedValue({});

        const result = await registerPayment(30, { amount: 1200 });
        expect(tx.accountPayment.create).toHaveBeenCalled();
        expect(tx.accountMove.update).toHaveBeenCalledWith(expect.objectContaining({
            data: expect.objectContaining({ paymentState: 'paid' }),
        }));
    });

    test('records partial payment state', async () => {
        db.accountPayment.findUnique.mockResolvedValue(null);
        db.accountMove.findUnique.mockResolvedValue(move);
        db.accountJournal.findFirst.mockResolvedValue(bankJournal);
        tx.accountPayment.create.mockResolvedValue({ id: 1, name: 'PAY0001', amount: 500 });
        tx.accountMove.update.mockResolvedValue({});

        await registerPayment(30, { amount: 500 });
        expect(tx.accountMove.update).toHaveBeenCalledWith(expect.objectContaining({
            data: expect.objectContaining({ paymentState: 'partial', amountResidual: 700 }),
        }));
    });

    test('throws CONFLICT when invoice not posted', async () => {
        db.accountPayment.findUnique.mockResolvedValue(null);
        db.accountMove.findUnique.mockResolvedValue({ ...move, state: 'draft' });
        await expect(registerPayment(30, { amount: 100 })).rejects.toMatchObject({ status: 409 });
    });

    test('throws CONFLICT when no bank journal configured', async () => {
        db.accountPayment.findUnique.mockResolvedValue(null);
        db.accountMove.findUnique.mockResolvedValue(move);
        db.accountJournal.findFirst.mockResolvedValue(null);
        await expect(registerPayment(30, { amount: 100 })).rejects.toMatchObject({ status: 409 });
    });

    test('returns existing payment on idempotency hit', async () => {
        const existing = { id: 1, name: 'PAY0001' };
        db.accountPayment.findUnique.mockResolvedValue(existing);

        const result = await registerPayment(30, { amount: 1200, idempotencyKey: 'k-1' });
        expect(result).toBe(existing);
        expect(db.$transaction).not.toHaveBeenCalled();
    });
});

// ── confirmPurchaseOrder ──────────────────────────────────────────────────────

describe('confirmPurchaseOrder()', () => {
    const order = { id: 50, name: 'PO0001', state: 'draft', partnerId: 'p-1', organizationId: 'org-1', lines: [] };
    const pickingType = { id: 2, code: 'incoming', sequenceCode: 'WH/IN', defaultLocationSrcId: 1, defaultLocationDestId: 8 };

    test('confirms a draft PO and creates a receipt', async () => {
        db.purchaseOrder.findUnique.mockResolvedValue(order);
        db.stockPickingType.findFirst.mockResolvedValue(pickingType);
        tx.purchaseOrder.update.mockResolvedValue({});
        tx.stockPicking.create.mockResolvedValue({});

        await confirmPurchaseOrder(50);
        expect(tx.purchaseOrder.update).toHaveBeenCalledWith(expect.objectContaining({
            data: expect.objectContaining({ state: 'purchase' }),
        }));
    });

    test('is idempotent when already confirmed', async () => {
        db.purchaseOrder.findUnique.mockResolvedValue({ ...order, state: 'purchase' });
        const result = await confirmPurchaseOrder(50);
        expect(db.stockPickingType.findFirst).not.toHaveBeenCalled();
    });

    test('throws CONFLICT for cancelled PO', async () => {
        db.purchaseOrder.findUnique.mockResolvedValue({ ...order, state: 'cancel' });
        await expect(confirmPurchaseOrder(50)).rejects.toMatchObject({ status: 409 });
    });
});

// ── createVendorBill ──────────────────────────────────────────────────────────

describe('createVendorBill()', () => {
    const order = { id: 50, name: 'PO0001', state: 'purchase', partnerId: 'p-1', organizationId: 'org-1', amountUntaxed: 1000, amountTax: 150, amountTotal: 1150, lines: [] };

    test('creates a draft vendor bill from a confirmed PO', async () => {
        db.accountMove.findUnique.mockResolvedValue(null);
        db.purchaseOrder.findUnique.mockResolvedValue(order);
        db.accountJournal.findFirst.mockResolvedValue({ id: 3, type: 'purchase' });
        db.accountMove.create.mockResolvedValue({ id: 40, name: 'BILL0001', state: 'draft', partner: {}, lines: [] });

        const result = await createVendorBill(50);
        expect(db.accountMove.create).toHaveBeenCalled();
        expect(result.state).toBe('draft');
    });

    test('throws CONFLICT when PO not confirmed', async () => {
        db.accountMove.findUnique.mockResolvedValue(null);
        db.purchaseOrder.findUnique.mockResolvedValue({ ...order, state: 'draft' });
        await expect(createVendorBill(50)).rejects.toMatchObject({ status: 409 });
    });

    test('throws NOT_FOUND when PO missing', async () => {
        db.accountMove.findUnique.mockResolvedValue(null);
        db.purchaseOrder.findUnique.mockResolvedValue(null);
        await expect(createVendorBill(99)).rejects.toMatchObject({ status: 404 });
    });
});

// ── createTaskFromTicket ──────────────────────────────────────────────────────

describe('createTaskFromTicket()', () => {
    const ticket = { id: 70, name: 'Server crash', projectTaskId: null, organizationId: 'org-1' };
    const stage = { id: 1, sequence: 1 };

    test('creates a project task from a helpdesk ticket', async () => {
        db.helpdeskTicket.findUnique.mockResolvedValue(ticket);
        db.projectStage.findFirst.mockResolvedValue(stage);
        tx.projectTask.create.mockResolvedValue({ id: 80, name: 'Server crash', project: {}, stage });
        tx.helpdeskTicket.update.mockResolvedValue({});

        const result = await createTaskFromTicket(70, { projectId: 1 });
        expect(tx.projectTask.create).toHaveBeenCalled();
    });

    test('returns existing task when ticket already linked', async () => {
        db.helpdeskTicket.findUnique.mockResolvedValue({ ...ticket, projectTaskId: 80 });
        db.projectTask.findUnique.mockResolvedValue({ id: 80, project: {}, stage: {} });

        const result = await createTaskFromTicket(70, { projectId: 1 });
        expect(db.projectTask.findUnique).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 80 } }));
    });

    test('throws NOT_FOUND when ticket missing', async () => {
        db.helpdeskTicket.findUnique.mockResolvedValue(null);
        await expect(createTaskFromTicket(99, { projectId: 1 })).rejects.toMatchObject({ status: 404 });
    });

    test('throws CONFLICT when no project stages configured', async () => {
        db.helpdeskTicket.findUnique.mockResolvedValue(ticket);
        db.projectStage.findFirst.mockResolvedValue(null);
        await expect(createTaskFromTicket(70, { projectId: 1 })).rejects.toMatchObject({ status: 409 });
    });
});

// ── addTimesheetToTask ────────────────────────────────────────────────────────

describe('addTimesheetToTask()', () => {
    const task = { id: 80, name: 'Task', projectId: 1, stageId: 1, saleOrderLineId: null };

    test('adds a timesheet entry to a task', async () => {
        db.projectTask.findUnique.mockResolvedValue(task);
        tx.hrTimesheet.create.mockResolvedValue({ id: 90, unitAmount: 3.5, taskId: 80 });
        tx.saleOrderLine.findFirst.mockResolvedValue(null);

        await addTimesheetToTask(80, { name: 'Debugging session', unitAmount: 3.5, employeeId: 1 });
        expect(tx.hrTimesheet.create).toHaveBeenCalled();
    });

    test('increments qtyDelivered on linked sale order line when billable', async () => {
        const taskWithLine = { ...task, saleOrderLineId: 5 };
        const solLine = { id: 5, productQty: 0, qtyDelivered: 0, priceUnit: 100, saleOrderId: 10 };

        db.projectTask.findUnique.mockResolvedValue(taskWithLine);
        tx.hrTimesheet.create.mockResolvedValue({ id: 90, unitAmount: 2, taskId: 80 });
        tx.saleOrderLine.findFirst.mockResolvedValue(solLine);
        tx.saleOrderLine.update.mockResolvedValue({ ...solLine, qtyDelivered: 2 });

        await addTimesheetToTask(80, { name: 'Fix', unitAmount: 2, employeeId: 1 });
    });

    test('throws NOT_FOUND when task missing', async () => {
        db.projectTask.findUnique.mockResolvedValue(null);
        await expect(addTimesheetToTask(99, { name: 'x', unitAmount: 1, employeeId: 1 })).rejects.toMatchObject({ status: 404 });
    });
});
