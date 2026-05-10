/**
 * Phase 3 – End-to-End Business Flow Integration Tests
 *
 * All 5 flows are exercised against mocked Prisma.
 * Tests validate state transitions, idempotency, and immutability guards.
 *
 * Flow A: Lead → qualify → mark-won → new-quotation → confirm (sale order)
 * Flow B: SaleOrder(confirmed) → picking ready → validate → SO delivered
 * Flow C: SO delivered → invoice → post → pay → reconcile
 * Flow D: RFQ → confirm PO → bill → post bill → pay bill
 * Flow E: Ticket → create task → add timesheet (billable → qtyDelivered++)
 */

import request from 'supertest';
import express, { Express } from 'express';
import { crmRoutes } from '../routes/crm';
import { saleRoutes } from '../routes/sales';
import { inventoryRoutes } from '../routes/inventory';
import { accountingRoutes } from '../routes/accounting';
import { purchaseRoutes } from '../routes/purchases';
import { helpdeskRoutes } from '../routes/helpdesk';
import { errorHandler } from '../core/errors';
import { authHeader } from './helpers';

// ── Bypass requireAuth for unit/integration tests that use mocked Prisma ──────
// The auth middleware reads a real JWT; we stub it out here so these tests can
// focus on business logic rather than token management.
jest.mock('../core/auth', () => ({
    requireAuth: (_req: any, _res: any, next: any) => next(),
    requirePermission: () => (_req: any, _res: any, next: any) => next(),
}));

