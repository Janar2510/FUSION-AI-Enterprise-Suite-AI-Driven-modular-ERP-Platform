-- AlterTable
ALTER TABLE "event_registrations" ADD COLUMN     "ticketId" INTEGER;

-- AlterTable
ALTER TABLE "subscriptions" ADD COLUMN     "planId" INTEGER;

-- AlterTable
ALTER TABLE "website_pages" ADD COLUMN     "blocks" JSONB DEFAULT '[]';

-- CreateTable
CREATE TABLE "event_tickets" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "availability" INTEGER NOT NULL DEFAULT 0,
    "seatsAvail" INTEGER NOT NULL DEFAULT 0,
    "description" TEXT,
    "eventId" INTEGER NOT NULL,

    CONSTRAINT "event_tickets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "website_menus" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT,
    "sequence" INTEGER NOT NULL DEFAULT 10,
    "parentId" INTEGER,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "website_menus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recurring_plans" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "interval" INTEGER NOT NULL DEFAULT 1,
    "price" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recurring_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_workspaces" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "document_workspaces_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ir_documents" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "mimeType" TEXT,
    "fileUrl" TEXT,
    "fileSize" INTEGER,
    "workspaceId" INTEGER,
    "tags" TEXT[],
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "ownerId" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ir_documents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "recurring_plans_code_key" ON "recurring_plans"("code");

-- AddForeignKey
ALTER TABLE "event_tickets" ADD CONSTRAINT "event_tickets_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "event_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_registrations" ADD CONSTRAINT "event_registrations_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "event_tickets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "website_menus" ADD CONSTRAINT "website_menus_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "website_menus"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_planId_fkey" FOREIGN KEY ("planId") REFERENCES "recurring_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ir_documents" ADD CONSTRAINT "ir_documents_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "document_workspaces"("id") ON DELETE SET NULL ON UPDATE CASCADE;
