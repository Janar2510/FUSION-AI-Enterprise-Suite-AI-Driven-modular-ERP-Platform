/*
  Warnings:

  - You are about to drop the column `accountName` on the `account_move_lines` table. All the data in the column will be lost.
  - You are about to drop the column `locationFrom` on the `stock_moves` table. All the data in the column will be lost.
  - You are about to drop the column `locationTo` on the `stock_moves` table. All the data in the column will be lost.
  - You are about to drop the column `pickingType` on the `stock_pickings` table. All the data in the column will be lost.
  - Added the required column `locationDestId` to the `stock_moves` table without a default value. This is not possible if the table is not empty.
  - Added the required column `locationId` to the `stock_moves` table without a default value. This is not possible if the table is not empty.
  - Added the required column `pickingTypeId` to the `stock_pickings` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "purchase_orders" ADD COLUMN "partnerRef" TEXT;

-- CreateTable
CREATE TABLE "user_passkeys" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "partnerId" INTEGER NOT NULL,
    "credentialId" TEXT NOT NULL,
    "publicKey" TEXT NOT NULL,
    "counter" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "user_passkeys_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "partners" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "web_carts" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "sessionId" TEXT NOT NULL,
    "customerId" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'active',
    "subtotal" REAL NOT NULL DEFAULT 0,
    "taxAmount" REAL NOT NULL DEFAULT 0,
    "discount" REAL NOT NULL DEFAULT 0,
    "totalAmount" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "web_cart_items" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "cartId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,
    "productName" TEXT NOT NULL,
    "productSku" TEXT,
    "quantity" REAL NOT NULL DEFAULT 1,
    "unitPrice" REAL NOT NULL DEFAULT 0,
    "lineTotal" REAL NOT NULL DEFAULT 0,
    CONSTRAINT "web_cart_items_cartId_fkey" FOREIGN KEY ("cartId") REFERENCES "web_carts" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "web_cart_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "web_orders" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "orderNumber" TEXT NOT NULL,
    "saleOrderId" INTEGER,
    "cartId" INTEGER,
    "gatewayStatus" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "loyalty_programs" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "pointsPerDollar" REAL NOT NULL DEFAULT 1,
    "active" BOOLEAN NOT NULL DEFAULT true
);

-- CreateTable
CREATE TABLE "loyalty_cards" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "programId" INTEGER NOT NULL,
    "partnerId" INTEGER NOT NULL,
    "points" REAL NOT NULL DEFAULT 0,
    CONSTRAINT "loyalty_cards_programId_fkey" FOREIGN KEY ("programId") REFERENCES "loyalty_programs" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "loyalty_cards_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "partners" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "loyalty_rewards" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "pointsCost" REAL NOT NULL,
    "rewardType" TEXT NOT NULL DEFAULT 'discount',
    "programId" INTEGER NOT NULL,
    CONSTRAINT "loyalty_rewards_programId_fkey" FOREIGN KEY ("programId") REFERENCES "loyalty_programs" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "stock_locations" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "completeName" TEXT NOT NULL,
    "usage" TEXT NOT NULL DEFAULT 'internal',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "locationId" INTEGER,
    "warehouseId" INTEGER,
    "companyId" INTEGER,
    CONSTRAINT "stock_locations_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "stock_locations" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "stock_locations_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "stock_warehouses" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "stock_picking_types" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "sequenceCode" TEXT NOT NULL,
    "warehouseId" INTEGER,
    "defaultLocationSrcId" INTEGER,
    "defaultLocationDestId" INTEGER,
    CONSTRAINT "stock_picking_types_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "stock_warehouses" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "stock_picking_types_defaultLocationSrcId_fkey" FOREIGN KEY ("defaultLocationSrcId") REFERENCES "stock_locations" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "stock_picking_types_defaultLocationDestId_fkey" FOREIGN KEY ("defaultLocationDestId") REFERENCES "stock_locations" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "stock_quants" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "productId" INTEGER NOT NULL,
    "locationId" INTEGER NOT NULL,
    "quantity" REAL NOT NULL DEFAULT 0,
    "reservedQuantity" REAL NOT NULL DEFAULT 0,
    "inDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "stock_quants_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "stock_quants_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "stock_locations" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "account_accounts" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "accountType" TEXT NOT NULL,
    "reconcile" BOOLEAN NOT NULL DEFAULT false,
    "deprecated" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true
);

-- CreateTable
CREATE TABLE "hr_skills" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "description" TEXT
);

-- CreateTable
CREATE TABLE "hr_employee_skills" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "employeeId" INTEGER NOT NULL,
    "skillId" INTEGER NOT NULL,
    "level" TEXT NOT NULL DEFAULT 'intermediate',
    CONSTRAINT "hr_employee_skills_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "hr_employees" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "hr_employee_skills_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "hr_skills" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "mrp_workcenters" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "timeEfficiency" REAL NOT NULL DEFAULT 100,
    "capacity" REAL NOT NULL DEFAULT 1,
    "oeeTarget" REAL NOT NULL DEFAULT 90,
    "timeStart" REAL NOT NULL DEFAULT 0,
    "timeStop" REAL NOT NULL DEFAULT 0,
    "costsHour" REAL NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "knowledge_workspaces" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "knowledge_article_revisions" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "articleId" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "reason" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "knowledge_article_revisions_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "knowledge_articles" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "hr_applicants" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "partnerName" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "stage" TEXT NOT NULL DEFAULT 'new',
    "priority" INTEGER NOT NULL DEFAULT 0,
    "salary" REAL NOT NULL DEFAULT 0,
    "source" TEXT,
    "description" TEXT,
    "jobId" INTEGER,
    "departmentId" INTEGER,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "hr_applicants_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "hr_departments" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "hr_applicants_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "hr_jobs" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "hr_attendances" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "checkIn" DATETIME NOT NULL,
    "checkOut" DATETIME,
    "workedHours" REAL NOT NULL DEFAULT 0,
    "employeeId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "hr_attendances_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "hr_employees" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "hr_payslips" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'draft',
    "dateFrom" DATETIME NOT NULL,
    "dateTo" DATETIME NOT NULL,
    "basicWage" REAL NOT NULL DEFAULT 0,
    "grossSalary" REAL NOT NULL DEFAULT 0,
    "netSalary" REAL NOT NULL DEFAULT 0,
    "deductions" REAL NOT NULL DEFAULT 0,
    "employeeId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "hr_payslips_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "hr_employees" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "hr_appraisals" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "state" TEXT NOT NULL DEFAULT 'new',
    "deadline" DATETIME,
    "finalInterview" DATETIME,
    "managerFeedback" TEXT,
    "employeeFeedback" TEXT,
    "overallRating" INTEGER NOT NULL DEFAULT 0,
    "employeeId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "hr_appraisals_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "hr_employees" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "quality_points" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "testType" TEXT NOT NULL DEFAULT 'passfail',
    "productId" INTEGER,
    "teamId" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "quality_points_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "quality_checks" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'none',
    "testType" TEXT NOT NULL DEFAULT 'passfail',
    "measureValue" REAL,
    "notes" TEXT,
    "picture" TEXT,
    "pointId" INTEGER,
    "productId" INTEGER,
    "productionId" INTEGER,
    "pickingId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "quality_checks_pointId_fkey" FOREIGN KEY ("pointId") REFERENCES "quality_points" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "quality_checks_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "quality_checks_productionId_fkey" FOREIGN KEY ("productionId") REFERENCES "mrp_productions" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "quality_checks_pickingId_fkey" FOREIGN KEY ("pickingId") REFERENCES "stock_pickings" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "mrp_ecos" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "stage" TEXT NOT NULL DEFAULT 'draft',
    "type" TEXT NOT NULL DEFAULT 'product',
    "description" TEXT,
    "effectivity" TEXT,
    "effectivityDate" DATETIME,
    "approvalState" TEXT NOT NULL DEFAULT 'none',
    "productId" INTEGER,
    "bomId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "mrp_ecos_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "mrp_ecos_bomId_fkey" FOREIGN KEY ("bomId") REFERENCES "mrp_boms" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT,
    "state" TEXT NOT NULL DEFAULT 'draft',
    "plan" TEXT NOT NULL DEFAULT 'starter',
    "mrr" REAL NOT NULL DEFAULT 0,
    "startDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "nextBilling" DATETIME,
    "endDate" DATETIME,
    "recurringInterval" INTEGER NOT NULL DEFAULT 1,
    "recurringRule" TEXT NOT NULL DEFAULT 'monthly',
    "partnerId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "subscriptions_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "partners" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "planning_slots" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "role" TEXT,
    "hours" REAL NOT NULL DEFAULT 0,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "note" TEXT,
    "state" TEXT NOT NULL DEFAULT 'draft',
    "employeeId" INTEGER,
    "projectId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "planning_slots_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "project_projects" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "planning_slots_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "hr_employees" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "marketing_campaigns" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'email',
    "state" TEXT NOT NULL DEFAULT 'draft',
    "budget" REAL NOT NULL DEFAULT 0,
    "spent" REAL NOT NULL DEFAULT 0,
    "leads" INTEGER NOT NULL DEFAULT 0,
    "conversions" INTEGER NOT NULL DEFAULT 0,
    "startDate" DATETIME,
    "endDate" DATETIME,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "system_configs" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "spreadsheets" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "data" TEXT NOT NULL DEFAULT '{}',
    "partnerId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "spreadsheets_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "partners" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "workflows" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "model" TEXT NOT NULL,
    "trigger" TEXT NOT NULL,
    "condition" TEXT,
    "action" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "stock_warehouse_orderpoints" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT,
    "productId" INTEGER NOT NULL,
    "locationId" INTEGER NOT NULL,
    "warehouseId" INTEGER,
    "productMinQty" REAL NOT NULL DEFAULT 0,
    "productMaxQty" REAL NOT NULL DEFAULT 0,
    "qtyMultiple" REAL NOT NULL DEFAULT 1,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "stock_warehouse_orderpoints_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "stock_warehouse_orderpoints_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "stock_locations" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "stock_warehouse_orderpoints_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "stock_warehouses" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "stock_rules" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "routeId" INTEGER NOT NULL,
    "locationSrcId" INTEGER,
    "locationDestId" INTEGER NOT NULL,
    "sequence" INTEGER NOT NULL DEFAULT 10,
    "active" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "stock_rules_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "stock_routes" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "stock_rules_locationSrcId_fkey" FOREIGN KEY ("locationSrcId") REFERENCES "stock_locations" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "stock_rules_locationDestId_fkey" FOREIGN KEY ("locationDestId") REFERENCES "stock_locations" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "stock_routes" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL DEFAULT 10,
    "active" BOOLEAN NOT NULL DEFAULT true
);

-- CreateTable
CREATE TABLE "vendor_pricelists" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "partnerId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,
    "productName" TEXT,
    "productCode" TEXT,
    "sequence" INTEGER NOT NULL DEFAULT 10,
    "minQty" REAL NOT NULL DEFAULT 0,
    "price" REAL NOT NULL DEFAULT 0,
    "delay" INTEGER NOT NULL DEFAULT 1,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    CONSTRAINT "vendor_pricelists_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "partners" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "vendor_pricelists_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_ProductStockRoute" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,
    CONSTRAINT "_ProductStockRoute_A_fkey" FOREIGN KEY ("A") REFERENCES "products" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_ProductStockRoute_B_fkey" FOREIGN KEY ("B") REFERENCES "stock_routes" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_account_journals" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "defaultAccountId" INTEGER,
    CONSTRAINT "account_journals_defaultAccountId_fkey" FOREIGN KEY ("defaultAccountId") REFERENCES "account_accounts" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_account_journals" ("active", "code", "id", "name", "type") SELECT "active", "code", "id", "name", "type" FROM "account_journals";
DROP TABLE "account_journals";
ALTER TABLE "new_account_journals" RENAME TO "account_journals";
CREATE UNIQUE INDEX "account_journals_code_key" ON "account_journals"("code");
CREATE TABLE "new_account_move_lines" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "quantity" REAL NOT NULL DEFAULT 1,
    "priceUnit" REAL NOT NULL DEFAULT 0,
    "priceSubtotal" REAL NOT NULL DEFAULT 0,
    "priceTotal" REAL NOT NULL DEFAULT 0,
    "debit" REAL NOT NULL DEFAULT 0,
    "credit" REAL NOT NULL DEFAULT 0,
    "balance" REAL NOT NULL DEFAULT 0,
    "reconciled" BOOLEAN NOT NULL DEFAULT false,
    "accountId" INTEGER,
    "moveId" INTEGER NOT NULL,
    "productId" INTEGER,
    CONSTRAINT "account_move_lines_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "account_accounts" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "account_move_lines_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "account_move_lines_moveId_fkey" FOREIGN KEY ("moveId") REFERENCES "account_moves" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_account_move_lines" ("credit", "debit", "id", "moveId", "name", "priceSubtotal", "priceTotal", "priceUnit", "productId", "quantity") SELECT "credit", "debit", "id", "moveId", "name", "priceSubtotal", "priceTotal", "priceUnit", "productId", "quantity" FROM "account_move_lines";
DROP TABLE "account_move_lines";
ALTER TABLE "new_account_move_lines" RENAME TO "account_move_lines";
CREATE TABLE "new_hr_employees" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "employeeNumber" TEXT,
    "workEmail" TEXT,
    "workPhone" TEXT,
    "mobilePhone" TEXT,
    "birthday" DATETIME,
    "gender" TEXT,
    "maritalStatus" TEXT,
    "emergencyContact" TEXT,
    "emergencyPhone" TEXT,
    "image" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "color" INTEGER NOT NULL DEFAULT 0,
    "departmentId" INTEGER,
    "jobId" INTEGER,
    "partnerId" INTEGER,
    "managerId" INTEGER,
    "coachId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "hr_employees_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "hr_employees" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "hr_employees_coachId_fkey" FOREIGN KEY ("coachId") REFERENCES "hr_employees" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "hr_employees_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "partners" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "hr_employees_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "hr_jobs" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "hr_employees_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "hr_departments" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_hr_employees" ("active", "birthday", "color", "createdAt", "departmentId", "emergencyContact", "emergencyPhone", "employeeNumber", "gender", "id", "image", "jobId", "managerId", "maritalStatus", "mobilePhone", "name", "partnerId", "updatedAt", "workEmail", "workPhone") SELECT "active", "birthday", "color", "createdAt", "departmentId", "emergencyContact", "emergencyPhone", "employeeNumber", "gender", "id", "image", "jobId", "managerId", "maritalStatus", "mobilePhone", "name", "partnerId", "updatedAt", "workEmail", "workPhone" FROM "hr_employees";
DROP TABLE "hr_employees";
ALTER TABLE "new_hr_employees" RENAME TO "hr_employees";
CREATE UNIQUE INDEX "hr_employees_partnerId_key" ON "hr_employees"("partnerId");
CREATE TABLE "new_knowledge_articles" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "category" TEXT,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "workspaceId" INTEGER,
    CONSTRAINT "knowledge_articles_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "knowledge_workspaces" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_knowledge_articles" ("body", "category", "createdAt", "id", "isPublished", "title", "updatedAt", "viewCount") SELECT "body", "category", "createdAt", "id", "isPublished", "title", "updatedAt", "viewCount" FROM "knowledge_articles";
DROP TABLE "knowledge_articles";
ALTER TABLE "new_knowledge_articles" RENAME TO "knowledge_articles";
CREATE TABLE "new_mrp_productions" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'draft',
    "productQty" REAL NOT NULL DEFAULT 1,
    "qtyProduced" REAL NOT NULL DEFAULT 0,
    "dateStart" DATETIME,
    "dateFinished" DATETIME,
    "origin" TEXT,
    "bomId" INTEGER,
    "productId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "mrp_productions_bomId_fkey" FOREIGN KEY ("bomId") REFERENCES "mrp_boms" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "mrp_productions_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_mrp_productions" ("bomId", "createdAt", "dateFinished", "dateStart", "id", "name", "origin", "productQty", "qtyProduced", "state", "updatedAt") SELECT "bomId", "createdAt", "dateFinished", "dateStart", "id", "name", "origin", "productQty", "qtyProduced", "state", "updatedAt" FROM "mrp_productions";
DROP TABLE "mrp_productions";
ALTER TABLE "new_mrp_productions" RENAME TO "mrp_productions";
CREATE UNIQUE INDEX "mrp_productions_name_key" ON "mrp_productions"("name");
CREATE TABLE "new_mrp_workorders" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'pending',
    "duration" REAL NOT NULL DEFAULT 0,
    "durationActual" REAL NOT NULL DEFAULT 0,
    "sequence" INTEGER NOT NULL DEFAULT 10,
    "productionId" INTEGER NOT NULL,
    "workcenterId" INTEGER,
    CONSTRAINT "mrp_workorders_productionId_fkey" FOREIGN KEY ("productionId") REFERENCES "mrp_productions" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "mrp_workorders_workcenterId_fkey" FOREIGN KEY ("workcenterId") REFERENCES "mrp_workcenters" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_mrp_workorders" ("duration", "durationActual", "id", "name", "productionId", "sequence", "state") SELECT "duration", "durationActual", "id", "name", "productionId", "sequence", "state" FROM "mrp_workorders";
DROP TABLE "mrp_workorders";
ALTER TABLE "new_mrp_workorders" RENAME TO "mrp_workorders";
CREATE TABLE "new_purchase_order_lines" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "sequence" INTEGER NOT NULL DEFAULT 10,
    "name" TEXT NOT NULL,
    "productQty" REAL NOT NULL DEFAULT 1,
    "qtyReceived" REAL NOT NULL DEFAULT 0,
    "qtyInvoiced" REAL NOT NULL DEFAULT 0,
    "priceUnit" REAL NOT NULL DEFAULT 0,
    "priceSubtotal" REAL NOT NULL DEFAULT 0,
    "priceTotal" REAL NOT NULL DEFAULT 0,
    "orderId" INTEGER NOT NULL,
    "productId" INTEGER,
    CONSTRAINT "purchase_order_lines_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "purchase_order_lines_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "purchase_orders" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_purchase_order_lines" ("id", "name", "orderId", "priceSubtotal", "priceTotal", "priceUnit", "productId", "productQty", "sequence") SELECT "id", "name", "orderId", "priceSubtotal", "priceTotal", "priceUnit", "productId", "productQty", "sequence" FROM "purchase_order_lines";
DROP TABLE "purchase_order_lines";
ALTER TABLE "new_purchase_order_lines" RENAME TO "purchase_order_lines";
CREATE TABLE "new_stock_moves" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'draft',
    "productQty" REAL NOT NULL DEFAULT 0,
    "qtyDone" REAL NOT NULL DEFAULT 0,
    "locationId" INTEGER NOT NULL,
    "locationDestId" INTEGER NOT NULL,
    "pickingId" INTEGER,
    "productId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "stock_moves_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "stock_locations" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "stock_moves_locationDestId_fkey" FOREIGN KEY ("locationDestId") REFERENCES "stock_locations" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "stock_moves_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "stock_moves_pickingId_fkey" FOREIGN KEY ("pickingId") REFERENCES "stock_pickings" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_stock_moves" ("createdAt", "id", "name", "pickingId", "productId", "productQty", "qtyDone", "state", "updatedAt") SELECT "createdAt", "id", "name", "pickingId", "productId", "productQty", "qtyDone", "state", "updatedAt" FROM "stock_moves";
DROP TABLE "stock_moves";
ALTER TABLE "new_stock_moves" RENAME TO "stock_moves";
CREATE TABLE "new_stock_pickings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "pickingTypeId" INTEGER NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'draft',
    "scheduledDate" DATETIME,
    "dateDone" DATETIME,
    "origin" TEXT,
    "note" TEXT,
    "locationId" INTEGER,
    "locationDestId" INTEGER,
    "partnerId" INTEGER,
    "warehouseId" INTEGER,
    "saleOrderId" INTEGER,
    "purchaseOrderId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "stock_pickings_pickingTypeId_fkey" FOREIGN KEY ("pickingTypeId") REFERENCES "stock_picking_types" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "stock_pickings_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "stock_locations" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "stock_pickings_locationDestId_fkey" FOREIGN KEY ("locationDestId") REFERENCES "stock_locations" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "stock_pickings_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "partners" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "stock_pickings_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "purchase_orders" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "stock_pickings_saleOrderId_fkey" FOREIGN KEY ("saleOrderId") REFERENCES "sale_orders" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "stock_pickings_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "stock_warehouses" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_stock_pickings" ("createdAt", "dateDone", "id", "name", "note", "origin", "purchaseOrderId", "saleOrderId", "scheduledDate", "state", "updatedAt", "warehouseId") SELECT "createdAt", "dateDone", "id", "name", "note", "origin", "purchaseOrderId", "saleOrderId", "scheduledDate", "state", "updatedAt", "warehouseId" FROM "stock_pickings";
DROP TABLE "stock_pickings";
ALTER TABLE "new_stock_pickings" RENAME TO "stock_pickings";
CREATE UNIQUE INDEX "stock_pickings_name_key" ON "stock_pickings"("name");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "user_passkeys_credentialId_key" ON "user_passkeys"("credentialId");

-- CreateIndex
CREATE UNIQUE INDEX "web_carts_sessionId_key" ON "web_carts"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "web_orders_orderNumber_key" ON "web_orders"("orderNumber");

-- CreateIndex
CREATE UNIQUE INDEX "loyalty_cards_partnerId_key" ON "loyalty_cards"("partnerId");

-- CreateIndex
CREATE UNIQUE INDEX "stock_quants_productId_locationId_key" ON "stock_quants"("productId", "locationId");

-- CreateIndex
CREATE UNIQUE INDEX "account_accounts_code_key" ON "account_accounts"("code");

-- CreateIndex
CREATE UNIQUE INDEX "hr_skills_name_key" ON "hr_skills"("name");

-- CreateIndex
CREATE UNIQUE INDEX "system_configs_key_key" ON "system_configs"("key");

-- CreateIndex
CREATE UNIQUE INDEX "_ProductStockRoute_AB_unique" ON "_ProductStockRoute"("A", "B");

-- CreateIndex
CREATE INDEX "_ProductStockRoute_B_index" ON "_ProductStockRoute"("B");
