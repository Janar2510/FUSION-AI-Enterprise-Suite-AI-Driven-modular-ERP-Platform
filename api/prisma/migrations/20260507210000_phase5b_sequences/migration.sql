-- CreateTable: ir_sequences (document numbering)
CREATE TABLE "ir_sequences" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "prefix" TEXT NOT NULL DEFAULT '',
    "suffix" TEXT NOT NULL DEFAULT '',
    "padding" INTEGER NOT NULL DEFAULT 4,
    "nextNumber" INTEGER NOT NULL DEFAULT 1,
    "step" INTEGER NOT NULL DEFAULT 1,
    "companyId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ir_sequences_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ir_sequences_name_key" ON "ir_sequences"("name");

-- Seed default sequences for all document types
INSERT INTO "ir_sequences" ("id", "name", "label", "prefix", "padding", "nextNumber", "step", "updatedAt")
VALUES
  (gen_random_uuid()::text, 'sale.order',               'Sales Order',          'SO',    4, 1, 1, NOW()),
  (gen_random_uuid()::text, 'account.move.out_invoice', 'Customer Invoice',     'INV',   4, 1, 1, NOW()),
  (gen_random_uuid()::text, 'account.move.out_refund',  'Credit Note',          'RINV',  4, 1, 1, NOW()),
  (gen_random_uuid()::text, 'account.move.in_invoice',  'Vendor Bill',          'BILL',  4, 1, 1, NOW()),
  (gen_random_uuid()::text, 'account.move.in_refund',   'Vendor Credit',        'RBILL', 4, 1, 1, NOW()),
  (gen_random_uuid()::text, 'purchase.order',           'Purchase Order',       'PO',    4, 1, 1, NOW()),
  (gen_random_uuid()::text, 'stock.picking.in',         'Receipt',              'WH/IN', 4, 1, 1, NOW()),
  (gen_random_uuid()::text, 'stock.picking.out',        'Delivery Order',       'WH/OUT',4, 1, 1, NOW()),
  (gen_random_uuid()::text, 'stock.picking.internal',   'Internal Transfer',    'WH/INT',4, 1, 1, NOW()),
  (gen_random_uuid()::text, 'crm.lead',                 'Lead/Opportunity',     'CRM',   4, 1, 1, NOW()),
  (gen_random_uuid()::text, 'helpdesk.ticket',          'Support Ticket',       'TKT',   4, 1, 1, NOW()),
  (gen_random_uuid()::text, 'account.payment.customer', 'Customer Payment',     'CUST',  4, 1, 1, NOW()),
  (gen_random_uuid()::text, 'account.payment.vendor',   'Vendor Payment',       'VEND',  4, 1, 1, NOW());
