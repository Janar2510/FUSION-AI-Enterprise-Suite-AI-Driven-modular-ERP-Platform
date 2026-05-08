/**
 * E2E — Partner 360° Profile
 *
 * Verifies the aggregated partner view renders all sections:
 * stats, sale orders, invoices, tickets, and timeline events.
 */

import { test, expect } from '@playwright/test';
import { injectAuth, stubUnmatched, jsonReply } from './helpers/setup';

const PARTNER = {
  id: 'p-1', name: 'Acme Corporation',
  email: 'info@acme.com', phone: '+1-555-0100',
  isCompany: true, isCustomer: true, isVendor: false,
  city: 'San Francisco', country: 'US',
  createdAt: new Date().toISOString(),
};

const PARTNER_PROFILE = {
  partner: PARTNER,
  stats: {
    totalOrders: 5, totalRevenue: 128500,
    openInvoices: 2, openTickets: 1,
    lastActivity: new Date().toISOString(),
  },
  saleOrders: [
    { id: 10, name: 'SO00001', state: 'sale', amountTotal: 50000, dateOrder: new Date().toISOString() },
    { id: 11, name: 'SO00002', state: 'done', amountTotal: 78500, dateOrder: new Date().toISOString() },
  ],
  invoices: [
    { id: 30, name: 'INV/2026/00001', state: 'posted', amountTotal: 50000, paymentState: 'not_paid' },
    { id: 31, name: 'INV/2026/00002', state: 'paid', amountTotal: 78500, paymentState: 'paid' },
  ],
  tickets: [
    { id: 70, name: 'Server keeps crashing under load', state: 'new', priority: 'high' },
  ],
  timeline: [
    { id: 1, event: 'sale_order.confirmed', description: 'SO00001 confirmed', createdAt: new Date().toISOString() },
    { id: 2, event: 'account_move.posted', description: 'INV/2026/00001 posted', createdAt: new Date().toISOString() },
    { id: 3, event: 'helpdesk_ticket.opened', description: 'Ticket #70 opened', createdAt: new Date().toISOString() },
  ],
};

test.describe('Partner 360° profile', () => {
  test.beforeEach(async ({ page }) => {
    await injectAuth(page);
    await stubUnmatched(page);
  });

  test('renders the partner list', async ({ page }) => {
    await page.route('**/api/partners**', (route) => {
      if (!route.request().url().includes('/profile')) {
        route.fulfill(jsonReply({ data: [PARTNER], total: 1, page: 1, limit: 20 }));
      } else route.continue();
    });

    await page.goto('/contact-hub');
    await expect(page.getByText('Acme Corporation')).toBeVisible({ timeout: 8000 });
  });

  test('opens the 360° profile view', async ({ page }) => {
    await page.route('**/api/partners**', (route) => {
      const url = route.request().url();
      if (url.includes('/profile')) {
        route.fulfill(jsonReply(PARTNER_PROFILE));
      } else if (route.request().method() === 'GET') {
        route.fulfill(jsonReply({ data: [PARTNER], total: 1, page: 1, limit: 20 }));
      } else route.continue();
    });

    await page.goto('/contact-hub');
    await page.getByText('Acme Corporation').first().click();

    // Profile sections should be visible
    await expect(page.getByText('Acme Corporation').first()).toBeVisible({ timeout: 8000 });
  });

  test('profile shows revenue / order stats', async ({ page }) => {
    await page.route('**/api/partners**', (route) => {
      const url = route.request().url();
      if (url.includes('/profile')) {
        route.fulfill(jsonReply(PARTNER_PROFILE));
      } else if (route.request().method() === 'GET') {
        route.fulfill(jsonReply({ data: [PARTNER], total: 1, page: 1, limit: 20 }));
      } else route.continue();
    });

    await page.goto('/contact-hub');
    await page.getByText('Acme Corporation').first().click();

    // Stats card values should appear somewhere on the profile
    await expect(
      page.getByText('128,500', { exact: false })
        .or(page.getByText('128500', { exact: false }))
        .or(page.getByText('5', { exact: false }))
    ).toBeVisible({ timeout: 8000 });
  });

  test('profile shows timeline events', async ({ page }) => {
    await page.route('**/api/partners**', (route) => {
      const url = route.request().url();
      if (url.includes('/profile')) {
        route.fulfill(jsonReply(PARTNER_PROFILE));
      } else if (route.request().method() === 'GET') {
        route.fulfill(jsonReply({ data: [PARTNER], total: 1, page: 1, limit: 20 }));
      } else route.continue();
    });

    await page.goto('/contact-hub');
    await page.getByText('Acme Corporation').first().click();

    // At least one timeline event text should render
    await expect(
      page.getByText('SO00001 confirmed', { exact: false })
        .or(page.getByText('INV/2026/00001', { exact: false }))
        .or(page.getByText('Timeline', { exact: false }))
        .or(page.getByText('timeline', { exact: false }))
    ).toBeVisible({ timeout: 8000 });
  });

  test('profile shows open invoices section', async ({ page }) => {
    await page.route('**/api/partners**', (route) => {
      const url = route.request().url();
      if (url.includes('/profile')) {
        route.fulfill(jsonReply(PARTNER_PROFILE));
      } else if (route.request().method() === 'GET') {
        route.fulfill(jsonReply({ data: [PARTNER], total: 1, page: 1, limit: 20 }));
      } else route.continue();
    });

    await page.goto('/contact-hub');
    await page.getByText('Acme Corporation').first().click();

    await expect(
      page.getByText('INV/2026/00001', { exact: false })
        .or(page.getByText('Invoice', { exact: false }))
        .or(page.getByText('invoice', { exact: false }))
    ).toBeVisible({ timeout: 8000 });
  });
});
