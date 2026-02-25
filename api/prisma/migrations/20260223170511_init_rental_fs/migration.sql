-- CreateTable
CREATE TABLE "partners" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "mobile" TEXT,
    "website" TEXT,
    "vat" TEXT,
    "isCompany" BOOLEAN NOT NULL DEFAULT false,
    "type" TEXT NOT NULL DEFAULT 'contact',
    "street" TEXT,
    "street2" TEXT,
    "city" TEXT,
    "state" TEXT,
    "zip" TEXT,
    "country" TEXT,
    "title" TEXT,
    "jobPosition" TEXT,
    "notes" TEXT,
    "image" TEXT,
    "lang" TEXT DEFAULT 'en',
    "color" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "isCustomer" BOOLEAN NOT NULL DEFAULT false,
    "isVendor" BOOLEAN NOT NULL DEFAULT false,
    "parentId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "partners_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "partners" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "partner_tags" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "color" INTEGER NOT NULL DEFAULT 0
);

-- CreateTable
CREATE TABLE "crm_stages" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL DEFAULT 10,
    "foldedKanban" BOOLEAN NOT NULL DEFAULT false
);

-- CreateTable
CREATE TABLE "crm_tags" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "color" INTEGER NOT NULL DEFAULT 0
);

-- CreateTable
CREATE TABLE "crm_leads" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'lead',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "expectedRevenue" REAL NOT NULL DEFAULT 0,
    "probability" REAL NOT NULL DEFAULT 10,
    "contactName" TEXT,
    "emailFrom" TEXT,
    "phone" TEXT,
    "mobile" TEXT,
    "street" TEXT,
    "city" TEXT,
    "state" TEXT,
    "zip" TEXT,
    "country" TEXT,
    "website" TEXT,
    "description" TEXT,
    "lostReason" TEXT,
    "color" INTEGER NOT NULL DEFAULT 0,
    "stageId" INTEGER NOT NULL,
    "partnerId" INTEGER,
    "dateDeadline" DATETIME,
    "dateClosed" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "crm_leads_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "crm_stages" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "crm_leads_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "partners" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "sale_orders" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'draft',
    "dateOrder" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validityDate" DATETIME,
    "note" TEXT,
    "amountUntaxed" REAL NOT NULL DEFAULT 0,
    "amountTax" REAL NOT NULL DEFAULT 0,
    "amountTotal" REAL NOT NULL DEFAULT 0,
    "partnerId" INTEGER NOT NULL,
    "crmLeadId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "sale_orders_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "partners" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "sale_orders_crmLeadId_fkey" FOREIGN KEY ("crmLeadId") REFERENCES "crm_leads" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "sale_order_lines" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "sequence" INTEGER NOT NULL DEFAULT 10,
    "name" TEXT NOT NULL,
    "productQty" REAL NOT NULL DEFAULT 1,
    "priceUnit" REAL NOT NULL DEFAULT 0,
    "discount" REAL NOT NULL DEFAULT 0,
    "priceSubtotal" REAL NOT NULL DEFAULT 0,
    "priceTotal" REAL NOT NULL DEFAULT 0,
    "orderId" INTEGER NOT NULL,
    "productId" INTEGER,
    CONSTRAINT "sale_order_lines_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "sale_orders" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "sale_order_lines_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "purchase_orders" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'draft',
    "dateOrder" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateApprove" DATETIME,
    "datePlanned" DATETIME,
    "note" TEXT,
    "amountUntaxed" REAL NOT NULL DEFAULT 0,
    "amountTax" REAL NOT NULL DEFAULT 0,
    "amountTotal" REAL NOT NULL DEFAULT 0,
    "partnerId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "purchase_orders_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "partners" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "purchase_order_lines" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "sequence" INTEGER NOT NULL DEFAULT 10,
    "name" TEXT NOT NULL,
    "productQty" REAL NOT NULL DEFAULT 1,
    "priceUnit" REAL NOT NULL DEFAULT 0,
    "priceSubtotal" REAL NOT NULL DEFAULT 0,
    "priceTotal" REAL NOT NULL DEFAULT 0,
    "orderId" INTEGER NOT NULL,
    "productId" INTEGER,
    CONSTRAINT "purchase_order_lines_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "purchase_orders" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "purchase_order_lines_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "product_categories" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "parentId" INTEGER,
    CONSTRAINT "product_categories_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "product_categories" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "products" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "internalRef" TEXT,
    "barcode" TEXT,
    "type" TEXT NOT NULL DEFAULT 'consu',
    "salePrice" REAL NOT NULL DEFAULT 0,
    "costPrice" REAL NOT NULL DEFAULT 0,
    "description" TEXT,
    "descriptionSale" TEXT,
    "image" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "weight" REAL NOT NULL DEFAULT 0,
    "volume" REAL NOT NULL DEFAULT 0,
    "categoryId" INTEGER,
    "qtyOnHand" REAL NOT NULL DEFAULT 0,
    "qtyForecasted" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "products_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "product_categories" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "stock_warehouses" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true
);

