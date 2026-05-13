-- CreateTable
CREATE TABLE "automation_webhook_deliveries" (
    "id" SERIAL NOT NULL,
    "status" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastHttpStatus" INTEGER,
    "lastError" TEXT,
    "payload" JSONB NOT NULL,
    "workflowId" INTEGER,
    "nextRetryAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "automation_webhook_deliveries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "automation_webhook_deliveries_status_nextRetryAt_idx" ON "automation_webhook_deliveries"("status", "nextRetryAt");