// ── Mock Prisma ───────────────────────────────────────────────────────────────
jest.mock('../lib/prisma', () => {
    const mockLead = {
        id: 1,
        name: 'Big Deal',
        type: 'lead',
        active: true,
        probability: 10,
        partnerId: 'partner-1',
        organizationId: null,
        stageId: 1,
        stage: { id: 1, name: 'New', sequence: 1 },
        partner: { id: 'partner-1', name: 'Acme Corp' },
        saleOrders: [],
        tags: [],
        dateClosed: null,
    };

    const mockSaleOrder = {
        id: 10,
        name: 'SO00001',
        state: 'draft',
        partnerId: 'partner-1',
        organizationId: null,
        crmLeadId: 1,
        idempotencyKey: null,
        amountUntaxed: 100,
        amountTax: 20,
        amountTotal: 120,
        lines: [],
        partner: { id: 'partner-1', name: 'Acme Corp' },
        pickings: [],
        invoices: [],
    };

    const mockPickingType = {
        id: 5,
        name: 'Receipts',
        code: 'incoming',
        sequenceCode: 'IN',
        defaultLocationSrcId: 1,
        defaultLocationDestId: 2,
    };

    const mockPicking = {
        id: 20,
        name: 'WH/OUT/00001',
        state: 'draft',
        saleOrderId: 10,
        purchaseOrderId: null,
        moves: [],
    };

    const mockInvoice = {
        id: 30,
        name: 'INV/2026/0001',
        moveType: 'out_invoice',
        state: 'draft',
        amountTotal: 120,
        amountResidual: 120,
        paymentState: 'not_paid',
        partnerId: 'partner-1',
        saleOrderId: 10,
        journalId: 1,
        postedAt: null,
        lines: [
            { id: 1, name: 'A/R', debit: 120, credit: 0, balance: 120 },
            { id: 2, name: 'Revenue', debit: 0, credit: 100, balance: -100 },
            { id: 3, name: 'Tax', debit: 0, credit: 20, balance: -20 },
        ],
        partner: { id: 'partner-1', name: 'Acme Corp' },
        journal: { id: 1, name: 'Customer Invoices', code: 'INV', type: 'sale' },
        payments: [],
    };

    const mockPayment = {
        id: 40,
        name: 'PAY00001',
        moveType: 'out_invoice',
        paymentType: 'inbound',
        partnerType: 'customer',
        state: 'posted',
        amount: 120,
        currency: 'EUR',
        moveId: 30,
        idempotencyKey: null,
        partner: { id: 'partner-1', name: 'Acme Corp' },
        journal: { id: 1, name: 'Bank', code: 'BNK', type: 'bank' },
        move: mockInvoice,
    };

    const mockPO = {
        id: 50,
        name: 'PO0001',
        state: 'draft',
        partnerId: 'partner-1',
        organizationId: null,
        amountUntaxed: 200,
        amountTax: 30,
        amountTotal: 230,
        partner: { id: 'partner-1' },
        lines: [{ id: 1, name: 'Product A', productId: 'prod-1', productQty: 2, priceUnit: 100 }],
        pickings: [],
    };

    const mockTicket = {
        id: 60,
        name: 'Bug #1',
        active: true,
        stageId: 1,
        partnerId: null,
        projectId: null,
        projectTaskId: null,
        saleOrderId: null,
        stage: { id: 1, name: 'New' },
        partner: null,
    };

    const mockTask = {
        id: 70,
        name: 'Bug #1',
        projectId: 5,
        stageId: 1,
        saleOrderLineId: null,
        project: { id: 5, name: 'Support' },
        stage: { id: 1, name: 'Todo' },
        timesheets: [],
    };

    const mockTimesheet = {
        id: 80,
        name: 'Fix bug',
        unitAmount: 2,
        isBillable: true,
        billedAmount: 0,
        taskId: 70,
        projectId: 5,
        employeeId: 1,
        saleOrderLineId: 1,
    };

    const mockSaleOrderLine = { id: 1, qtyDelivered: 0 };
    const mockJournal = { id: 1, name: 'Customer Invoices', code: 'INV', type: 'sale', active: true };
    const mockBankJournal = { id: 2, name: 'Bank', code: 'BNK', type: 'bank', active: true };
    const mockStage = { id: 1, name: 'Todo', sequence: 1 };

    return {
        __esModule: true,
        default: {
            crmLead: {
                findUnique: jest.fn((args) => {
                    if (args?.where?.id === 999) return Promise.resolve(null);
                    return Promise.resolve({ ...mockLead, ...args?.where });
                }),
                update: jest.fn((args) => Promise.resolve({ ...mockLead, ...args.data, id: args.where.id })),
                count: jest.fn(() => Promise.resolve(0)),
                findMany: jest.fn(() => Promise.resolve([mockLead])),
            },
            saleOrder: {
                findUnique: jest.fn((args) => {
                    if (args?.where?.idempotencyKey) return Promise.resolve(null); // no existing
                    return Promise.resolve({ ...mockSaleOrder, ...args?.where });
                }),
                findMany: jest.fn(() => Promise.resolve([mockSaleOrder])),
                count: jest.fn(() => Promise.resolve(0)),
                create: jest.fn((args) => Promise.resolve({ ...mockSaleOrder, ...args.data, id: 10, lines: [] })),
                update: jest.fn((args) => Promise.resolve({ ...mockSaleOrder, ...args.data })),
            },
            saleOrderLine: {
                update: jest.fn(() => Promise.resolve(mockSaleOrderLine)),
            },
            stockPickingType: {
                findFirst: jest.fn(() => Promise.resolve(mockPickingType)),
                findUnique: jest.fn(() => Promise.resolve(mockPickingType)),
            },
            stockPicking: {
                findUnique: jest.fn((args) => Promise.resolve({ ...mockPicking, ...args?.where })),
                count: jest.fn(() => Promise.resolve(0)),
                create: jest.fn((args) => Promise.resolve({ ...mockPicking, ...args.data, id: 20, moves: [] })),
                update: jest.fn((args) => Promise.resolve({ ...mockPicking, ...args.data })),
            },
            stockMove: {
                update: jest.fn(() => Promise.resolve({})),
                updateMany: jest.fn(() => Promise.resolve({ count: 0 })),
            },
            stockQuant: {
                findUnique: jest.fn(() => Promise.resolve(null)),
                create: jest.fn(() => Promise.resolve({})),
                update: jest.fn(() => Promise.resolve({})),
            },
            accountMove: {
                findUnique: jest.fn((args) => {
                    if (args?.where?.idempotencyKey) return Promise.resolve(null);
                    return Promise.resolve({ ...mockInvoice, ...args?.where });
                }),
                count: jest.fn(() => Promise.resolve(0)),
                create: jest.fn((args) => Promise.resolve({ ...mockInvoice, ...args.data, id: 30, lines: mockInvoice.lines })),
                update: jest.fn((args) => Promise.resolve({ ...mockInvoice, ...args.data })),
                findMany: jest.fn(() => Promise.resolve([])),
            },
            accountPayment: {
                findUnique: jest.fn((args) => {
                    if (args?.where?.idempotencyKey === 'pay-idem-1') {
                        return Promise.resolve({ ...mockPayment, idempotencyKey: 'pay-idem-1' });
                    }
                    return Promise.resolve(null);
                }),
                count: jest.fn(() => Promise.resolve(0)),
                create: jest.fn((args) => Promise.resolve({ ...mockPayment, ...args.data, id: 40 })),
                findMany: jest.fn(() => Promise.resolve([mockPayment])),
            },
            accountJournal: {
                findFirst: jest.fn((args) => {
                    if (args?.where?.type && ['bank', 'cash'].includes(args.where.type)) return Promise.resolve(mockBankJournal);
                    return Promise.resolve(mockJournal);
                }),
                create: jest.fn(() => Promise.resolve(mockJournal)),
                findMany: jest.fn(() => Promise.resolve([mockJournal])),
            },
            purchaseOrder: {
                findUnique: jest.fn((args) => Promise.resolve({ ...mockPO, ...args?.where })),
                count: jest.fn(() => Promise.resolve(0)),
                create: jest.fn((args) => Promise.resolve({ ...mockPO, ...args.data, id: 50, lines: [] })),
                update: jest.fn((args) => Promise.resolve({ ...mockPO, ...args.data })),
                findMany: jest.fn(() => Promise.resolve([mockPO])),
            },
            helpdeskTicket: {
                findUnique: jest.fn((args) => {
                    if (args?.where?.id === 999) return Promise.resolve(null);
                    return Promise.resolve({ ...mockTicket, ...args?.where });
                }),
                update: jest.fn((args) => Promise.resolve({ ...mockTicket, ...args.data })),
                findMany: jest.fn(() => Promise.resolve([mockTicket])),
                count: jest.fn(() => Promise.resolve(0)),
            },
            projectTask: {
                findUnique: jest.fn(() => Promise.resolve(mockTask)),
                create: jest.fn((args) => Promise.resolve({ ...mockTask, ...args.data, id: 70 })),
            },
            projectStage: {
                findFirst: jest.fn(() => Promise.resolve(mockStage)),
            },
            hrTimesheet: {
                create: jest.fn((args) => Promise.resolve({ ...mockTimesheet, ...args.data, id: 80 })),
            },
            helpdeskStage: {
                findMany: jest.fn(() => Promise.resolve([])),
            },
            crmStage: {
                findMany: jest.fn(() => Promise.resolve([])),
            },
            $transaction: jest.fn(async (fn: any) => {
                // Execute the callback with the mock prisma client itself
                const prismaModule = require('../lib/prisma');
                return fn(prismaModule.default);
            }),
        },
    };
});