-- CreateTable
CREATE TABLE "stock_pickings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "pickingType" TEXT NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'draft',
    "scheduledDate" DATETIME,
    "dateDone" DATETIME,
    "origin" TEXT,
    "note" TEXT,
    "warehouseId" INTEGER,
    "saleOrderId" INTEGER,
    "purchaseOrderId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "stock_pickings_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "stock_warehouses" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "stock_pickings_saleOrderId_fkey" FOREIGN KEY ("saleOrderId") REFERENCES "sale_orders" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "stock_pickings_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "purchase_orders" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "stock_moves" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'draft',
    "productQty" REAL NOT NULL DEFAULT 0,
    "qtyDone" REAL NOT NULL DEFAULT 0,
    "locationFrom" TEXT NOT NULL,
    "locationTo" TEXT NOT NULL,
    "pickingId" INTEGER,
    "productId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "stock_moves_pickingId_fkey" FOREIGN KEY ("pickingId") REFERENCES "stock_pickings" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "stock_moves_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "account_journals" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true
);

-- CreateTable
CREATE TABLE "account_moves" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "moveType" TEXT NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'draft',
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueDate" DATETIME,
    "ref" TEXT,
    "amountUntaxed" REAL NOT NULL DEFAULT 0,
    "amountTax" REAL NOT NULL DEFAULT 0,
    "amountTotal" REAL NOT NULL DEFAULT 0,
    "amountResidual" REAL NOT NULL DEFAULT 0,
    "paymentState" TEXT NOT NULL DEFAULT 'not_paid',
    "journalId" INTEGER NOT NULL,
    "partnerId" INTEGER,
    "saleOrderId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "account_moves_journalId_fkey" FOREIGN KEY ("journalId") REFERENCES "account_journals" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "account_moves_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "partners" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "account_moves_saleOrderId_fkey" FOREIGN KEY ("saleOrderId") REFERENCES "sale_orders" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "account_move_lines" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "quantity" REAL NOT NULL DEFAULT 1,
    "priceUnit" REAL NOT NULL DEFAULT 0,
    "priceSubtotal" REAL NOT NULL DEFAULT 0,
    "priceTotal" REAL NOT NULL DEFAULT 0,
    "debit" REAL NOT NULL DEFAULT 0,
    "credit" REAL NOT NULL DEFAULT 0,
    "accountName" TEXT,
    "moveId" INTEGER NOT NULL,
    "productId" INTEGER,
    CONSTRAINT "account_move_lines_moveId_fkey" FOREIGN KEY ("moveId") REFERENCES "account_moves" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "account_move_lines_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "fs_tasks" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "state" TEXT NOT NULL DEFAULT 'new',
    "priority" INTEGER NOT NULL DEFAULT 0,
    "scheduledDate" DATETIME,
    "dateDeadline" DATETIME,
    "partnerId" INTEGER,
    "employeeId" INTEGER,
    "street" TEXT,
    "city" TEXT,
    "zip" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "fs_tasks_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "partners" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "fs_tasks_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "hr_employees" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "rental_orders" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'draft',
    "pickupDate" DATETIME NOT NULL,
    "returnDate" DATETIME NOT NULL,
    "partnerId" INTEGER NOT NULL,
    "amountTotal" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "rental_orders_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "partners" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "rental_order_lines" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "orderId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,
    "productQty" INTEGER NOT NULL DEFAULT 1,
    "priceUnit" REAL NOT NULL DEFAULT 0,
    "priceSubtotal" REAL NOT NULL DEFAULT 0,
    CONSTRAINT "rental_order_lines_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "rental_orders" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "rental_order_lines_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "hr_departments" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "color" INTEGER NOT NULL DEFAULT 0,
    "parentId" INTEGER,
    "managerId" INTEGER,
    CONSTRAINT "hr_departments_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "hr_departments" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "hr_departments_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "hr_employees" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "hr_jobs" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "expectedEmployees" INTEGER NOT NULL DEFAULT 1,
    "noOfEmployee" INTEGER NOT NULL DEFAULT 0,
    "state" TEXT NOT NULL DEFAULT 'recruit'
);

