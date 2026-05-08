/**
 * E2E — RFQ → Confirm PO → Receive → Vendor Bill → Post → Pay
 *
 * Covers Flow D from the backend integration suite.
 */

import { test, expect } from '@playwright/test';
import { injectAuth, stubUnmatched, jsonReply } from './helpers/setup';

const RFQ = {
  id: 40, name: 'PO00001', state: 'draft',
  partnerId: 'p-2', partnerName: 'TechParts Ltd',
  amountTotal: 12000, amountUntaxed: 10000, amountTax: 2000,
  dateOrder: new Date().toISOString(),
  orderLines: [],
};
const PO_CONFIRMED = { ...RFQ, state: 'purchase' };

const RECEIPT = {
  id: 50, name: 'WH/IN/00001', state: 'assigned',
  origin: 'PO00001', scheduledDate: new Date().toISOString(),
  locationId: 5, locationDestId: 8, moveLines: [],
};
const RECEIPT_DONE = { ...RECEIPT, state: 'done' };

const VENDOR_BILL_DRAFT = {
  id: 60, name: 'BILL/2026/00001', state: 'draft',
  moveType: 'in_invoice', amountTotal: 12000,
  partnerId: 'p-2', partnerName: 'TechParts Ltd', paymentState: 'not_paid',
  invoiceDate: new Date().toISOString(), invoiceLines: [],
};
const VENDOR_BILL_POSTED = { ...VENDOR_BILL_DRAFT, state: 'posted' };
const VENDOR_BILL_PAID = { ...VENDOR_BILL_POSTED, paymentState: 'paid' };

// ── Flow D — Purchases: RFQ → Confirm PO ────────────────────────────────────

test.describe('Flow D — Purchase order confirmation', () => {
  test.beforeEach(async ({ page }) => {
    await injectAuth(page);
    await stubUnmatched(page);
  });

  test('confirms a draft RFQ to a purchase order', async ({ page }) => {
    let po = { ...RFQ };

    await page.route('**/api/purchases**', (route) => {
      if (route.request().method() === 'GET') {
        route.fulfill(jsonReply({ data: [po], total: 1, page: 1, limit: 20 }));
      } else route.continue();
    });

    await page.route('**/api/purchases/40/confirm', async (route) => {
      po = { ...PO_CONFIRMED };
      route.fulfill(jsonReply(po));
    });

    await page.goto('/module/purchases');
    await page.getByText('PO00001').first().click();
    await page.getByRole('button', { name: 'Confirm Order' }).click();

    await expect(page.getByText('purchase', { exact: false })
      .or(page.getByText('Purchase Order', { exact: false }))
      .or(page.getByText('CONFIRMED', { exact: false }))
    ).toBeVisible({ timeout: 5000 });
  });
});

// ── Flow D — Inventory: Validate receipt ────────────────────────────────────

test.describe('Flow D — Inventory receipt', () => {
  test.beforeEach(async ({ page }) => {
    await injectAuth(page);
    await stubUnmatched(page);
  });

  test('validates an incoming receipt', async ({ page }) => {
    let picking = { ...RECEIPT };

    await page.route('**/api/inventory/pickings**', (route) => {
      if (route.request().method() === 'GET') {
        route.fulfill(jsonReply({ data: [picking], total: 1, page: 1, limit: 20 }));
      } else route.continue();
    });

    await page.route('**/api/inventory/pickings/50/ready', async (route) => {
      picking = { ...picking, state: 'ready' };
      route.fulfill(jsonReply(picking));
    });

    await page.route('**/api/inventory/pickings/50/validate', async (route) => {
      picking = { ...RECEIPT_DONE };
      route.fulfill(jsonReply(picking));
    });

    await page.goto('/module/inventory');
    await page.getByText('WH/IN/00001').first().click();
    await page.getByRole('button', { name: 'Mark Ready' }).click();
    await page.getByRole('button', { name: 'Validate' }).click();

    await expect(page.getByText('done', { exact: false })
      .or(page.getByText('Done', { exact: false }))
    ).toBeVisible({ timeout: 5000 });
  });
});

// ── Flow D — Accounting: Vendor bill → Post → Pay ───────────────────────────

test.describe('Flow D — Vendor bill payment', () => {
  test.beforeEach(async ({ page }) => {
    await injectAuth(page);
    await stubUnmatched(page);
  });

  test('posts a vendor bill', async ({ page }) => {
    let bill = { ...VENDOR_BILL_DRAFT };

    await page.route('**/api/accounting/moves**', (route) => {
      if (route.request().method() === 'GET') {
        route.fulfill(jsonReply({ data: [bill], total: 1, page: 1, limit: 20 }));
      } else route.continue();
    });

    await page.route('**/api/accounting/moves/60/post', async (route) => {
      bill = { ...VENDOR_BILL_POSTED };
      route.fulfill(jsonReply(bill));
    });

    await page.route('**/api/accounting/journals**', (route) =>
      route.fulfill(jsonReply([{ id: 2, name: 'Vendor Bills', type: 'purchase' }]))
    );

    await page.goto('/module/accounting');
    await page.getByText('BILL/2026/00001').first().click();
    await page.getByRole('button', { name: 'Post' }).click();

    await expect(page.getByText('posted', { exact: false })
      .or(page.getByText('Posted', { exact: false }))
    ).toBeVisible({ timeout: 5000 });
  });

  test('registers payment on a posted vendor bill', async ({ page }) => {
    let bill = { ...VENDOR_BILL_POSTED };

    await page.route('**/api/accounting/moves**', (route) => {
      if (route.request().method() === 'GET') {
        route.fulfill(jsonReply({ data: [bill], total: 1, page: 1, limit: 20 }));
      } else route.continue();
    });

    await page.route('**/api/accounting/moves/60/pay', async (route) => {
      bill = { ...VENDOR_BILL_PAID };
      route.fulfill(jsonReply(bill));
    });

    await page.route('**/api/accounting/journals**', (route) =>
      route.fulfill(jsonReply([{ id: 2, name: 'Vendor Bills', type: 'purchase' }]))
    );

    await page.goto('/module/accounting');
    await page.getByText('BILL/2026/00001').first().click();
    await page.getByText('💳 Register Payment').click();

    await expect(page.getByText('paid', { exact: false })
      .or(page.getByText('Paid', { exact: false }))
    ).toBeVisible({ timeout: 5000 });
  });
});