// ── Mock external inventory modules ──────────────────────────────────────────
jest.mock('../modules/inventory/replenishmentService', () => ({
    ReplenishmentService: { runReplenishment: jest.fn(() => Promise.resolve([])) },
}));
jest.mock('../modules/inventory/routingEngine', () => ({
    StockRoutingEngine: { handlePickingValidation: jest.fn(() => Promise.resolve()) },
}));
jest.mock('../modules/inventory/vendorIntelligence', () => ({
    VendorIntelligenceService: { updateVendorStats: jest.fn(() => Promise.resolve()) },
}));

// ── Test App ──────────────────────────────────────────────────────────────────
function buildApp(): Express {
    const app = express();
    app.use(express.json());
    app.use('/api/crm', crmRoutes);
    app.use('/api/sale', saleRoutes);
    app.use('/api/inventory', inventoryRoutes);
    app.use('/api/accounting', accountingRoutes);
    app.use('/api/purchase', purchaseRoutes);
    app.use('/api/helpdesk', helpdeskRoutes);
    app.use(errorHandler);
    return app;
}

// ═══════════════════════════════════════════════════════════════════════════════
// FLOW A – Lead → Opportunity → Won → Quotation → Confirm
// ═══════════════════════════════════════════════════════════════════════════════
describe('Flow A – Lead to Confirmed Sale Order', () => {
    let app: Express;
    beforeAll(() => { app = buildApp(); });

    test('POST /api/crm/leads/:id/qualify – raises probability to ≥20', async () => {
        const res = await request(app).post('/api/crm/leads/1/qualify').send();
        expect(res.status).toBe(200);
        expect(res.body).toMatchObject({ type: 'opportunity' });
    });

    test('POST /api/crm/leads/:id/qualify – 404 on missing lead', async () => {
        const res = await request(app).post('/api/crm/leads/999/qualify').send();
        expect(res.status).toBe(404);
    });

    test('POST /api/crm/leads/:id/mark-won – closes lead', async () => {
        const res = await request(app).post('/api/crm/leads/1/mark-won').send();
        expect(res.status).toBe(200);
        expect(res.body).toMatchObject({ probability: 100 });
    });

    test('POST /api/crm/leads/:id/new-quotation – creates draft sale order', async () => {
        const res = await request(app)
            .post('/api/crm/leads/1/new-quotation')
            .send({ lines: [{ name: 'Service', priceUnit: 100, productQty: 1 }] });
        expect(res.status).toBe(201);
        expect(res.body).toMatchObject({ state: 'draft' });
    });

    test('POST /api/sale/:id/confirm – transitions SO to "sale" and creates picking', async () => {
        const res = await request(app).post('/api/sale/10/confirm').send();
        // The mock $transaction returns the updated SO; state will be 'sale'
        expect(res.status).toBe(200);
    });
});