-- CreateTable
CREATE TABLE "hr_employees" (
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "hr_employees_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "hr_departments" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "hr_employees_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "hr_jobs" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "hr_employees_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "partners" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "hr_employees_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "hr_employees" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "hr_timesheets" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,
    "unitAmount" REAL NOT NULL DEFAULT 0,
    "employeeId" INTEGER NOT NULL,
    "taskId" INTEGER,
    "projectId" INTEGER,
    CONSTRAINT "hr_timesheets_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "hr_employees" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "hr_timesheets_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "project_tasks" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "hr_timesheets_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "project_projects" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "hr_leaves" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT,
    "state" TEXT NOT NULL DEFAULT 'draft',
    "leaveType" TEXT NOT NULL DEFAULT 'legal',
    "dateFrom" DATETIME NOT NULL,
    "dateTo" DATETIME NOT NULL,
    "numberOfDays" REAL NOT NULL DEFAULT 1,
    "notes" TEXT,
    "employeeId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "hr_leaves_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "hr_employees" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "hr_expenses" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "state" TEXT NOT NULL DEFAULT 'draft',
    "totalAmount" REAL NOT NULL DEFAULT 0,
    "quantity" REAL NOT NULL DEFAULT 1,
    "unitAmount" REAL NOT NULL DEFAULT 0,
    "description" TEXT,
    "paymentMode" TEXT NOT NULL DEFAULT 'own_account',
    "receipt" TEXT,
    "employeeId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "hr_expenses_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "hr_employees" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "project_stages" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL DEFAULT 10,
    "foldedKanban" BOOLEAN NOT NULL DEFAULT false
);

-- CreateTable
CREATE TABLE "project_projects" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "color" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "dateStart" DATETIME,
    "date" DATETIME,
    "taskCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "project_tasks" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "sequence" INTEGER NOT NULL DEFAULT 10,
    "color" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "dateDeadline" DATETIME,
    "dateEnd" DATETIME,
    "kanbanState" TEXT NOT NULL DEFAULT 'normal',
    "stageId" INTEGER NOT NULL,
    "projectId" INTEGER NOT NULL,
    "parentId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "project_tasks_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "project_stages" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "project_tasks_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "project_projects" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "project_tasks_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "project_tasks" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "helpdesk_stages" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL DEFAULT 10,
    "foldedKanban" BOOLEAN NOT NULL DEFAULT false
);

-- CreateTable
CREATE TABLE "helpdesk_tickets" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "kanbanState" TEXT NOT NULL DEFAULT 'normal',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "stageId" INTEGER NOT NULL,
    "partnerId" INTEGER,
    "dateDeadline" DATETIME,
    "dateClosed" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "helpdesk_tickets_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "helpdesk_stages" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "helpdesk_tickets_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "partners" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "calendar_events" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "start" DATETIME NOT NULL,
    "stop" DATETIME NOT NULL,
    "allday" BOOLEAN NOT NULL DEFAULT false,
    "location" TEXT,
    "privacy" TEXT NOT NULL DEFAULT 'public',
    "showAs" TEXT NOT NULL DEFAULT 'busy',
    "recurrency" BOOLEAN NOT NULL DEFAULT false,
    "color" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "calendar_attendees" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "state" TEXT NOT NULL DEFAULT 'needsAction',
    "role" TEXT NOT NULL DEFAULT 'req',
    "eventId" INTEGER NOT NULL,
    "partnerId" INTEGER NOT NULL,
    CONSTRAINT "calendar_attendees_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "calendar_events" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "calendar_attendees_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "partners" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "mrp_boms" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT,
    "code" TEXT,
    "type" TEXT NOT NULL DEFAULT 'normal',
    "productQty" REAL NOT NULL DEFAULT 1,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "mrp_bom_lines" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "productQty" REAL NOT NULL DEFAULT 1,
    "bomId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,
    CONSTRAINT "mrp_bom_lines_bomId_fkey" FOREIGN KEY ("bomId") REFERENCES "mrp_boms" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "mrp_bom_lines_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "mrp_productions" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'draft',
    "productQty" REAL NOT NULL DEFAULT 1,
    "qtyProduced" REAL NOT NULL DEFAULT 0,
    "dateStart" DATETIME,
    "dateFinished" DATETIME,
    "origin" TEXT,
    "bomId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "mrp_productions_bomId_fkey" FOREIGN KEY ("bomId") REFERENCES "mrp_boms" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "mrp_workorders" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'pending',
    "duration" REAL NOT NULL DEFAULT 0,
    "durationActual" REAL NOT NULL DEFAULT 0,
    "sequence" INTEGER NOT NULL DEFAULT 10,
    "productionId" INTEGER NOT NULL,
    CONSTRAINT "mrp_workorders_productionId_fkey" FOREIGN KEY ("productionId") REFERENCES "mrp_productions" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "pos_configs" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true
);

