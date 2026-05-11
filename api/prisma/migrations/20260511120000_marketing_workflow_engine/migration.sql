-- AlterTable
ALTER TABLE "campaign_participants" ADD COLUMN "nextActionAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "campaign_participants_state_nextActionAt_idx" ON "campaign_participants"("state", "nextActionAt");

-- CreateTable
CREATE TABLE "campaign_traces" (
    "id" SERIAL NOT NULL,
    "campaignId" INTEGER NOT NULL,
    "activityId" INTEGER NOT NULL,
    "participantId" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "reason" TEXT,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "dispatchedAt" TIMESTAMP(3),
    "outboxEventId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "campaign_traces_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "campaign_traces_campaignId_status_idx" ON "campaign_traces"("campaignId", "status");

-- CreateIndex
CREATE INDEX "campaign_traces_participantId_idx" ON "campaign_traces"("participantId");

-- CreateIndex
CREATE INDEX "campaign_traces_activityId_idx" ON "campaign_traces"("activityId");

-- AddForeignKey
ALTER TABLE "campaign_traces" ADD CONSTRAINT "campaign_traces_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "marketing_campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_traces" ADD CONSTRAINT "campaign_traces_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "campaign_activities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_traces" ADD CONSTRAINT "campaign_traces_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "campaign_participants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
