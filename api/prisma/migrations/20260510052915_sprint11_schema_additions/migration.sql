-- AlterTable
ALTER TABLE "notes" ADD COLUMN     "tags" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "quality_points" ADD COLUMN     "toleranceMax" DOUBLE PRECISION,
ADD COLUMN     "toleranceMin" DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "bank_statements" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "journalId" INTEGER,
    "organizationId" TEXT,
    "dateStart" TIMESTAMP(3),
    "dateEnd" TIMESTAMP(3),
    "balance" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "state" TEXT NOT NULL DEFAULT 'open',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bank_statements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bank_statement_lines" (
    "id" SERIAL NOT NULL,
    "statementId" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "paymentRef" TEXT,
    "partnerId" TEXT,
    "amount" DECIMAL(18,2) NOT NULL,
    "accountMoveId" INTEGER,
    "reconciled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bank_statement_lines_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "bank_statements_organizationId_idx" ON "bank_statements"("organizationId");

-- CreateIndex
CREATE INDEX "bank_statement_lines_statementId_idx" ON "bank_statement_lines"("statementId");

-- CreateIndex
CREATE INDEX "bank_statement_lines_accountMoveId_idx" ON "bank_statement_lines"("accountMoveId");

-- AddForeignKey
ALTER TABLE "bank_statement_lines" ADD CONSTRAINT "bank_statement_lines_statementId_fkey" FOREIGN KEY ("statementId") REFERENCES "bank_statements"("id") ON DELETE CASCADE ON UPDATE CASCADE;