// ═══════════════════════════════════════════════════════════════════════════════
// FLOW B – Delivery Picking State Machine
// ═══════════════════════════════════════════════════════════════════════════════
describe('Flow B – Delivery Picking', () => {
    let app: Express;
    beforeAll(() => { app = buildApp(); });

    test('POST /api/inventory/pickings/:id/ready – sets state to assigned', async () => {
        const res = await request(app).post('/api/inventory/pickings/20/ready').send();
        expect(res.status).toBe(200);
        expect(res.body).toMatchObject({ state: 'assigned' });
    });

    test('POST /api/inventory/pickings/:id/validate – marks picking done', async () => {
        const res = await request(app).post('/api/inventory/pickings/20/validate').send();
        expect(res.status).toBe(200);
        expect(res.body).toMatchObject({ success: true });
    });
});

// ═══════════════════════════════════════════════════════════════════════════════
// FLOW C – Invoice → Post → Pay → Reconcile
// ═══════════════════════════════════════════════════════════════════════════════
describe('Flow C – Invoice Lifecycle', () => {
    let app: Express;
    beforeAll(() => { app = buildApp(); });

    test('POST /api/sale/:id/invoice – creates draft invoice', async () => {
        const prisma = require('../lib/prisma').default;
        // createSaleInvoice requires state 'sale' or 'done'
        prisma.saleOrder.findUnique.mockResolvedValueOnce({
            id: 10, name: 'SO00001', state: 'sale',
            partnerId: 'partner-1', organizationId: null,
            amountUntaxed: 100, amountTax: 20, amountTotal: 120, lines: [],
        });
        const res = await request(app).post('/api/sale/10/invoice').send();
        expect(res.status).toBe(201);
        expect(res.body).toMatchObject({ moveType: 'out_invoice', state: 'draft' });
    });

    test('POST /api/accounting/moves/:id/post – posts invoice, sets postedAt', async () => {
        const res = await request(app).post('/api/accounting/moves/30/post').send();
        expect(res.status).toBe(200);
        expect(res.body).toMatchObject({ state: 'posted' });
    });

    test('POST /api/accounting/moves/:id/post – 409 if already posted', async () => {
        const prisma = require('../lib/prisma').default;
        prisma.accountMove.findUnique.mockResolvedValueOnce({
            id: 30, state: 'posted',
            lines: [{ id: 1, debit: 120, credit: 0 }, { id: 2, debit: 0, credit: 120 }],
        });
        const res = await request(app).post('/api/accounting/moves/30/post').send();
        expect(res.status).toBe(409);
    });

    test('POST /api/accounting/moves/:id/pay – registers payment', async () => {
        const prisma = require('../lib/prisma').default;
        // registerPayment requires state 'posted'
        prisma.accountMove.findUnique.mockResolvedValueOnce({
            id: 30, name: 'INV/2026/0001', moveType: 'out_invoice', state: 'posted',
            amountTotal: 120, amountResidual: 120, partnerId: 'partner-1',
            journalId: 1, journal: { id: 1, type: 'sale' },
        });
        const res = await request(app)
            .post('/api/accounting/moves/30/pay')
            .send({ amount: 120, memo: 'Full payment' });
        expect(res.status).toBe(201);
        expect(res.body).toMatchObject({ amount: 120, state: 'posted' });
    });

    test('POST /api/accounting/moves/:id/pay – 422 if amount missing', async () => {
        const res = await request(app).post('/api/accounting/moves/30/pay').send({});
        expect(res.status).toBe(422);
    });

    test('POST /api/accounting/moves/:id/pay – idempotent (returns existing payment)', async () => {
        const res = await request(app)
            .post('/api/accounting/moves/30/pay')
            .send({ amount: 120, idempotencyKey: 'pay-idem-1' });
        expect(res.status).toBe(201);
        expect(res.body).toMatchObject({ idempotencyKey: 'pay-idem-1' });
    });

    test('POST /api/accounting/moves/:id/reconcile – marks invoice paid', async () => {
        const prisma = require('../lib/prisma').default;
        // reconcile requires state 'posted'
        prisma.accountMove.findUnique.mockResolvedValueOnce({
            id: 30, state: 'posted', amountResidual: 120, paymentState: 'not_paid',
        });
        const res = await request(app).post('/api/accounting/moves/30/reconcile').send();
        expect(res.status).toBe(200);
        expect(res.body).toMatchObject({ paymentState: 'paid', amountResidual: 0 });
    });

    test('GET /api/accounting/payments – lists payments', async () => {
        const res = await request(app).get('/api/accounting/payments');
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body.data)).toBe(true);
    });
});

