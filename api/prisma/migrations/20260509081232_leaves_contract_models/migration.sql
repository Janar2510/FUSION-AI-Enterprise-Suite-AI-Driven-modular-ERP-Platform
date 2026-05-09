-- DropForeignKey
ALTER TABLE "partners" DROP CONSTRAINT "partners_paymentTermId_fkey";

-- DropForeignKey
ALTER TABLE "partners" DROP CONSTRAINT "partners_pricelistId_fkey";

-- DropForeignKey
ALTER TABLE "payment_term_lines" DROP CONSTRAINT "payment_term_lines_paymentTermId_fkey";

-- DropForeignKey
ALTER TABLE "pricelist_lines" DROP CONSTRAINT "pricelist_lines_pricelistId_fkey";

-- DropForeignKey
ALTER TABLE "pricelist_lines" DROP CONSTRAINT "pricelist_lines_productId_fkey";

-- AlterTable
ALTER TABLE "account_payments" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "hr_leaves" ADD COLUMN     "leaveTypeId" INTEGER;

-- CreateTable
CREATE TABLE "hr_leave_types" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT 'blue',
    "allocationMode" TEXT NOT NULL DEFAULT 'fixed',
    "validationMode" TEXT NOT NULL DEFAULT 'manager',
    "maxAllowance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isCarryover" BOOLEAN NOT NULL DEFAULT false,
    "requireAttachment" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hr_leave_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_leave_allocations" (
    "id" SERIAL NOT NULL,
    "name" TEXT,
    "state" TEXT NOT NULL DEFAULT 'draft',
    "numberOfDays" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "dateFrom" TIMESTAMP(3),
    "dateTo" TIMESTAMP(3),
    "employeeId" INTEGER NOT NULL,
    "leaveTypeId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hr_leave_allocations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_contracts" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'new',
    "contractType" TEXT NOT NULL DEFAULT 'employee',
    "dateStart" TIMESTAMP(3) NOT NULL,
    "dateEnd" TIMESTAMP(3),
    "wage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "trialDateEnd" TIMESTAMP(3),
    "notes" TEXT,
    "employeeId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hr_contracts_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "partners" ADD CONSTRAINT "partners_paymentTermId_fkey" FOREIGN KEY ("paymentTermId") REFERENCES "payment_terms"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "partners" ADD CONSTRAINT "partners_pricelistId_fkey" FOREIGN KEY ("pricelistId") REFERENCES "pricelists"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr_leave_allocations" ADD CONSTRAINT "hr_leave_allocations_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "hr_employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr_leave_allocations" ADD CONSTRAINT "hr_leave_allocations_leaveTypeId_fkey" FOREIGN KEY ("leaveTypeId") REFERENCES "hr_leave_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr_leaves" ADD CONSTRAINT "hr_leaves_leaveTypeId_fkey" FOREIGN KEY ("leaveTypeId") REFERENCES "hr_leave_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr_contracts" ADD CONSTRAINT "hr_contracts_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "hr_employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_term_lines" ADD CONSTRAINT "payment_term_lines_paymentTermId_fkey" FOREIGN KEY ("paymentTermId") REFERENCES "payment_terms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pricelist_lines" ADD CONSTRAINT "pricelist_lines_pricelistId_fkey" FOREIGN KEY ("pricelistId") REFERENCES "pricelists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pricelist_lines" ADD CONSTRAINT "pricelist_lines_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;
