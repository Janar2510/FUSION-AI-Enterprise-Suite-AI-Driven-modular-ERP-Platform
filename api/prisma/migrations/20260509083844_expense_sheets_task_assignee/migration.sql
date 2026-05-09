-- AlterTable
ALTER TABLE "hr_expenses" ADD COLUMN     "category" TEXT,
ADD COLUMN     "sheetId" INTEGER;

-- AlterTable
ALTER TABLE "project_tasks" ADD COLUMN     "assigneeId" INTEGER;

-- CreateTable
CREATE TABLE "hr_expense_sheets" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'draft',
    "totalAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "paymentMode" TEXT NOT NULL DEFAULT 'own_account',
    "employeeId" INTEGER NOT NULL,
    "accountMoveId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hr_expense_sheets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "hr_expense_sheets_accountMoveId_key" ON "hr_expense_sheets"("accountMoveId");

-- AddForeignKey
ALTER TABLE "hr_expense_sheets" ADD CONSTRAINT "hr_expense_sheets_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "hr_employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr_expenses" ADD CONSTRAINT "hr_expenses_sheetId_fkey" FOREIGN KEY ("sheetId") REFERENCES "hr_expense_sheets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_tasks" ADD CONSTRAINT "project_tasks_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "hr_employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;