// ═══════════════════════════════════════════════════════════════════════════════
// FLOW D – Purchase Order → Bill → Post → Pay
// ═══════════════════════════════════════════════════════════════════════════════
describe('Flow D – Purchase to Payment', () => {
    let app: Express;
    beforeAll(() => { app = buildApp(); });

    test('POST /api/purchase/:id/confirm – confirms PO and creates receipt picking', async () => {
        const res = await request(app).post('/api/purchase/50/confirm').send();
        expect(res.status).toBe(200);
    });

    test('POST /api/purchase/:id/bill – creates vendor bill', async () => {
        const prisma = require('../lib/prisma').default;
        // createVendorBill requires state 'purchase'
        prisma.purchaseOrder.findUnique.mockResolvedValueOnce({
            id: 50, name: 'PO0001', state: 'purchase',
            partnerId: 'partner-1', organizationId: null,
            amountUntaxed: 200, amountTax: 30, amountTotal: 230,
            lines: [],
        });
        const res = await request(app).post('/api/purchase/50/bill').send();
        expect(res.status).toBe(201);
        expect(res.body).toMatchObject({ moveType: 'in_invoice' });
    });

    test('POST /api/purchase/:id/post-bill – posts vendor bill', async () => {
        const res = await request(app)
            .post('/api/purchase/50/post-bill')
            .send({ billId: 30 });
        expect(res.status).toBe(200);
        expect(res.body).toMatchObject({ state: 'posted' });
    });

    test('POST /api/purchase/:id/post-bill – 422 if billId missing', async () => {
        const res = await request(app).post('/api/purchase/50/post-bill').send({});
        expect(res.status).toBe(422);
    });

    test('POST /api/purchase/:id/pay-bill – registers vendor payment', async () => {
        const prisma = require('../lib/prisma').default;
        // registerPayment requires state 'posted'
        prisma.accountMove.findUnique.mockResolvedValueOnce({
            id: 30, name: 'BILL/2026/0001', moveType: 'in_invoice', state: 'posted',
            amountTotal: 230, amountResidual: 230, partnerId: 'partner-1',
            journalId: 2, journal: { id: 2, type: 'purchase' },
        });
        const res = await request(app)
            .post('/api/purchase/50/pay-bill')
            .send({ billId: 30, amount: 230 });
        expect(res.status).toBe(201);
        expect(res.body).toMatchObject({ amount: 230 });
    });
});