-- CreateTable
CREATE TABLE "pos_sessions" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'opening_control',
    "startAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "stopAt" DATETIME,
    "cashRegisterBalance" REAL NOT NULL DEFAULT 0,
    "configId" INTEGER NOT NULL,
    CONSTRAINT "pos_sessions_configId_fkey" FOREIGN KEY ("configId") REFERENCES "pos_configs" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "pos_orders" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'draft',
    "dateOrder" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "amountTotal" REAL NOT NULL DEFAULT 0,
    "amountTax" REAL NOT NULL DEFAULT 0,
    "amountPaid" REAL NOT NULL DEFAULT 0,
    "amountReturn" REAL NOT NULL DEFAULT 0,
    "note" TEXT,
    "sessionId" INTEGER NOT NULL,
    CONSTRAINT "pos_orders_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "pos_sessions" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "pos_order_lines" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "qty" REAL NOT NULL DEFAULT 1,
    "priceUnit" REAL NOT NULL DEFAULT 0,
    "priceSubtotal" REAL NOT NULL DEFAULT 0,
    "discount" REAL NOT NULL DEFAULT 0,
    "orderId" INTEGER NOT NULL,
    "productId" INTEGER,
    CONSTRAINT "pos_order_lines_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "pos_orders" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "pos_order_lines_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "mail_channels" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "channelType" TEXT NOT NULL DEFAULT 'channel',
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "mail_messages" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "body" TEXT NOT NULL,
    "messageType" TEXT NOT NULL DEFAULT 'comment',
    "authorName" TEXT,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "channelId" INTEGER,
    "resModel" TEXT,
    "resId" INTEGER,
    CONSTRAINT "mail_messages_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "mail_channels" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "event_events" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "dateBegin" DATETIME NOT NULL,
    "dateEnd" DATETIME NOT NULL,
    "location" TEXT,
    "description" TEXT,
    "state" TEXT NOT NULL DEFAULT 'draft',
    "seatsMax" INTEGER NOT NULL DEFAULT 0,
    "seatsAvailable" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "event_registrations" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "state" TEXT NOT NULL DEFAULT 'draft',
    "eventId" INTEGER NOT NULL,
    CONSTRAINT "event_registrations_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "event_events" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "fleet_vehicles" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "licensePlate" TEXT,
    "model" TEXT,
    "brand" TEXT,
    "color" TEXT,
    "fuelType" TEXT,
    "odometer" REAL NOT NULL DEFAULT 0,
    "state" TEXT NOT NULL DEFAULT 'active',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "fleet_vehicle_logs" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" TEXT NOT NULL,
    "description" TEXT,
    "amount" REAL NOT NULL DEFAULT 0,
    "odometer" REAL NOT NULL DEFAULT 0,
    "vehicleId" INTEGER NOT NULL,
    CONSTRAINT "fleet_vehicle_logs_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "fleet_vehicles" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "maintenance_equipment" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "serialNo" TEXT,
    "model" TEXT,
    "category" TEXT,
    "location" TEXT,
    "assignDate" DATETIME,
    "cost" REAL NOT NULL DEFAULT 0,
    "note" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true
);

