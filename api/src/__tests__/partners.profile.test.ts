/**
 * Integration tests for GET /api/partners/:id/profile
 *
 * Prisma is fully mocked so no live database is required.
 * Tests verify the 360° aggregated response shape, 404 handling,
 * and summary KPI computation.
 */

import request from 'supertest';
import express from 'express';
import { partnerRoutes } from '../routes/partners';

// ── Bypass requireAuth for unit/integration tests that use mocked Prisma ──────
jest.mock('../core/auth', () => ({
    requireAuth: (_req: any, _res: any, next: any) => next(),
    requirePermission: () => (_req: any, _res: any, next: any) => next(),
}));

// ── Mock Prisma ──────────────────────────────────────────────────────────────
jest.mock('../lib/prisma', () => {
  const mockPartner = {
    id: 'cltest000000000partner',
    name: 'Test Corp',
    email: 'test@corp.com',
    isCompany: true,
    active: true,
    parent: null,
    children: [],
    tags: [],
  };

  const mockSaleOrders = [
    { id: 'so1', name: 'S0001', state: 'done', amountTotal: 1500, createdAt: new Date() },
    { id: 'so2', name: 'S0002', state: 'draft', amountTotal: 500, createdAt: new Date() },
  ];

  const mockCrmLeads = [
    { id: 'l1', name: 'Lead A', stage: 'new', probability: 50, expectedRevenue: 5000, createdAt: new Date() },
    { id: 'l2', name: 'Lead B', stage: 'won', probability: 100, expectedRevenue: 3000, createdAt: new Date() },
  ];

  const mockPurchaseOrders = [
    { id: 'po1', name: 'PO001', state: 'done', amountTotal: 800, createdAt: new Date() },
  ];

  return {
    __esModule: true,
    default: {
      partner: {
        findFirst: jest.fn().mockResolvedValue(mockPartner),
        findMany: jest.fn().mockResolvedValue([]),
        create: jest.fn(),
        update: jest.fn(),
        count: jest.fn().mockResolvedValue(0),
      },
      saleOrder: {
        findMany: jest.fn().mockResolvedValue(mockSaleOrders),
      },
      crmLead: {
        findMany: jest.fn().mockResolvedValue(mockCrmLeads),
      },
      purchaseOrder: {
        findMany: jest.fn().mockResolvedValue(mockPurchaseOrders),
      },
      loyaltyCard: { findFirst: jest.fn(), create: jest.fn(), update: jest.fn() },
      loyaltyProgram: { findFirst: jest.fn(), create: jest.fn() },
    },
  };
});

// ── Test app ─────────────────────────────────────────────────────────────────
function buildApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/partners', partnerRoutes);
  return app;
}

describe('GET /api/partners/:id/profile', () => {
  const app = buildApp();

  it('returns 200 with the expected aggregated shape', async () => {
    const res = await request(app).get('/api/partners/cltest000000000partner/profile');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('partner');
    expect(res.body).toHaveProperty('summary');
    expect(res.body).toHaveProperty('crm');
    expect(res.body).toHaveProperty('sales');
    expect(res.body).toHaveProperty('purchases');
    expect(res.body).toHaveProperty('invoices');
    expect(res.body).toHaveProperty('helpdesk');
    expect(res.body).toHaveProperty('activities');
    expect(res.body).toHaveProperty('documents');
    expect(res.body).toHaveProperty('timeline');
  });

  it('computes saleTotal correctly from sale orders', async () => {
    const res = await request(app).get('/api/partners/cltest000000000partner/profile');

    expect(res.status).toBe(200);
    // 1500 + 500 = 2000
    expect(res.body.summary.saleTotal).toBe(2000);
    expect(res.body.summary.saleOrderCount).toBe(2);
  });

  it('computes openLeads correctly (excludes won/lost)', async () => {
    const res = await request(app).get('/api/partners/cltest000000000partner/profile');

    // Lead A = 'new' (open), Lead B = 'won' (closed)  → 1 open
    expect(res.body.summary.openLeads).toBe(1);
  });

  it('includes purchaseTotal in summary', async () => {
    const res = await request(app).get('/api/partners/cltest000000000partner/profile');

    expect(res.body.summary.purchaseTotal).toBe(800);
    expect(res.body.summary.purchaseOrderCount).toBe(1);
  });

  it('returns 404 when partner does not exist', async () => {
    // Override the mock just for this test
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const prisma = require('../lib/prisma').default;
    prisma.partner.findFirst.mockResolvedValueOnce(null);

    const res = await request(app).get('/api/partners/nonexistent-id/profile');

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error', 'Partner not found');
  });

  it('partner object contains expected fields', async () => {
    const res = await request(app).get('/api/partners/cltest000000000partner/profile');

    expect(res.body.partner).toMatchObject({
      id: 'cltest000000000partner',
      name: 'Test Corp',
      email: 'test@corp.com',
    });
  });
});

describe('GET /api/partners/:id (single partner)', () => {
  const app = buildApp();

  it('returns 200 with partner data', async () => {
    const res = await request(app).get('/api/partners/cltest000000000partner');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('id', 'cltest000000000partner');
  });

  it('returns 404 for unknown partner', async () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const prisma = require('../lib/prisma').default;
    prisma.partner.findFirst.mockResolvedValueOnce(null);

    const res = await request(app).get('/api/partners/no-such-id');
    expect(res.status).toBe(404);
  });
});
