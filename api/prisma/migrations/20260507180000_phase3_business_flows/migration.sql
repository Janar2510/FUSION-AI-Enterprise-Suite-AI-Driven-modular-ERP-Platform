-- Phase 3: End-to-End Business Flows
-- Adds idempotency keys, AccountPayment, billable fields, and cross-module links.

-- ── SaleOrder: organizationId + idempotencyKey ────────────────────────────────
ALTER TABLE "sale_orders"
  ADD COLUMN IF NOT EXISTS "organizationId"  TEXT,
  ADD COLUMN IF NOT EXISTS "idempotencyKey"  TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "sale_orders_idempotencyKey_key"
  ON "sale_orders"("idempotencyKey");

CREATE INDEX IF NOT EXISTS "sale_orders_organizationId_idx"
  ON "sale_orders"("organizationId");

-- ── SaleOrderLine: billable tracking ─────────────────────────────────────────
ALTER TABLE "sale_order_lines"
  ADD COLUMN IF NOT EXISTS "isBillable"    BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "qtyDelivered"  DOUBLE PRECISION NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "qtyInvoiced"   DOUBLE PRECISION NOT NULL DEFAULT 0;

-- ── CrmLead: organizationId ───────────────────────────────────────────────────
ALTER TABLE "crm_leads"
  ADD COLUMN IF NOT EXISTS "organizationId" TEXT;

CREATE INDEX IF NOT EXISTS "crm_leads_organizationId_idx"
  ON "crm_leads"("organizationId");

-- ── PurchaseOrder: organizationId + idempotencyKey ────────────────────────────
ALTER TABLE "purchase_orders"
  ADD COLUMN IF NOT EXISTS "organizationId"  TEXT,
  ADD COLUMN IF NOT EXISTS "idempotencyKey"  TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "purchase_orders_idempotencyKey_key"
  ON "purchase_orders"("idempotencyKey");

CREATE INDEX IF NOT EXISTS "purchase_orders_organizationId_idx"
  ON "purchase_orders"("organizationId");

-- ── AccountMove: organizationId + idempotencyKey + purchaseOrderId + postedAt ──
ALTER TABLE "account_moves"
  ADD COLUMN IF NOT EXISTS "organizationId"   TEXT,
  ADD COLUMN IF NOT EXISTS "idempotencyKey"   TEXT,
  ADD COLUMN IF NOT EXISTS "purchaseOrderId"  INTEGER,
  ADD COLUMN IF NOT EXISTS "postedAt"         TIMESTAMP(3);

CREATE UNIQUE INDEX IF NOT EXISTS "account_moves_idempotencyKey_key"
  ON "account_moves"("idempotencyKey");

CREATE INDEX IF NOT EXISTS "account_moves_organizationId_idx"
  ON "account_moves"("organizationId");

ALTER TABLE "account_moves"
  ADD CONSTRAINT "account_moves_purchaseOrderId_fkey"
  FOREIGN KEY ("purchaseOrderId") REFERENCES "purchase_orders"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- ── AccountPayment (new model) ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "account_payments" (
  "id"              SERIAL       PRIMARY KEY,
  "name"            TEXT         NOT NULL,
  "moveType"        TEXT         NOT NULL,
  "paymentType"     TEXT         NOT NULL DEFAULT 'inbound',
  "partnerType"     TEXT         NOT NULL DEFAULT 'customer',
  "state"           TEXT         NOT NULL DEFAULT 'draft',
  "date"            TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "amount"          DOUBLE PRECISION NOT NULL DEFAULT 0,
  "currency"        TEXT         NOT NULL DEFAULT 'EUR',
  "memo"            TEXT,
  "journalId"       INTEGER      NOT NULL,
  "partnerId"       TEXT,
  "moveId"          INTEGER,
  "idempotencyKey"  TEXT,
  "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS "account_payments_name_key"
  ON "account_payments"("name");

CREATE UNIQUE INDEX IF NOT EXISTS "account_payments_idempotencyKey_key"
  ON "account_payments"("idempotencyKey");

ALTER TABLE "account_payments"
  ADD CONSTRAINT "account_payments_journalId_fkey"
  FOREIGN KEY ("journalId") REFERENCES "account_journals"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "account_payments"
  ADD CONSTRAINT "account_payments_partnerId_fkey"
  FOREIGN KEY ("partnerId") REFERENCES "partners"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "account_payments"
  ADD CONSTRAINT "account_payments_moveId_fkey"
  FOREIGN KEY ("moveId") REFERENCES "account_moves"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- ── HrTimesheet: billable + saleOrderLineId ───────────────────────────────────
ALTER TABLE "hr_timesheets"
  ADD COLUMN IF NOT EXISTS "isBillable"       BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "billedAmount"     DOUBLE PRECISION NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "saleOrderLineId"  INTEGER;

ALTER TABLE "hr_timesheets"
  ADD CONSTRAINT "hr_timesheets_saleOrderLineId_fkey"
  FOREIGN KEY ("saleOrderLineId") REFERENCES "sale_order_lines"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- ── HelpdeskTicket: project + task + saleOrder links ─────────────────────────
ALTER TABLE "helpdesk_tickets"
  ADD COLUMN IF NOT EXISTS "projectId"      INTEGER,
  ADD COLUMN IF NOT EXISTS "projectTaskId"  INTEGER,
  ADD COLUMN IF NOT EXISTS "saleOrderId"    INTEGER;

CREATE UNIQUE INDEX IF NOT EXISTS "helpdesk_tickets_projectTaskId_key"
  ON "helpdesk_tickets"("projectTaskId");

ALTER TABLE "helpdesk_tickets"
  ADD CONSTRAINT "helpdesk_tickets_projectTaskId_fkey"
  FOREIGN KEY ("projectTaskId") REFERENCES "project_tasks"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- ── ProjectTask: saleOrderLineId ──────────────────────────────────────────────
ALTER TABLE "project_tasks"
  ADD COLUMN IF NOT EXISTS "saleOrderLineId" INTEGER;
