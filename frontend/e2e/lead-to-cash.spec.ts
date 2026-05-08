/**
 * E2E — Lead → Qualify → Won → Quotation → Confirm → Pick → Invoice → Pay
 *
 * Covers Flows A (CRM), B (Inventory), C (Accounting) from the backend suite.
 * All API calls are intercepted; no live database required.
 */

import { test, expect } from '@playwright/test';
import { injectAuth, stubUnmatched, jsonReply } from './helpers/setup';

const LEAD = {
  id: 1, name: 'Acme ERP Deal', type: 'lead', active: true,
  probability: 10, stageId: 1,
  stage: { id: 1, name: 'New', sequence: 1 },
  partner: { id: 'p-1', name: 'Acme Corp' },
  saleOrders: [], tags: [], dateClosed: null as string | null,
  amountExpected: 50000, userId: null,
};

const OPPORTUNITY = { ...LEAD, type: 'opportunity', probability: 50, stageId: 2 };
const WON_LEAD = { ...OPPORTUNITY, probability: 100, stageId: 5, dateClosed: new Date().toISOString() as string | null };

const SALE_ORDER_DRAFT = {
  id: 10, name: 'SO00001', state: 'draft', partnerName: 'Acme Corp',
  amountTotal: 50000, amountUntaxed: 41667, amountTax: 8333,
  dateOrder: new Date().toISOString(), partnerId: 'p-1', crmLeadId: 1,
  orderLines: [],
};
const SALE_ORDER_CONFIRMED = { ...SALE_ORDER_DRAFT, state: 'sale' };
const SALE_ORDER_DELIVERED = { ...SALE_ORDER_CONFIRMED, state: 'done' };

const PICKING = {
  id: 20, name: 'WH/OUT/00001', state: 'assigned',
  origin: 'SO00001', scheduledDate: new Date().toISOString(),
  locationId: 8, locationDestId: 5, moveLines: [],
};
const PICKING_DONE = { ...PICKING, state: 'done' };

const INVOICE_DRAFT = {
  id: 30, name: 'INV/2026/00001', state: 'draft',
  moveType: 'out_invoice', amountTotal: 50000,
  partnerId: 'p-1', partnerName: 'Acme Corp', paymentState: 'not_paid',
  invoiceDate: new Date().toISOString(), invoiceLines: [],
};
const INVOICE_POSTED = { ...INVOICE_DRAFT, state: 'posted' };
const INVOICE_PAID = { ...INVOICE_POSTED, paymentState: 'paid' };

// ── Flow A — CRM: Lead → Qualify → Won ───────────────────────────────────────

test.describe('Flow A — CRM qualification', () => {
  test.beforeEach(async ({ page }) => {
    await injectAuth(page);
    await stubUnmatched(page);
  });

  test('qualifies a lead to opportunity', async ({ page }) => {
    let lead = { ...LEAD };

    await page.route('**/api/crm/leads**', (route) => {
      if (route.request().method() === 'GET') {
        route.fulfill(jsonReply({ data: [lead], total: 1, page: 1, limit: 20 }));
      } else route.continue();
    });

    await page.route('**/api/crm/leads/1/qualify', async (route) => {
      lead = { ...OPPORTUNITY };
      route.fulfill(jsonReply(lead));
    });

    await page.route('**/api/crm/stages**', (route) =>
      route.fulfill(jsonReply([{ id: 1, name: 'New' }, { id: 2, name: 'Qualified' }, { id: 5, name: 'Closed Won' }]))
    );

    await page.goto('/module/crm');
    await page.getByText('Acme ERP Deal').first().click();
    await page.getByText('✓ Qualify').click();
    await expect(page.getByText('opportunity', { exact: false })).toBeVisible({ timeout: 5000 });
  });

  test('marks an opportunity as Won', async ({ page }) => {
    let lead = { ...OPPORTUNITY };

    await page.route('**/api/crm/leads**', (route) => {
      if (route.request().method() === 'GET') {
        route.fulfill(jsonReply({ data: [lead], total: 1, page: 1, limit: 20 }));
      } else route.continue();
    });

    await page.route('**/api/crm/leads/1/mark-won', async (route) => {
      lead = { ...WON_LEAD };
      route.fulfill(jsonReply(lead));
    });

    await page.route('**/api/crm/stages**', (route) =>
      route.fulfill(jsonReply([{ id: 1, name: 'New' }, { id: 2, name: 'Qualified' }, { id: 5, name: 'Closed Won' }]))
    );

    await page.goto('/module/crm');
    await page.getByText('Acme ERP Deal').first().click();
    await page.getByText('🏆 Mark Won').click();
    await expect(page.getByText('100', { exact: false })).toBeVisible({ timeout: 5000 });
  });
});

// ── Flow A (continued) — Sales: Quotation → Confirm ─────────────────────────

