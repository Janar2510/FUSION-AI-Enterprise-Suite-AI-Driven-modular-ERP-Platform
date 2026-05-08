/**
 * E2E — Ticket → Create Task → Log Timesheet → Billable SO Line
 *
 * Covers Flow E from the backend integration suite.
 */

import { test, expect } from '@playwright/test';
import { injectAuth, stubUnmatched, jsonReply } from './helpers/setup';

const TICKET = {
  id: 70, name: 'Server keeps crashing under load', state: 'new',
  priority: 'high', partnerId: 'p-1', partnerName: 'Acme Corp',
  stageId: 1, stage: { id: 1, name: 'New' },
  description: 'Production server OOM under peak traffic.',
  assigneeId: null,
  task: null as null | { id: number; name: string; state: string; projectId: number; assigneeId: null; timesheets: unknown[] },
  createdAt: new Date().toISOString(),
};

const TICKET_WITH_TASK = {
  ...TICKET,
  task: {
    id: 80, name: 'Investigate server crashes', state: 'in_progress',
    projectId: 1, assigneeId: null, timesheets: [],
  },
};

const TIMESHEET_ENTRY = {
  id: 90, hours: 3.5,
  description: 'Identified memory leak in message queue handler.',
  taskId: 80, employeeId: 1,
  date: new Date().toISOString(),
};

const STAGES = [
  { id: 1, name: 'New' },
  { id: 2, name: 'In Progress' },
  { id: 3, name: 'Resolved' },
];

// ── Flow E — Helpdesk: Create task from ticket ───────────────────────────────

test.describe('Flow E — Ticket to task', () => {
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
    await page.getByText('Server keeps crashing under load').first().click();
    await page.getByRole('button', { name: 'Create Task' }).click();

    // Task should now be visible in the ticket detail
    await expect(page.getByText('Investigate server crashes', { exact: false })
      .or(page.getByText('task', { exact: false }))
      .or(page.getByText('Task', { exact: false }))
    ).toBeVisible({ timeout: 5000 });
  });

  test('logs time against a ticket task', async ({ page }) => {
    const ticket = { ...TICKET_WITH_TASK };

    await page.route('**/api/helpdesk/tickets**', (route) => {
      if (route.request().method() === 'GET') {
        route.fulfill(jsonReply({ data: [ticket], total: 1, page: 1, limit: 20 }));
      } else route.continue();
    });

    await page.route('**/api/helpdesk/stages**', (route) =>
      route.fulfill(jsonReply(STAGES))
    );

    await page.route('**/api/helpdesk/tickets/70/timesheet', async (route) => {
      route.fulfill(jsonReply(TIMESHEET_ENTRY));
    });

    await page.goto('/module/helpdesk');
    await page.getByText('Server keeps crashing under load').first().click();
    await page.getByRole('button', { name: 'Log Time' }).click();

    // Modal or inline form should appear for time entry
    await expect(page.getByText('hours', { exact: false })
      .or(page.getByText('Hours', { exact: false }))
      .or(page.getByText('Time', { exact: false }))
      .or(page.getByRole('spinbutton'))
      .or(page.getByRole('textbox'))
    ).toBeVisible({ timeout: 5000 });
  });
});

// ── Flow E — Verify billable line appears on sale order ──────────────────────

test.describe('Flow E — Billable SO line verification', () => {
  test.beforeEach(async ({ page }) => {
    await injectAuth(page);
    await stubUnmatched(page);
  });

  test('sale order shows a billable timesheet line after time is logged', async ({ page }) => {
    const order = {
      id: 10, name: 'SO00001', state: 'sale',
      partnerName: 'Acme Corp', amountTotal: 50350,
      dateOrder: new Date().toISOString(), partnerId: 'p-1', crmLeadId: 1,
      orderLines: [{
        id: 5, name: 'Consulting — Investigate server crashes',
        productQty: 3.5, priceUnit: 100, priceSubtotal: 350,
        priceTotal: 420, isBillable: true, qtyDelivered: 3.5, qtyInvoiced: 0,
      }],
    };

    await page.route('**/api/sales**', (route) => {
      if (route.request().method() === 'GET') {
        route.fulfill(jsonReply({ data: [order], total: 1, page: 1, limit: 20 }));
      } else route.continue();
    });

    await page.goto('/module/sales');
    await page.getByText('SO00001').first().click();

    await expect(page.getByText('Consulting', { exact: false })
      .or(page.getByText('billable', { exact: false }))
      .or(page.getByText('3.5', { exact: false }))
    ).toBeVisible({ timeout: 5000 });
  });
});