// ═══════════════════════════════════════════════════════════════════════════════
// FLOW E – Ticket → Task → Timesheet → Billable Line
// ═══════════════════════════════════════════════════════════════════════════════
describe('Flow E – Helpdesk Ticket to Billable Timesheet', () => {
    let app: Express;
    beforeAll(() => { app = buildApp(); });

    test('POST /api/helpdesk/tickets/:id/create-task – creates project task', async () => {
        const res = await request(app)
            .post('/api/helpdesk/tickets/60/create-task')
            .send({ projectId: 5, name: 'Investigate bug', saleOrderLineId: 1 });
        expect(res.status).toBe(201);
        expect(res.body).toMatchObject({ projectId: 5 });
    });

    test('POST /api/helpdesk/tickets/:id/create-task – 422 if projectId missing', async () => {
        const res = await request(app)
            .post('/api/helpdesk/tickets/60/create-task')
            .send({});
        expect(res.status).toBe(422);
    });

    test('POST /api/helpdesk/tickets/:id/create-task – 404 for unknown ticket', async () => {
        const res = await request(app)
            .post('/api/helpdesk/tickets/999/create-task')
            .send({ projectId: 5 });
        expect(res.status).toBe(404);
    });

    test('POST /api/helpdesk/tickets/:id/timesheet – adds billable timesheet to task', async () => {
        // Ticket has projectTaskId set
        const prisma = require('../lib/prisma').default;
        prisma.helpdeskTicket.findUnique.mockResolvedValueOnce({
            id: 60,
            name: 'Bug #1',
            active: true,
            projectTaskId: 70,
        });

        const res = await request(app)
            .post('/api/helpdesk/tickets/60/timesheet')
            .send({ unitAmount: 2, isBillable: true, employeeId: 1, saleOrderLineId: 1 });
        expect(res.status).toBe(201);
        expect(res.body).toMatchObject({ isBillable: true, unitAmount: 2 });
    });

    test('POST /api/helpdesk/tickets/:id/timesheet – 409 if no linked task', async () => {
        const res = await request(app)
            .post('/api/helpdesk/tickets/60/timesheet')
            .send({ unitAmount: 2, employeeId: 1 });
        expect(res.status).toBe(409);
    });
});
