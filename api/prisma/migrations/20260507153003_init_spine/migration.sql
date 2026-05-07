-- CreateEnum
CREATE TYPE "OrgStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INVITED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "ProductType" AS ENUM ('STORABLE', 'CONSUMABLE', 'SERVICE');

-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "status" "OrgStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SpineCompany" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "legalName" TEXT,
    "vatId" TEXT,
    "currencyCode" TEXT NOT NULL DEFAULT 'EUR',
    "countryCode" TEXT NOT NULL DEFAULT 'EE',
    "fiscalYearStart" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SpineCompany_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SpineUser" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT,
    "mfaEnabled" BOOLEAN NOT NULL DEFAULT false,
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SpineUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SpineRole" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "SpineRole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SpinePermission" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "SpinePermission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SpineUserRole" (
    "userId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,

    CONSTRAINT "SpineUserRole_pkey" PRIMARY KEY ("userId","roleId")
);

-- CreateTable
CREATE TABLE "SpinePartnerAddress" (
    "id" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "street1" TEXT,
    "street2" TEXT,
    "city" TEXT,
    "state" TEXT,
    "zip" TEXT,
    "country" TEXT,

    CONSTRAINT "SpinePartnerAddress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SpinePartnerContact" (
    "id" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "SpinePartnerContact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Attachment" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "ownerType" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "storageKey" TEXT NOT NULL,
    "checksumSha256" TEXT NOT NULL,
    "uploadedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Attachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SpineDocument" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "partnerId" TEXT,
    "attachmentId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SpineDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Activity" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "ownerType" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "body" TEXT,
    "dueAt" TIMESTAMP(3),
    "doneAt" TIMESTAMP(3),
    "assignedToId" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Activity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatterMessage" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "ownerType" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "authorId" TEXT,
    "body" TEXT NOT NULL,
    "isInternal" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChatterMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TimelineEvent" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "partnerId" TEXT,
    "ownerType" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "eventKey" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TimelineEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "actorUserId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "before" JSONB,
    "after" JSONB,
    "ip" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OutboxEvent" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "eventKey" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "publishedAt" TIMESTAMP(3),
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OutboxEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "partners" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "companyId" TEXT,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "mobile" TEXT,
    "website" TEXT,
    "vat" TEXT,
    "isCompany" BOOLEAN NOT NULL DEFAULT false,
    "isEmployee" BOOLEAN NOT NULL DEFAULT false,
    "isCustomer" BOOLEAN NOT NULL DEFAULT false,
    "isVendor" BOOLEAN NOT NULL DEFAULT false,
    "consentMarketing" BOOLEAN NOT NULL DEFAULT false,
    "consentUpdatedAt" TIMESTAMP(3),
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
    "parentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "partners_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_passkeys" (
    "id" SERIAL NOT NULL,
    "partnerId" TEXT NOT NULL,
    "credentialId" TEXT NOT NULL,
    "publicKey" TEXT NOT NULL,
    "counter" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_passkeys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "partner_tags" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "color" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "partner_tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm_stages" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL DEFAULT 10,
    "foldedKanban" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "crm_stages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm_tags" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "color" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "crm_tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm_leads" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'lead',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "expectedRevenue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "probability" DOUBLE PRECISION NOT NULL DEFAULT 10,
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
    "partnerId" TEXT,
    "dateDeadline" TIMESTAMP(3),
    "dateClosed" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "crm_leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sale_orders" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'draft',
    "dateOrder" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validityDate" TIMESTAMP(3),
    "note" TEXT,
    "amountUntaxed" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "amountTax" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "amountTotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "partnerId" TEXT NOT NULL,
    "crmLeadId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sale_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sale_order_lines" (
    "id" SERIAL NOT NULL,
    "sequence" INTEGER NOT NULL DEFAULT 10,
    "name" TEXT NOT NULL,
    "productQty" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "priceUnit" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "discount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "priceSubtotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "priceTotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "orderId" INTEGER NOT NULL,
    "productId" TEXT,

    CONSTRAINT "sale_order_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_orders" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'draft',
    "partnerRef" TEXT,
    "dateOrder" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateApprove" TIMESTAMP(3),
    "datePlanned" TIMESTAMP(3),
    "note" TEXT,
    "amountUntaxed" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "amountTax" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "amountTotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "partnerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "purchase_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_order_lines" (
    "id" SERIAL NOT NULL,
    "sequence" INTEGER NOT NULL DEFAULT 10,
    "name" TEXT NOT NULL,
    "productQty" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "qtyReceived" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "qtyInvoiced" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "priceUnit" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "priceSubtotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "priceTotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "orderId" INTEGER NOT NULL,
    "productId" TEXT,

    CONSTRAINT "purchase_order_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_categories" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "parentId" INTEGER,

    CONSTRAINT "product_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT,
    "companyId" TEXT,
    "name" TEXT NOT NULL,
    "internalRef" TEXT,
    "barcode" TEXT,
    "productType" "ProductType" NOT NULL DEFAULT 'CONSUMABLE',
    "unitOfMeasure" TEXT NOT NULL DEFAULT 'unit',
    "salesPrice" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "costPrice" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "description" TEXT,
    "descriptionSale" TEXT,
    "image" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "volume" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "categoryId" INTEGER,
    "qtyOnHand" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "qtyForecasted" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "web_carts" (
    "id" SERIAL NOT NULL,
    "sessionId" TEXT NOT NULL,
    "customerId" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'active',
    "subtotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "taxAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "discount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "web_carts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "web_cart_items" (
    "id" SERIAL NOT NULL,
    "cartId" INTEGER NOT NULL,
    "productId" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "productSku" TEXT,
    "quantity" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "unitPrice" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lineTotal" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "web_cart_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "web_orders" (
    "id" SERIAL NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "saleOrderId" INTEGER,
    "cartId" INTEGER,
    "gatewayStatus" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "web_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loyalty_programs" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "pointsPerDollar" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "loyalty_programs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loyalty_cards" (
    "id" SERIAL NOT NULL,
    "programId" INTEGER NOT NULL,
    "partnerId" TEXT NOT NULL,
    "points" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "loyalty_cards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loyalty_rewards" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "pointsCost" DOUBLE PRECISION NOT NULL,
    "rewardType" TEXT NOT NULL DEFAULT 'discount',
    "programId" INTEGER NOT NULL,

    CONSTRAINT "loyalty_rewards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_locations" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "completeName" TEXT NOT NULL,
    "usage" TEXT NOT NULL DEFAULT 'internal',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "locationId" INTEGER,
    "warehouseId" INTEGER,
    "companyId" INTEGER,

    CONSTRAINT "stock_locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_warehouses" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "stock_warehouses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_picking_types" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "sequenceCode" TEXT NOT NULL,
    "warehouseId" INTEGER,
    "defaultLocationSrcId" INTEGER,
    "defaultLocationDestId" INTEGER,

    CONSTRAINT "stock_picking_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_pickings" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "pickingTypeId" INTEGER NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'draft',
    "scheduledDate" TIMESTAMP(3),
    "dateDone" TIMESTAMP(3),
    "origin" TEXT,
    "note" TEXT,
    "locationId" INTEGER,
    "locationDestId" INTEGER,
    "partnerId" TEXT,
    "warehouseId" INTEGER,
    "saleOrderId" INTEGER,
    "purchaseOrderId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stock_pickings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_moves" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'draft',
    "productQty" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "qtyDone" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "locationId" INTEGER NOT NULL,
    "locationDestId" INTEGER NOT NULL,
    "pickingId" INTEGER,
    "productId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stock_moves_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_quants" (
    "id" SERIAL NOT NULL,
    "productId" TEXT NOT NULL,
    "locationId" INTEGER NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "reservedQuantity" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "inDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_quants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account_accounts" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "accountType" TEXT NOT NULL,
    "reconcile" BOOLEAN NOT NULL DEFAULT false,
    "deprecated" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "account_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account_journals" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "defaultAccountId" INTEGER,

    CONSTRAINT "account_journals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account_moves" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "moveType" TEXT NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'draft',
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueDate" TIMESTAMP(3),
    "ref" TEXT,
    "amountUntaxed" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "amountTax" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "amountTotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "amountResidual" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "paymentState" TEXT NOT NULL DEFAULT 'not_paid',
    "journalId" INTEGER NOT NULL,
    "partnerId" TEXT,
    "saleOrderId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "account_moves_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account_move_lines" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "priceUnit" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "priceSubtotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "priceTotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "debit" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "credit" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "balance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "reconciled" BOOLEAN NOT NULL DEFAULT false,
    "accountId" INTEGER,
    "moveId" INTEGER NOT NULL,
    "productId" TEXT,

    CONSTRAINT "account_move_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fs_tasks" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "state" TEXT NOT NULL DEFAULT 'new',
    "priority" INTEGER NOT NULL DEFAULT 0,
    "scheduledDate" TIMESTAMP(3),
    "dateDeadline" TIMESTAMP(3),
    "partnerId" TEXT,
    "employeeId" INTEGER,
    "street" TEXT,
    "city" TEXT,
    "zip" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fs_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rental_orders" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'draft',
    "pickupDate" TIMESTAMP(3) NOT NULL,
    "returnDate" TIMESTAMP(3) NOT NULL,
    "partnerId" TEXT NOT NULL,
    "amountTotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rental_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rental_order_lines" (
    "id" SERIAL NOT NULL,
    "orderId" INTEGER NOT NULL,
    "productId" TEXT NOT NULL,
    "productQty" INTEGER NOT NULL DEFAULT 1,
    "priceUnit" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "priceSubtotal" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "rental_order_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_departments" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "color" INTEGER NOT NULL DEFAULT 0,
    "parentId" INTEGER,
    "managerId" INTEGER,

    CONSTRAINT "hr_departments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_jobs" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "expectedEmployees" INTEGER NOT NULL DEFAULT 1,
    "noOfEmployee" INTEGER NOT NULL DEFAULT 0,
    "state" TEXT NOT NULL DEFAULT 'recruit',

    CONSTRAINT "hr_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_employees" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "employeeNumber" TEXT,
    "workEmail" TEXT,
    "workPhone" TEXT,
    "mobilePhone" TEXT,
    "birthday" TIMESTAMP(3),
    "gender" TEXT,
    "maritalStatus" TEXT,
    "emergencyContact" TEXT,
    "emergencyPhone" TEXT,
    "image" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "color" INTEGER NOT NULL DEFAULT 0,
    "departmentId" INTEGER,
    "jobId" INTEGER,
    "partnerId" TEXT,
    "managerId" INTEGER,
    "coachId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hr_employees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_skills" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "hr_skills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_employee_skills" (
    "id" SERIAL NOT NULL,
    "employeeId" INTEGER NOT NULL,
    "skillId" INTEGER NOT NULL,
    "level" TEXT NOT NULL DEFAULT 'intermediate',

    CONSTRAINT "hr_employee_skills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_timesheets" (
    "id" SERIAL NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,
    "unitAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "employeeId" INTEGER NOT NULL,
    "taskId" INTEGER,
    "projectId" INTEGER,

    CONSTRAINT "hr_timesheets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_leaves" (
    "id" SERIAL NOT NULL,
    "name" TEXT,
    "state" TEXT NOT NULL DEFAULT 'draft',
    "leaveType" TEXT NOT NULL DEFAULT 'legal',
    "dateFrom" TIMESTAMP(3) NOT NULL,
    "dateTo" TIMESTAMP(3) NOT NULL,
    "numberOfDays" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "notes" TEXT,
    "employeeId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hr_leaves_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_expenses" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "state" TEXT NOT NULL DEFAULT 'draft',
    "totalAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "quantity" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "unitAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "description" TEXT,
    "paymentMode" TEXT NOT NULL DEFAULT 'own_account',
    "receipt" TEXT,
    "employeeId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hr_expenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_stages" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL DEFAULT 10,
    "foldedKanban" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "project_stages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_projects" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "color" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "dateStart" TIMESTAMP(3),
    "date" TIMESTAMP(3),
    "taskCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_tasks" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "sequence" INTEGER NOT NULL DEFAULT 10,
    "color" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "dateDeadline" TIMESTAMP(3),
    "dateEnd" TIMESTAMP(3),
    "kanbanState" TEXT NOT NULL DEFAULT 'normal',
    "stageId" INTEGER NOT NULL,
    "projectId" INTEGER NOT NULL,
    "parentId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "helpdesk_stages" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL DEFAULT 10,
    "foldedKanban" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "helpdesk_stages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "helpdesk_tickets" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "kanbanState" TEXT NOT NULL DEFAULT 'normal',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "stageId" INTEGER NOT NULL,
    "partnerId" TEXT,
    "dateDeadline" TIMESTAMP(3),
    "dateClosed" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "helpdesk_tickets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "calendar_events" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "start" TIMESTAMP(3) NOT NULL,
    "stop" TIMESTAMP(3) NOT NULL,
    "allday" BOOLEAN NOT NULL DEFAULT false,
    "location" TEXT,
    "privacy" TEXT NOT NULL DEFAULT 'public',
    "showAs" TEXT NOT NULL DEFAULT 'busy',
    "recurrency" BOOLEAN NOT NULL DEFAULT false,
    "color" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "calendar_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "calendar_attendees" (
    "id" SERIAL NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'needsAction',
    "role" TEXT NOT NULL DEFAULT 'req',
    "eventId" INTEGER NOT NULL,
    "partnerId" TEXT NOT NULL,

    CONSTRAINT "calendar_attendees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mrp_boms" (
    "id" SERIAL NOT NULL,
    "name" TEXT,
    "code" TEXT,
    "type" TEXT NOT NULL DEFAULT 'normal',
    "productQty" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "routingId" INTEGER,

    CONSTRAINT "mrp_boms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mrp_routings" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mrp_routings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mrp_routing_operations" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL DEFAULT 10,
    "routingId" INTEGER NOT NULL,
    "workcenterId" INTEGER NOT NULL,
    "duration" DOUBLE PRECISION NOT NULL DEFAULT 60,

    CONSTRAINT "mrp_routing_operations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mrp_bom_lines" (
    "id" SERIAL NOT NULL,
    "productQty" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "bomId" INTEGER NOT NULL,
    "productId" TEXT NOT NULL,

    CONSTRAINT "mrp_bom_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mrp_productions" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'draft',
    "productQty" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "qtyProduced" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "dateStart" TIMESTAMP(3),
    "dateFinished" TIMESTAMP(3),
    "origin" TEXT,
    "bomId" INTEGER,
    "productId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mrp_productions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mrp_workorders" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'pending',
    "duration" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "durationActual" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "sequence" INTEGER NOT NULL DEFAULT 10,
    "productionId" INTEGER NOT NULL,
    "workcenterId" INTEGER,

    CONSTRAINT "mrp_workorders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mrp_workcenters" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "timeEfficiency" DOUBLE PRECISION NOT NULL DEFAULT 100,
    "capacity" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "oeeTarget" DOUBLE PRECISION NOT NULL DEFAULT 90,
    "timeStart" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "timeStop" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "costsHour" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mrp_workcenters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pos_configs" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "pos_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pos_sessions" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'opening_control',
    "startAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "stopAt" TIMESTAMP(3),
    "cashRegisterBalance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "configId" INTEGER NOT NULL,

    CONSTRAINT "pos_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pos_orders" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'draft',
    "dateOrder" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "amountTotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "amountTax" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "amountPaid" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "amountReturn" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "note" TEXT,
    "sessionId" INTEGER NOT NULL,

    CONSTRAINT "pos_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pos_order_lines" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "qty" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "priceUnit" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "priceSubtotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "discount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "orderId" INTEGER NOT NULL,
    "productId" TEXT,

    CONSTRAINT "pos_order_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mail_channels" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "channelType" TEXT NOT NULL DEFAULT 'channel',
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mail_channels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mail_messages" (
    "id" SERIAL NOT NULL,
    "body" TEXT NOT NULL,
    "messageType" TEXT NOT NULL DEFAULT 'comment',
    "authorName" TEXT,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "channelId" INTEGER,
    "resModel" TEXT,
    "resId" INTEGER,

    CONSTRAINT "mail_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_events" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "dateBegin" TIMESTAMP(3) NOT NULL,
    "dateEnd" TIMESTAMP(3) NOT NULL,
    "location" TEXT,
    "description" TEXT,
    "state" TEXT NOT NULL DEFAULT 'draft',
    "seatsMax" INTEGER NOT NULL DEFAULT 0,
    "seatsAvailable" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_registrations" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "state" TEXT NOT NULL DEFAULT 'draft',
    "eventId" INTEGER NOT NULL,

    CONSTRAINT "event_registrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fleet_vehicles" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "licensePlate" TEXT,
    "model" TEXT,
    "brand" TEXT,
    "color" TEXT,
    "fuelType" TEXT,
    "odometer" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "state" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fleet_vehicles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fleet_vehicle_logs" (
    "id" SERIAL NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" TEXT NOT NULL,
    "description" TEXT,
    "amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "odometer" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "vehicleId" INTEGER NOT NULL,

    CONSTRAINT "fleet_vehicle_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "maintenance_equipment" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "serialNo" TEXT,
    "model" TEXT,
    "category" TEXT,
    "location" TEXT,
    "assignDate" TIMESTAMP(3),
    "cost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "note" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "maintenance_equipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "maintenance_requests" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "requestDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closeDate" TIMESTAMP(3),
    "priority" INTEGER NOT NULL DEFAULT 0,
    "stage" TEXT NOT NULL DEFAULT 'new',
    "maintenanceType" TEXT NOT NULL DEFAULT 'corrective',
    "equipmentId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "maintenance_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "surveys" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "state" TEXT NOT NULL DEFAULT 'draft',
    "scoringType" TEXT NOT NULL DEFAULT 'no_scoring',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "surveys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "survey_questions" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "questionType" TEXT NOT NULL DEFAULT 'text_box',
    "sequence" INTEGER NOT NULL DEFAULT 10,
    "isRequired" BOOLEAN NOT NULL DEFAULT false,
    "constrMandatory" BOOLEAN NOT NULL DEFAULT false,
    "surveyId" INTEGER NOT NULL,

    CONSTRAINT "survey_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "survey_answers" (
    "id" SERIAL NOT NULL,
    "value" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL DEFAULT 10,
    "isCorrect" BOOLEAN NOT NULL DEFAULT false,
    "questionId" INTEGER NOT NULL,

    CONSTRAINT "survey_answers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "survey_user_inputs" (
    "id" SERIAL NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'new',
    "startDatetime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDatetime" TIMESTAMP(3),
    "email" TEXT,
    "surveyId" INTEGER NOT NULL,

    CONSTRAINT "survey_user_inputs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notes" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "body" TEXT,
    "stage" TEXT NOT NULL DEFAULT 'new',
    "color" INTEGER NOT NULL DEFAULT 0,
    "sequence" INTEGER NOT NULL DEFAULT 10,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "knowledge_articles" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "category" TEXT,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "workspaceId" INTEGER,

    CONSTRAINT "knowledge_articles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "knowledge_workspaces" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "knowledge_workspaces_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "knowledge_article_revisions" (
    "id" SERIAL NOT NULL,
    "articleId" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "knowledge_article_revisions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lunch_suppliers" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "lunch_suppliers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lunch_products" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "category" TEXT,
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "supplierId" INTEGER NOT NULL,

    CONSTRAINT "lunch_products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lunch_orders" (
    "id" SERIAL NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'new',
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "quantity" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "price" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "note" TEXT,
    "productId" INTEGER NOT NULL,

    CONSTRAINT "lunch_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "website_pages" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "content" TEXT,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "website_pages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mass_mailings" (
    "id" SERIAL NOT NULL,
    "subject" TEXT NOT NULL,
    "bodyHtml" TEXT,
    "state" TEXT NOT NULL DEFAULT 'draft',
    "sentDate" TIMESTAMP(3),
    "scheduledDate" TIMESTAMP(3),
    "sentCount" INTEGER NOT NULL DEFAULT 0,
    "openedCount" INTEGER NOT NULL DEFAULT 0,
    "clickedCount" INTEGER NOT NULL DEFAULT 0,
    "bouncedCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mass_mailings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "social_posts" (
    "id" SERIAL NOT NULL,
    "content" TEXT NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'draft',
    "scheduledDate" TIMESTAMP(3),
    "publishedDate" TIMESTAMP(3),
    "postFacebook" BOOLEAN NOT NULL DEFAULT false,
    "postTwitter" BOOLEAN NOT NULL DEFAULT false,
    "postLinkedin" BOOLEAN NOT NULL DEFAULT false,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "comments" INTEGER NOT NULL DEFAULT 0,
    "shares" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "social_posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_applicants" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "partnerName" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "stage" TEXT NOT NULL DEFAULT 'new',
    "priority" INTEGER NOT NULL DEFAULT 0,
    "salary" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "source" TEXT,
    "description" TEXT,
    "jobId" INTEGER,
    "departmentId" INTEGER,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hr_applicants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_attendances" (
    "id" SERIAL NOT NULL,
    "checkIn" TIMESTAMP(3) NOT NULL,
    "checkOut" TIMESTAMP(3),
    "workedHours" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "employeeId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hr_attendances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_payslips" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'draft',
    "dateFrom" TIMESTAMP(3) NOT NULL,
    "dateTo" TIMESTAMP(3) NOT NULL,
    "basicWage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "grossSalary" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "netSalary" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "deductions" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "employeeId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hr_payslips_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_appraisals" (
    "id" SERIAL NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'new',
    "deadline" TIMESTAMP(3),
    "finalInterview" TIMESTAMP(3),
    "managerFeedback" TEXT,
    "employeeFeedback" TEXT,
    "overallRating" INTEGER NOT NULL DEFAULT 0,
    "employeeId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hr_appraisals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quality_points" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "testType" TEXT NOT NULL DEFAULT 'passfail',
    "productId" TEXT,
    "workcenterId" INTEGER,
    "teamId" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quality_points_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quality_checks" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'none',
    "testType" TEXT NOT NULL DEFAULT 'passfail',
    "measureValue" DOUBLE PRECISION,
    "notes" TEXT,
    "picture" TEXT,
    "pointId" INTEGER,
    "productId" TEXT,
    "productionId" INTEGER,
    "workorderId" INTEGER,
    "pickingId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quality_checks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mrp_ecos" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "stage" TEXT NOT NULL DEFAULT 'draft',
    "type" TEXT NOT NULL DEFAULT 'product',
    "description" TEXT,
    "effectivity" TEXT,
    "effectivityDate" TIMESTAMP(3),
    "approvalState" TEXT NOT NULL DEFAULT 'none',
    "productId" TEXT,
    "bomId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mrp_ecos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" SERIAL NOT NULL,
    "name" TEXT,
    "state" TEXT NOT NULL DEFAULT 'draft',
    "plan" TEXT NOT NULL DEFAULT 'starter',
    "mrr" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "nextBilling" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "recurringInterval" INTEGER NOT NULL DEFAULT 1,
    "recurringRule" TEXT NOT NULL DEFAULT 'monthly',
    "partnerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "planning_slots" (
    "id" SERIAL NOT NULL,
    "role" TEXT,
    "hours" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "note" TEXT,
    "state" TEXT NOT NULL DEFAULT 'draft',
    "employeeId" INTEGER,
    "projectId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "planning_slots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketing_campaigns" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'email',
    "state" TEXT NOT NULL DEFAULT 'draft',
    "budget" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "spent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "leads" INTEGER NOT NULL DEFAULT 0,
    "conversions" INTEGER NOT NULL DEFAULT 0,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "marketing_campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_PartnerToPartnerTag" (
    "A" TEXT NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "system_configs" (
    "id" SERIAL NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "spreadsheets" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "data" TEXT NOT NULL DEFAULT '{}',
    "partnerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "spreadsheets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflows" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "model" TEXT NOT NULL,
    "trigger" TEXT NOT NULL,
    "condition" TEXT,
    "action" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workflows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_warehouse_orderpoints" (
    "id" SERIAL NOT NULL,
    "name" TEXT,
    "productId" TEXT NOT NULL,
    "locationId" INTEGER NOT NULL,
    "warehouseId" INTEGER,
    "productMinQty" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "productMaxQty" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "qtyMultiple" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stock_warehouse_orderpoints_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_rules" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "routeId" INTEGER NOT NULL,
    "locationSrcId" INTEGER,
    "locationDestId" INTEGER NOT NULL,
    "sequence" INTEGER NOT NULL DEFAULT 10,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "stock_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_routes" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL DEFAULT 10,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "stock_routes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vendor_pricelists" (
    "id" SERIAL NOT NULL,
    "partnerId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "productName" TEXT,
    "productCode" TEXT,
    "sequence" INTEGER NOT NULL DEFAULT 10,
    "minQty" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "price" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "delay" INTEGER NOT NULL DEFAULT 1,
    "currency" TEXT NOT NULL DEFAULT 'USD',

    CONSTRAINT "vendor_pricelists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_SpinePermissionToSpineRole" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_CrmLeadToCrmTag" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "_ProductStockRoute" (
    "A" TEXT NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Organization_slug_key" ON "Organization"("slug");

-- CreateIndex
CREATE INDEX "SpineCompany_organizationId_idx" ON "SpineCompany"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "SpineUser_email_key" ON "SpineUser"("email");

-- CreateIndex
CREATE INDEX "SpineUser_organizationId_idx" ON "SpineUser"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "SpineRole_key_key" ON "SpineRole"("key");

-- CreateIndex
CREATE UNIQUE INDEX "SpinePermission_key_key" ON "SpinePermission"("key");

-- CreateIndex
CREATE INDEX "Attachment_ownerType_ownerId_idx" ON "Attachment"("ownerType", "ownerId");

-- CreateIndex
CREATE INDEX "Attachment_organizationId_idx" ON "Attachment"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "SpineDocument_attachmentId_key" ON "SpineDocument"("attachmentId");

-- CreateIndex
CREATE INDEX "SpineDocument_organizationId_idx" ON "SpineDocument"("organizationId");

-- CreateIndex
CREATE INDEX "Activity_ownerType_ownerId_idx" ON "Activity"("ownerType", "ownerId");

-- CreateIndex
CREATE INDEX "Activity_organizationId_idx" ON "Activity"("organizationId");

-- CreateIndex
CREATE INDEX "ChatterMessage_ownerType_ownerId_idx" ON "ChatterMessage"("ownerType", "ownerId");

-- CreateIndex
CREATE INDEX "ChatterMessage_organizationId_idx" ON "ChatterMessage"("organizationId");

-- CreateIndex
CREATE INDEX "TimelineEvent_partnerId_idx" ON "TimelineEvent"("partnerId");

-- CreateIndex
CREATE INDEX "TimelineEvent_ownerType_ownerId_idx" ON "TimelineEvent"("ownerType", "ownerId");

-- CreateIndex
CREATE INDEX "TimelineEvent_organizationId_idx" ON "TimelineEvent"("organizationId");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_organizationId_createdAt_idx" ON "AuditLog"("organizationId", "createdAt");

-- CreateIndex
CREATE INDEX "OutboxEvent_publishedAt_idx" ON "OutboxEvent"("publishedAt");

-- CreateIndex
CREATE INDEX "OutboxEvent_organizationId_idx" ON "OutboxEvent"("organizationId");

-- CreateIndex
CREATE INDEX "partners_organizationId_idx" ON "partners"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "user_passkeys_credentialId_key" ON "user_passkeys"("credentialId");

-- CreateIndex
CREATE UNIQUE INDEX "sale_orders_name_key" ON "sale_orders"("name");

-- CreateIndex
CREATE UNIQUE INDEX "purchase_orders_name_key" ON "purchase_orders"("name");

-- CreateIndex
CREATE UNIQUE INDEX "web_carts_sessionId_key" ON "web_carts"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "web_orders_orderNumber_key" ON "web_orders"("orderNumber");

-- CreateIndex
CREATE UNIQUE INDEX "loyalty_cards_partnerId_key" ON "loyalty_cards"("partnerId");

-- CreateIndex
CREATE UNIQUE INDEX "stock_warehouses_code_key" ON "stock_warehouses"("code");

-- CreateIndex
CREATE UNIQUE INDEX "stock_pickings_name_key" ON "stock_pickings"("name");

-- CreateIndex
CREATE UNIQUE INDEX "stock_quants_productId_locationId_key" ON "stock_quants"("productId", "locationId");

-- CreateIndex
CREATE UNIQUE INDEX "account_accounts_code_key" ON "account_accounts"("code");

-- CreateIndex
CREATE UNIQUE INDEX "account_journals_code_key" ON "account_journals"("code");

-- CreateIndex
CREATE UNIQUE INDEX "account_moves_name_key" ON "account_moves"("name");

-- CreateIndex
CREATE UNIQUE INDEX "hr_departments_managerId_key" ON "hr_departments"("managerId");

-- CreateIndex
CREATE UNIQUE INDEX "hr_employees_partnerId_key" ON "hr_employees"("partnerId");

-- CreateIndex
CREATE UNIQUE INDEX "hr_skills_name_key" ON "hr_skills"("name");

-- CreateIndex
CREATE UNIQUE INDEX "calendar_attendees_eventId_partnerId_key" ON "calendar_attendees"("eventId", "partnerId");

-- CreateIndex
CREATE UNIQUE INDEX "mrp_productions_name_key" ON "mrp_productions"("name");

-- CreateIndex
CREATE UNIQUE INDEX "pos_sessions_name_key" ON "pos_sessions"("name");

-- CreateIndex
CREATE UNIQUE INDEX "pos_orders_name_key" ON "pos_orders"("name");

-- CreateIndex
CREATE UNIQUE INDEX "website_pages_url_key" ON "website_pages"("url");

-- CreateIndex
CREATE INDEX "_PartnerToPartnerTag_B_index" ON "_PartnerToPartnerTag"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_PartnerToPartnerTag_AB_unique" ON "_PartnerToPartnerTag"("A", "B");

-- CreateIndex
CREATE UNIQUE INDEX "system_configs_key_key" ON "system_configs"("key");

-- CreateIndex
CREATE UNIQUE INDEX "_SpinePermissionToSpineRole_AB_unique" ON "_SpinePermissionToSpineRole"("A", "B");

-- CreateIndex
CREATE INDEX "_SpinePermissionToSpineRole_B_index" ON "_SpinePermissionToSpineRole"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_CrmLeadToCrmTag_AB_unique" ON "_CrmLeadToCrmTag"("A", "B");

-- CreateIndex
CREATE INDEX "_CrmLeadToCrmTag_B_index" ON "_CrmLeadToCrmTag"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_ProductStockRoute_AB_unique" ON "_ProductStockRoute"("A", "B");

-- CreateIndex
CREATE INDEX "_ProductStockRoute_B_index" ON "_ProductStockRoute"("B");

-- AddForeignKey
ALTER TABLE "SpineCompany" ADD CONSTRAINT "SpineCompany_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpineUser" ADD CONSTRAINT "SpineUser_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpineUserRole" ADD CONSTRAINT "SpineUserRole_userId_fkey" FOREIGN KEY ("userId") REFERENCES "SpineUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpineUserRole" ADD CONSTRAINT "SpineUserRole_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "SpineRole"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpinePartnerAddress" ADD CONSTRAINT "SpinePartnerAddress_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "partners"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpinePartnerContact" ADD CONSTRAINT "SpinePartnerContact_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "partners"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "partners" ADD CONSTRAINT "partners_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "partners"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_passkeys" ADD CONSTRAINT "user_passkeys_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "partners"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_leads" ADD CONSTRAINT "crm_leads_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "partners"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_leads" ADD CONSTRAINT "crm_leads_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "crm_stages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale_orders" ADD CONSTRAINT "sale_orders_crmLeadId_fkey" FOREIGN KEY ("crmLeadId") REFERENCES "crm_leads"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale_orders" ADD CONSTRAINT "sale_orders_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "partners"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale_order_lines" ADD CONSTRAINT "sale_order_lines_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale_order_lines" ADD CONSTRAINT "sale_order_lines_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "sale_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "partners"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_order_lines" ADD CONSTRAINT "purchase_order_lines_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_order_lines" ADD CONSTRAINT "purchase_order_lines_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "purchase_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_categories" ADD CONSTRAINT "product_categories_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "product_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "product_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "web_cart_items" ADD CONSTRAINT "web_cart_items_cartId_fkey" FOREIGN KEY ("cartId") REFERENCES "web_carts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "web_cart_items" ADD CONSTRAINT "web_cart_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loyalty_cards" ADD CONSTRAINT "loyalty_cards_programId_fkey" FOREIGN KEY ("programId") REFERENCES "loyalty_programs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loyalty_cards" ADD CONSTRAINT "loyalty_cards_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "partners"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loyalty_rewards" ADD CONSTRAINT "loyalty_rewards_programId_fkey" FOREIGN KEY ("programId") REFERENCES "loyalty_programs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_locations" ADD CONSTRAINT "stock_locations_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "stock_locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_locations" ADD CONSTRAINT "stock_locations_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "stock_warehouses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_picking_types" ADD CONSTRAINT "stock_picking_types_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "stock_warehouses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_picking_types" ADD CONSTRAINT "stock_picking_types_defaultLocationSrcId_fkey" FOREIGN KEY ("defaultLocationSrcId") REFERENCES "stock_locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_picking_types" ADD CONSTRAINT "stock_picking_types_defaultLocationDestId_fkey" FOREIGN KEY ("defaultLocationDestId") REFERENCES "stock_locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_pickings" ADD CONSTRAINT "stock_pickings_pickingTypeId_fkey" FOREIGN KEY ("pickingTypeId") REFERENCES "stock_picking_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_pickings" ADD CONSTRAINT "stock_pickings_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "stock_locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_pickings" ADD CONSTRAINT "stock_pickings_locationDestId_fkey" FOREIGN KEY ("locationDestId") REFERENCES "stock_locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_pickings" ADD CONSTRAINT "stock_pickings_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "partners"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_pickings" ADD CONSTRAINT "stock_pickings_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "purchase_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_pickings" ADD CONSTRAINT "stock_pickings_saleOrderId_fkey" FOREIGN KEY ("saleOrderId") REFERENCES "sale_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_pickings" ADD CONSTRAINT "stock_pickings_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "stock_warehouses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_moves" ADD CONSTRAINT "stock_moves_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "stock_locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_moves" ADD CONSTRAINT "stock_moves_locationDestId_fkey" FOREIGN KEY ("locationDestId") REFERENCES "stock_locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_moves" ADD CONSTRAINT "stock_moves_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_moves" ADD CONSTRAINT "stock_moves_pickingId_fkey" FOREIGN KEY ("pickingId") REFERENCES "stock_pickings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_quants" ADD CONSTRAINT "stock_quants_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_quants" ADD CONSTRAINT "stock_quants_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "stock_locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account_journals" ADD CONSTRAINT "account_journals_defaultAccountId_fkey" FOREIGN KEY ("defaultAccountId") REFERENCES "account_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account_moves" ADD CONSTRAINT "account_moves_saleOrderId_fkey" FOREIGN KEY ("saleOrderId") REFERENCES "sale_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account_moves" ADD CONSTRAINT "account_moves_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "partners"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account_moves" ADD CONSTRAINT "account_moves_journalId_fkey" FOREIGN KEY ("journalId") REFERENCES "account_journals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account_move_lines" ADD CONSTRAINT "account_move_lines_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "account_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account_move_lines" ADD CONSTRAINT "account_move_lines_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account_move_lines" ADD CONSTRAINT "account_move_lines_moveId_fkey" FOREIGN KEY ("moveId") REFERENCES "account_moves"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fs_tasks" ADD CONSTRAINT "fs_tasks_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "hr_employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fs_tasks" ADD CONSTRAINT "fs_tasks_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "partners"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rental_orders" ADD CONSTRAINT "rental_orders_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "partners"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rental_order_lines" ADD CONSTRAINT "rental_order_lines_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rental_order_lines" ADD CONSTRAINT "rental_order_lines_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "rental_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr_departments" ADD CONSTRAINT "hr_departments_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "hr_employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr_departments" ADD CONSTRAINT "hr_departments_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "hr_departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr_employees" ADD CONSTRAINT "hr_employees_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "hr_employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr_employees" ADD CONSTRAINT "hr_employees_coachId_fkey" FOREIGN KEY ("coachId") REFERENCES "hr_employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr_employees" ADD CONSTRAINT "hr_employees_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "partners"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr_employees" ADD CONSTRAINT "hr_employees_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "hr_jobs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr_employees" ADD CONSTRAINT "hr_employees_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "hr_departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr_employee_skills" ADD CONSTRAINT "hr_employee_skills_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "hr_employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr_employee_skills" ADD CONSTRAINT "hr_employee_skills_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "hr_skills"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr_timesheets" ADD CONSTRAINT "hr_timesheets_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "project_projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr_timesheets" ADD CONSTRAINT "hr_timesheets_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "project_tasks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr_timesheets" ADD CONSTRAINT "hr_timesheets_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "hr_employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr_leaves" ADD CONSTRAINT "hr_leaves_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "hr_employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr_expenses" ADD CONSTRAINT "hr_expenses_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "hr_employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_tasks" ADD CONSTRAINT "project_tasks_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "project_tasks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_tasks" ADD CONSTRAINT "project_tasks_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "project_projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_tasks" ADD CONSTRAINT "project_tasks_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "project_stages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "helpdesk_tickets" ADD CONSTRAINT "helpdesk_tickets_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "partners"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "helpdesk_tickets" ADD CONSTRAINT "helpdesk_tickets_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "helpdesk_stages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calendar_attendees" ADD CONSTRAINT "calendar_attendees_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "partners"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calendar_attendees" ADD CONSTRAINT "calendar_attendees_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "calendar_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mrp_boms" ADD CONSTRAINT "mrp_boms_routingId_fkey" FOREIGN KEY ("routingId") REFERENCES "mrp_routings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mrp_routing_operations" ADD CONSTRAINT "mrp_routing_operations_routingId_fkey" FOREIGN KEY ("routingId") REFERENCES "mrp_routings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mrp_routing_operations" ADD CONSTRAINT "mrp_routing_operations_workcenterId_fkey" FOREIGN KEY ("workcenterId") REFERENCES "mrp_workcenters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mrp_bom_lines" ADD CONSTRAINT "mrp_bom_lines_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mrp_bom_lines" ADD CONSTRAINT "mrp_bom_lines_bomId_fkey" FOREIGN KEY ("bomId") REFERENCES "mrp_boms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mrp_productions" ADD CONSTRAINT "mrp_productions_bomId_fkey" FOREIGN KEY ("bomId") REFERENCES "mrp_boms"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mrp_productions" ADD CONSTRAINT "mrp_productions_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mrp_workorders" ADD CONSTRAINT "mrp_workorders_productionId_fkey" FOREIGN KEY ("productionId") REFERENCES "mrp_productions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mrp_workorders" ADD CONSTRAINT "mrp_workorders_workcenterId_fkey" FOREIGN KEY ("workcenterId") REFERENCES "mrp_workcenters"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pos_sessions" ADD CONSTRAINT "pos_sessions_configId_fkey" FOREIGN KEY ("configId") REFERENCES "pos_configs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pos_orders" ADD CONSTRAINT "pos_orders_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "pos_sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pos_order_lines" ADD CONSTRAINT "pos_order_lines_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pos_order_lines" ADD CONSTRAINT "pos_order_lines_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "pos_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mail_messages" ADD CONSTRAINT "mail_messages_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "mail_channels"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_registrations" ADD CONSTRAINT "event_registrations_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "event_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fleet_vehicle_logs" ADD CONSTRAINT "fleet_vehicle_logs_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "fleet_vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_requests" ADD CONSTRAINT "maintenance_requests_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "maintenance_equipment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "survey_questions" ADD CONSTRAINT "survey_questions_surveyId_fkey" FOREIGN KEY ("surveyId") REFERENCES "surveys"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "survey_answers" ADD CONSTRAINT "survey_answers_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "survey_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "survey_user_inputs" ADD CONSTRAINT "survey_user_inputs_surveyId_fkey" FOREIGN KEY ("surveyId") REFERENCES "surveys"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_articles" ADD CONSTRAINT "knowledge_articles_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "knowledge_workspaces"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_article_revisions" ADD CONSTRAINT "knowledge_article_revisions_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "knowledge_articles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lunch_products" ADD CONSTRAINT "lunch_products_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "lunch_suppliers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lunch_orders" ADD CONSTRAINT "lunch_orders_productId_fkey" FOREIGN KEY ("productId") REFERENCES "lunch_products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr_applicants" ADD CONSTRAINT "hr_applicants_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "hr_departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr_applicants" ADD CONSTRAINT "hr_applicants_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "hr_jobs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr_attendances" ADD CONSTRAINT "hr_attendances_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "hr_employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr_payslips" ADD CONSTRAINT "hr_payslips_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "hr_employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr_appraisals" ADD CONSTRAINT "hr_appraisals_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "hr_employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quality_points" ADD CONSTRAINT "quality_points_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quality_points" ADD CONSTRAINT "quality_points_workcenterId_fkey" FOREIGN KEY ("workcenterId") REFERENCES "mrp_workcenters"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quality_checks" ADD CONSTRAINT "quality_checks_pointId_fkey" FOREIGN KEY ("pointId") REFERENCES "quality_points"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quality_checks" ADD CONSTRAINT "quality_checks_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quality_checks" ADD CONSTRAINT "quality_checks_productionId_fkey" FOREIGN KEY ("productionId") REFERENCES "mrp_productions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quality_checks" ADD CONSTRAINT "quality_checks_workorderId_fkey" FOREIGN KEY ("workorderId") REFERENCES "mrp_workorders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quality_checks" ADD CONSTRAINT "quality_checks_pickingId_fkey" FOREIGN KEY ("pickingId") REFERENCES "stock_pickings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mrp_ecos" ADD CONSTRAINT "mrp_ecos_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mrp_ecos" ADD CONSTRAINT "mrp_ecos_bomId_fkey" FOREIGN KEY ("bomId") REFERENCES "mrp_boms"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "partners"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "planning_slots" ADD CONSTRAINT "planning_slots_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "project_projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "planning_slots" ADD CONSTRAINT "planning_slots_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "hr_employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PartnerToPartnerTag" ADD CONSTRAINT "_PartnerToPartnerTag_B_fkey" FOREIGN KEY ("B") REFERENCES "partner_tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PartnerToPartnerTag" ADD CONSTRAINT "_PartnerToPartnerTag_A_fkey" FOREIGN KEY ("A") REFERENCES "partners"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "spreadsheets" ADD CONSTRAINT "spreadsheets_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "partners"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_warehouse_orderpoints" ADD CONSTRAINT "stock_warehouse_orderpoints_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_warehouse_orderpoints" ADD CONSTRAINT "stock_warehouse_orderpoints_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "stock_locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_warehouse_orderpoints" ADD CONSTRAINT "stock_warehouse_orderpoints_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "stock_warehouses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_rules" ADD CONSTRAINT "stock_rules_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "stock_routes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_rules" ADD CONSTRAINT "stock_rules_locationSrcId_fkey" FOREIGN KEY ("locationSrcId") REFERENCES "stock_locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_rules" ADD CONSTRAINT "stock_rules_locationDestId_fkey" FOREIGN KEY ("locationDestId") REFERENCES "stock_locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor_pricelists" ADD CONSTRAINT "vendor_pricelists_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "partners"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor_pricelists" ADD CONSTRAINT "vendor_pricelists_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SpinePermissionToSpineRole" ADD CONSTRAINT "_SpinePermissionToSpineRole_A_fkey" FOREIGN KEY ("A") REFERENCES "SpinePermission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SpinePermissionToSpineRole" ADD CONSTRAINT "_SpinePermissionToSpineRole_B_fkey" FOREIGN KEY ("B") REFERENCES "SpineRole"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CrmLeadToCrmTag" ADD CONSTRAINT "_CrmLeadToCrmTag_A_fkey" FOREIGN KEY ("A") REFERENCES "crm_leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CrmLeadToCrmTag" ADD CONSTRAINT "_CrmLeadToCrmTag_B_fkey" FOREIGN KEY ("B") REFERENCES "crm_tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProductStockRoute" ADD CONSTRAINT "_ProductStockRoute_A_fkey" FOREIGN KEY ("A") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProductStockRoute" ADD CONSTRAINT "_ProductStockRoute_B_fkey" FOREIGN KEY ("B") REFERENCES "stock_routes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
