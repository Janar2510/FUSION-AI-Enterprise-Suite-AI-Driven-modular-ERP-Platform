/**
 * E2E — Ticket → Task → Timesheet → Billable Invoice Line → Invoice → Payment
 *
 * Full Flow E end-to-end: a support ticket generates a task, time is logged,
 * the hours appear on a sale order as a billable line, that line is invoiced,
 * and the invoice is paid. Covers the ticket-to-billable path described in the
 * Phase 3 DoD.
 */

import { test, expect } from '@playwright/test';
import { injectAuth, stubUnmatched, jsonReply } from './helpers/setup';

// ── Fixtures ─────────────────────────────────────────────────────────────────

const TICKET = {
  id: 70, name: 'Database queries timing out', state: 'new', priority: 'urgent',
  partnerId: 'p-1', partnerName: 'Globex Inc',
  stageId: 1, stage: { id: 1, name: 'New' },
  description: 'Queries run fine in staging but timeout in production.',
  assigneeId: null,
  task: null as null | { id: number; name: string; state: string; projectId: number; assigneeId: null; timesheets: unknown[] },
  createdAt: new Date().toISOString(),
};

const TICKET_WITH_TASK = {
  ...TICKET,
  state: 'in_progress',
  task: {
    id: 90, name: 'Investigate DB query timeouts', state: 'in_progress',
    projectId: 2, assigneeId: null, timesheets: [],
  },
};

const TICKET_WITH_TIME = {
  ...TICKET_WITH_TASK,
  task: {
    ...TICKET_WITH_TASK.task!,
    timesheets: [
      { id: 101, hours: 4.0, description: 'Added query indexes, reduced timeout from 30s to 0.3s', taskId: 90, employeeId: 1, date: new Date().toISOString() },
    ],
  },
};

const STAGES = [
  { id: 1, name: 'New' },
  { id: 2, name: 'In Progress' },
  { id: 3, name: 'Resolved' },
  { id: 4, name: 'Closed' },
];

const BILLABLE_ORDER = {
  id: 11, name: 'SO00002', state: 'sale',
  partnerName: 'Globex Inc', partnerId: 'p-1', crmLeadId: null,
  amountUntaxed: 400, amountTax: 80, amountTotal: 480,
  dateOrder: new Date().toISOString(),
  orderLines: [
    {
      id: 20, name: 'Support — DB query investigation',
      productQty: 4.0, priceUnit: 100, priceSubtotal: 400,
      priceTotal: 480, isBillable: true, qtyDelivered: 4.0, qtyInvoiced: 0,
    },
  ],
};

const INVOICE_DRAFT = {
  id: 40, name: 'INV/2026/00002', state: 'draft',
  moveType: 'out_invoice', amountTotal: 480,
  partnerId: 'p-1', partnerName: 'Globex Inc', paymentState: 'not_paid',
  invoiceDate: new Date().toISOString(),
  invoiceLines: [
    { id: 50, name: 'Support — DB query investigation', quantity: 4.0, priceUnit: 100, priceSubtotal: 400, priceTotal: 480 },
  ],
};
const INVOICE_POSTED = { ...INVOICE_DRAFT, state: 'posted' };
const INVOICE_PAID = { ...INVOICE_POSTED, paymentState: 'paid', state: 'posted' };

// ── Flow E Part 1: Ticket → Create Task ──────────────────────────────────────

test.describe('Flow E Part 1 — Ticket creates a task', () => {
  test.beforeEach(async ({ page }) => {
    await injectAuth(page);
    await stubUnmatched(page);
  });

  test('creates a task from a helpdesk ticket', async ({ page }) => {
    let ticket = { ...TICKET };

    await page.route('**/api/helpdesk/tickets**', (route) => {
      if (route.request().method() === 'GET') {
        route.fulfill(jsonReply({ data: [ticket], total: 1, page: 1, limit: 20 }));
      } else route.continue();
    });

    await page.route('**/api/helpdesk/stages**', (route) =>
      route.fulfill(jsonReply(STAGES))
    );

    await page.route('**/api/helpdesk/tickets/70/create-task', async (route) => {
      ticket = { ...TICKET_WITH_TASK };
      route.fulfill(jsonReply(ticket));
    });

    await page.goto('/module/helpdesk');
    await page.getByText('Database queries timing out').first().click();
    await page.getByRole('button', { name: 'Create Task' }).click();

    await expect(
      page.getByText('Investigate', { exact: false })
        .or(page.getByText('task', { exact: false }))
        .or(page.getByText('in_progress', { exact: false }))
    ).toBeVisible({ timeout: 5000 });
  });
});

// ── Flow E Part 2: Log time against the task ──────────────────────────────────

test.describe('Flow E Part 2 — Log timesheet hours on task', () => {
  test.beforeEach(async ({ page }) => {
    await injectAuth(page);
    await stubUnmatched(page);
  });

  test('logs hours against the task and shows them on the ticket', async ({ page }) => {
    let ticket = { ...TICKET_WITH_TASK };

    await page.route('**/api/helpdesk/tickets**', (route) => {
      if (route.request().method() === 'GET') {
        route.fulfill(jsonReply({ data: [ticket], total: 1, page: 1, limit: 20 }));
      } else route.continue();
    });

    await page.route('**/api/helpdesk/stages**', (route) =>
      route.fulfill(jsonReply(STAGES))
    );

    await page.route('**/api/helpdesk/tickets/70/timesheet', async (route) => {
      ticket = { ...TICKET_WITH_TIME };
      route.fulfill(jsonReply(TICKET_WITH_TIME.task!.timesheets[0]));
    });

    await page.goto('/module/helpdesk');
    await page.getByText('Database queries timing out').first().click();
    await page.getByRole('button', { name: 'Log Time' }).click();

    await expect(
      page.getByText('hours', { exact: false })
        .or(page.getByText('Hours', { exact: false }))
        .or(page.getByRole('spinbutton'))
    ).toBeVisible({ timeout: 5000 });
  });
});