-- CreateTable
CREATE TABLE "maintenance_requests" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "requestDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closeDate" DATETIME,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "stage" TEXT NOT NULL DEFAULT 'new',
    "maintenanceType" TEXT NOT NULL DEFAULT 'corrective',
    "equipmentId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "maintenance_requests_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "maintenance_equipment" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "surveys" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "state" TEXT NOT NULL DEFAULT 'draft',
    "scoringType" TEXT NOT NULL DEFAULT 'no_scoring',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "survey_questions" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "questionType" TEXT NOT NULL DEFAULT 'text_box',
    "sequence" INTEGER NOT NULL DEFAULT 10,
    "isRequired" BOOLEAN NOT NULL DEFAULT false,
    "constrMandatory" BOOLEAN NOT NULL DEFAULT false,
    "surveyId" INTEGER NOT NULL,
    CONSTRAINT "survey_questions_surveyId_fkey" FOREIGN KEY ("surveyId") REFERENCES "surveys" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "survey_answers" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "value" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL DEFAULT 10,
    "isCorrect" BOOLEAN NOT NULL DEFAULT false,
    "questionId" INTEGER NOT NULL,
    CONSTRAINT "survey_answers_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "survey_questions" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "survey_user_inputs" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "state" TEXT NOT NULL DEFAULT 'new',
    "startDatetime" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDatetime" DATETIME,
    "email" TEXT,
    "surveyId" INTEGER NOT NULL,
    CONSTRAINT "survey_user_inputs_surveyId_fkey" FOREIGN KEY ("surveyId") REFERENCES "surveys" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "notes" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "body" TEXT,
    "stage" TEXT NOT NULL DEFAULT 'new',
    "color" INTEGER NOT NULL DEFAULT 0,
    "sequence" INTEGER NOT NULL DEFAULT 10,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "lunch_suppliers" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true
);

-- CreateTable
CREATE TABLE "lunch_products" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "price" REAL NOT NULL DEFAULT 0,
    "category" TEXT,
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "supplierId" INTEGER NOT NULL,
    CONSTRAINT "lunch_products_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "lunch_suppliers" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "lunch_orders" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "state" TEXT NOT NULL DEFAULT 'new',
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "quantity" REAL NOT NULL DEFAULT 1,
    "price" REAL NOT NULL DEFAULT 0,
    "note" TEXT,
    "productId" INTEGER NOT NULL,
    CONSTRAINT "lunch_orders_productId_fkey" FOREIGN KEY ("productId") REFERENCES "lunch_products" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_PartnerToPartnerTag" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,
    CONSTRAINT "_PartnerToPartnerTag_A_fkey" FOREIGN KEY ("A") REFERENCES "partners" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_PartnerToPartnerTag_B_fkey" FOREIGN KEY ("B") REFERENCES "partner_tags" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_CrmLeadToCrmTag" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,
    CONSTRAINT "_CrmLeadToCrmTag_A_fkey" FOREIGN KEY ("A") REFERENCES "crm_leads" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_CrmLeadToCrmTag_B_fkey" FOREIGN KEY ("B") REFERENCES "crm_tags" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "sale_orders_name_key" ON "sale_orders"("name");

-- CreateIndex
CREATE UNIQUE INDEX "purchase_orders_name_key" ON "purchase_orders"("name");

-- CreateIndex
CREATE UNIQUE INDEX "stock_warehouses_code_key" ON "stock_warehouses"("code");

-- CreateIndex
CREATE UNIQUE INDEX "stock_pickings_name_key" ON "stock_pickings"("name");

-- CreateIndex
CREATE UNIQUE INDEX "account_journals_code_key" ON "account_journals"("code");

-- CreateIndex
CREATE UNIQUE INDEX "account_moves_name_key" ON "account_moves"("name");

-- CreateIndex
CREATE UNIQUE INDEX "hr_departments_managerId_key" ON "hr_departments"("managerId");

-- CreateIndex
CREATE UNIQUE INDEX "hr_employees_partnerId_key" ON "hr_employees"("partnerId");

-- CreateIndex
CREATE UNIQUE INDEX "calendar_attendees_eventId_partnerId_key" ON "calendar_attendees"("eventId", "partnerId");

-- CreateIndex
CREATE UNIQUE INDEX "mrp_productions_name_key" ON "mrp_productions"("name");

-- CreateIndex
CREATE UNIQUE INDEX "pos_sessions_name_key" ON "pos_sessions"("name");

-- CreateIndex
CREATE UNIQUE INDEX "pos_orders_name_key" ON "pos_orders"("name");

-- CreateIndex
CREATE UNIQUE INDEX "_PartnerToPartnerTag_AB_unique" ON "_PartnerToPartnerTag"("A", "B");

-- CreateIndex
CREATE INDEX "_PartnerToPartnerTag_B_index" ON "_PartnerToPartnerTag"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_CrmLeadToCrmTag_AB_unique" ON "_CrmLeadToCrmTag"("A", "B");

-- CreateIndex
CREATE INDEX "_CrmLeadToCrmTag_B_index" ON "_CrmLeadToCrmTag"("B");
