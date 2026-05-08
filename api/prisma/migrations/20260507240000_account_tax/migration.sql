-- CreateTable
CREATE TABLE "account_taxes" (
    "id"           SERIAL          NOT NULL,
    "name"         TEXT            NOT NULL,
    "amount"       DOUBLE PRECISION NOT NULL DEFAULT 0,
    "amountType"   TEXT            NOT NULL DEFAULT 'percent',
    "priceInclude" BOOLEAN         NOT NULL DEFAULT false,
    "active"       BOOLEAN         NOT NULL DEFAULT true,
    "isDefault"    BOOLEAN         NOT NULL DEFAULT false,
    "description"  TEXT,
    "createdAt"    TIMESTAMP(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"    TIMESTAMP(3)    NOT NULL,

    CONSTRAINT "account_taxes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "account_taxes_active_isDefault_idx" ON "account_taxes"("active", "isDefault");
