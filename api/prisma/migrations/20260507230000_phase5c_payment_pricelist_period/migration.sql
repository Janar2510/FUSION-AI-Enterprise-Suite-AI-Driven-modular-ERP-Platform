-- G-08: Payment Terms
CREATE TABLE "payment_terms" (
    "id" SERIAL PRIMARY KEY,
    "name" TEXT NOT NULL UNIQUE,
    "note" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE TABLE "payment_term_lines" (
    "id" SERIAL PRIMARY KEY,
    "paymentTermId" INTEGER NOT NULL REFERENCES "payment_terms"("id") ON DELETE CASCADE,
    "sequence" INTEGER NOT NULL DEFAULT 10,
    "value" TEXT NOT NULL DEFAULT 'percent',
    "valueAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "days" INTEGER NOT NULL DEFAULT 0,
    "dayType" TEXT NOT NULL DEFAULT 'after_invoice_date'
);
CREATE INDEX "payment_term_lines_paymentTermId_idx" ON "payment_term_lines"("paymentTermId");

-- G-09: Customer Pricelists
CREATE TABLE "pricelists" (
    "id" SERIAL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "currencyCode" TEXT NOT NULL DEFAULT 'EUR',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE TABLE "pricelist_lines" (
    "id" SERIAL PRIMARY KEY,
    "pricelistId" INTEGER NOT NULL REFERENCES "pricelists"("id") ON DELETE CASCADE,
    "productId" TEXT REFERENCES "products"("id") ON DELETE SET NULL,
    "minQty" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "priceDiscount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "fixedPrice" DOUBLE PRECISION,
    "dateStart" TIMESTAMP(3),
    "dateEnd" TIMESTAMP(3)
);
CREATE INDEX "pricelist_lines_pricelistId_idx" ON "pricelist_lines"("pricelistId");
CREATE INDEX "pricelist_lines_productId_idx" ON "pricelist_lines"("productId");

-- Add pricelist + payment term FK to partners
ALTER TABLE "partners" ADD COLUMN "paymentTermId" INTEGER REFERENCES "payment_terms"("id") ON DELETE SET NULL;
ALTER TABLE "partners" ADD COLUMN "pricelistId" INTEGER REFERENCES "pricelists"("id") ON DELETE SET NULL;

-- G-11: Accounting Periods
CREATE TABLE "accounting_periods" (
    "id" SERIAL PRIMARY KEY,
    "companyId" TEXT,
    "name" TEXT NOT NULL,
    "dateStart" TIMESTAMP(3) NOT NULL,
    "dateStop" TIMESTAMP(3) NOT NULL,
    "locked" BOOLEAN NOT NULL DEFAULT false,
    "closedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE INDEX "accounting_periods_companyId_idx" ON "accounting_periods"("companyId");

-- Seed default payment terms
INSERT INTO "payment_terms" ("name", "note", "updatedAt") VALUES
  ('Immediate', 'Due upon receipt', NOW()),
  ('Net 30', 'Due within 30 days', NOW()),
  ('Net 60', 'Due within 60 days', NOW()),
  ('50% Upfront', '50% on order, 50% on delivery', NOW());

-- Insert payment term lines for Net 30
INSERT INTO "payment_term_lines" ("paymentTermId", "value", "valueAmount", "days", "dayType")
SELECT id, 'balance', 100, 30, 'after_invoice_date' FROM "payment_terms" WHERE name = 'Net 30';

-- Insert payment term lines for Net 60
INSERT INTO "payment_term_lines" ("paymentTermId", "value", "valueAmount", "days", "dayType")
SELECT id, 'balance', 100, 60, 'after_invoice_date' FROM "payment_terms" WHERE name = 'Net 60';

-- Insert payment term lines for Immediate
INSERT INTO "payment_term_lines" ("paymentTermId", "value", "valueAmount", "days", "dayType")
SELECT id, 'balance', 100, 0, 'after_invoice_date' FROM "payment_terms" WHERE name = 'Immediate';