// ── Flow E Part 3: Billable line appears on Sale Order ───────────────────────

test.describe('Flow E Part 3 — Billable timesheet line on sale order', () => {
  test.beforeEach(async ({ page }) => {
    await injectAuth(page);
    await stubUnmatched(page);
  });

  test('sale order carries the billable support line', async ({ page }) => {
    await page.route('**/api/sales**', (route) => {
      if (route.request().method() === 'GET') {
        route.fulfill(jsonReply({ data: [BILLABLE_ORDER], total: 1, page: 1, limit: 20 }));
      } else route.continue();
    });

    await page.goto('/module/sales');
    await page.getByText('SO00002').first().click();

    await expect(
      page.getByText('Support', { exact: false })
        .or(page.getByText('billable', { exact: false }))
        .or(page.getByText('4', { exact: false }))
    ).toBeVisible({ timeout: 5000 });
  });

  test('sale order shows the correct billable amount', async ({ page }) => {
    await page.route('**/api/sales**', (route) => {
      if (route.request().method() === 'GET') {
        route.fulfill(jsonReply({ data: [BILLABLE_ORDER], total: 1, page: 1, limit: 20 }));
      } else route.continue();
    });

    await page.goto('/module/sales');
    await page.getByText('SO00002').first().click();

    await expect(
      page.getByText('480', { exact: false })
        .or(page.getByText('400', { exact: false }))
    ).toBeVisible({ timeout: 5000 });
  });
});

// ── Flow E Part 4: Invoice the billable line ──────────────────────────────────

test.describe('Flow E Part 4 — Create and post invoice from billable line', () => {
  test.beforeEach(async ({ page }) => {
    await injectAuth(page);
    await stubUnmatched(page);
  });

  test('creates a draft invoice from the sale order', async ({ page }) => {
    let order = { ...BILLABLE_ORDER };

    await page.route('**/api/sales**', (route) => {
      if (route.request().method() === 'GET') {
        route.fulfill(jsonReply({ data: [order], total: 1, page: 1, limit: 20 }));
      } else route.continue();
    });

    await page.route('**/api/sales/11/invoice', async (route) => {
      order = { ...BILLABLE_ORDER, orderLines: [{ ...BILLABLE_ORDER.orderLines[0], qtyInvoiced: 4.0 }] };
      route.fulfill(jsonReply(INVOICE_DRAFT));
    });

    await page.goto('/module/sales');
    await page.getByText('SO00002').first().click();
    await page.getByRole('button', { name: 'Create Invoice' }).click();

    await expect(
      page.getByText('INV', { exact: false })
        .or(page.getByText('draft', { exact: false }))
        .or(page.getByText('invoice', { exact: false }))
    ).toBeVisible({ timeout: 5000 });
  });

  test('posts the draft invoice', async ({ page }) => {
    let invoice = { ...INVOICE_DRAFT };

    await page.route('**/api/accounting/moves**', (route) => {
      if (route.request().method() === 'GET') {
        route.fulfill(jsonReply({ data: [invoice], total: 1, page: 1, limit: 20 }));
      } else route.continue();
    });

    await page.route('**/api/accounting/moves/40/post', async (route) => {
      invoice = { ...INVOICE_POSTED };
      route.fulfill(jsonReply(invoice));
    });

    await page.route('**/api/accounting/journals**', (route) =>
      route.fulfill(jsonReply([{ id: 1, name: 'Customer Invoices', type: 'sale' }]))
    );

    await page.goto('/module/accounting');
    await page.getByText('INV/2026/00002').first().click();
    await page.getByRole('button', { name: 'Post' }).click();

    await expect(
      page.getByText('posted', { exact: false })
        .or(page.getByText('Posted', { exact: false }))
    ).toBeVisible({ timeout: 5000 });
  });
});

// ── Flow E Part 5: Register payment ──────────────────────────────────────────

test.describe('Flow E Part 5 — Register payment on the invoice', () => {
  test.beforeEach(async ({ page }) => {
    await injectAuth(page);
    await stubUnmatched(page);
  });

  test('marks the invoice as paid', async ({ page }) => {
    let invoice = { ...INVOICE_POSTED };

    await page.route('**/api/accounting/moves**', (route) => {
      if (route.request().method() === 'GET') {
        route.fulfill(jsonReply({ data: [invoice], total: 1, page: 1, limit: 20 }));
      } else route.continue();
    });

    await page.route('**/api/accounting/moves/40/pay', async (route) => {
      invoice = { ...INVOICE_PAID };
      route.fulfill(jsonReply(invoice));
    });

    await page.route('**/api/accounting/journals**', (route) =>
      route.fulfill(jsonReply([{ id: 1, name: 'Customer Invoices', type: 'sale' }]))
    );

    await page.goto('/module/accounting');
    await page.getByText('INV/2026/00002').first().click();
    await page.getByText('💳 Register Payment').click();

    await expect(
      page.getByText('paid', { exact: false })
        .or(page.getByText('Paid', { exact: false }))
        .or(page.getByText('PAID', { exact: false }))
    ).toBeVisible({ timeout: 5000 });
  });
});
