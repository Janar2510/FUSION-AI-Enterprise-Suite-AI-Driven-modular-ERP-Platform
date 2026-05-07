-- CreateEnum
CREATE TYPE "AiActionStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'APPLIED', 'ROLLED_BACK');

-- AlterTable: add aiActions relation backing on SpineUser (no column change needed, handled by FK below)

-- CreateTable
CREATE TABLE "ai_actions" (
    "id" TEXT NOT NULL,
    "agentKey" TEXT NOT NULL,
    "triggeredById" TEXT,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "tool" TEXT NOT NULL,
    "input" JSONB NOT NULL,
    "output" JSONB NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" "AiActionStatus" NOT NULL DEFAULT 'PENDING',
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "appliedAt" TIMESTAMP(3),
    "rolledBackAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_actions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ai_actions_entityType_entityId_idx" ON "ai_actions"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "ai_actions_agentKey_status_idx" ON "ai_actions"("agentKey", "status");

-- CreateIndex
CREATE INDEX "ai_actions_triggeredById_idx" ON "ai_actions"("triggeredById");

-- AddForeignKey
ALTER TABLE "ai_actions" ADD CONSTRAINT "ai_actions_triggeredById_fkey" FOREIGN KEY ("triggeredById") REFERENCES "SpineUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_actions" ADD CONSTRAINT "ai_actions_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "SpineUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