test.describe('Flow A — Sales order confirmation', () => {
  test.beforeEach(async ({ page }) => {
    await injectAuth(page);
    await stubUnmatched(page);
  });

  test('confirms a draft sale order', async ({ page }) => {
    let order = { ...SALE_ORDER_DRAFT };

    await page.route('**/api/sales**', (route) => {
      if (route.request().method() === 'GET') {
        route.fulfill(jsonReply({ data: [order], total: 1, page: 1, limit: 20 }));
      } else route.continue();
    });

    await page.route('**/api/sales/10/confirm', async (route) => {
      order = { ...SALE_ORDER_CONFIRMED };
      route.fulfill(jsonReply(order));
    });

    await page.goto('/module/sales');
    await page.getByText('SO00001').first().click();
    await page.getByRole('button', { name: 'Confirm Order' }).click();

    await expect(page.getByText('sale', { exact: false })
      .or(page.getByText('CONFIRMED', { exact: false }))
      .or(page.getByText('confirmed', { exact: false }))
    ).toBeVisible({ timeout: 5000 });
  });
});

// ── Flow B — Inventory: Pick → Mark Ready → Validate ────────────────────────

test.describe('Flow B — Inventory picking', () => {
  test.beforeEach(async ({ page }) => {
    await injectAuth(page);
    await stubUnmatched(page);
  });

  test('marks a picking ready and validates it', async ({ page }) => {
    let picking = { ...PICKING };

    await page.route('**/api/inventory/pickings**', (route) => {
      if (route.request().method() === 'GET') {
        route.fulfill(jsonReply({ data: [picking], total: 1, page: 1, limit: 20 }));
      } else route.continue();
    });

    await page.route('**/api/inventory/pickings/20/ready', async (route) => {
      picking = { ...picking, state: 'ready' };
      route.fulfill(jsonReply(picking));
    });

    await page.route('**/api/inventory/pickings/20/validate', async (route) => {
      picking = { ...PICKING_DONE };
      route.fulfill(jsonReply(picking));
    });

    await page.goto('/module/inventory');
    await page.getByText('WH/OUT/00001').first().click();
    await page.getByRole('button', { name: 'Mark Ready' }).click();
    await page.getByRole('button', { name: 'Validate' }).click();

    await expect(page.getByText('done', { exact: false })
      .or(page.getByText('Done', { exact: false }))
      .or(page.getByText('DONE', { exact: false }))
    ).toBeVisible({ timeout: 5000 });
  });
});

// ── Flow C — Accounting: Invoice → Post → Pay ────────────────────────────────

test.describe('Flow C — Invoice posting and payment', () => {
  test.beforeEach(async ({ page }) => {
    await injectAuth(page);
    await stubUnmatched(page);
  });

  test('posts a draft invoice', async ({ page }) => {
    let invoice = { ...INVOICE_DRAFT };

    await page.route('**/api/accounting/moves**', (route) => {
      if (route.request().method() === 'GET') {
        route.fulfill(jsonReply({ data: [invoice], total: 1, page: 1, limit: 20 }));
      } else route.continue();
    });

    await page.route('**/api/accounting/moves/30/post', async (route) => {
      invoice = { ...INVOICE_POSTED };
      route.fulfill(jsonReply(invoice));
    });

    await page.route('**/api/accounting/journals**', (route) =>
      route.fulfill(jsonReply([{ id: 1, name: 'Customer Invoices', type: 'sale' }]))
    );

    await page.goto('/module/accounting');
    await page.getByText('INV/2026/00001').first().click();
    await page.getByRole('button', { name: 'Post' }).click();

    await expect(page.getByText('posted', { exact: false })
      .or(page.getByText('Posted', { exact: false }))
    ).toBeVisible({ timeout: 5000 });
  });

  test('registers payment on a posted invoice', async ({ page }) => {
    let invoice = { ...INVOICE_POSTED };

    await page.route('**/api/accounting/moves**', (route) => {
      if (route.request().method() === 'GET') {
        route.fulfill(jsonReply({ data: [invoice], total: 1, page: 1, limit: 20 }));
      } else route.continue();
    });

    await page.route('**/api/accounting/moves/30/pay', async (route) => {
      invoice = { ...INVOICE_PAID };
      route.fulfill(jsonReply(invoice));
    });

    await page.route('**/api/accounting/journals**', (route) =>
      route.fulfill(jsonReply([{ id: 1, name: 'Customer Invoices', type: 'sale' }]))
    );

    await page.goto('/module/accounting');
    await page.getByText('INV/2026/00001').first().click();
    await page.getByText('💳 Register Payment').click();

    await expect(page.getByText('paid', { exact: false })
      .or(page.getByText('Paid', { exact: false }))
      .or(page.getByText('PAID', { exact: false }))
    ).toBeVisible({ timeout: 5000 });
  });
});
