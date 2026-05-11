-- CreateTable
CREATE TABLE "campaign_participants" (
    "id" SERIAL NOT NULL,
    "campaignId" INTEGER NOT NULL,
    "targetModel" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "state" TEXT NOT NULL DEFAULT 'queued',
    "metadata" JSONB,
    "lastActivityId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "campaign_participants_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "campaign_participants_campaignId_targetModel_targetId_key" ON "campaign_participants"("campaignId", "targetModel", "targetId");

-- CreateIndex
CREATE INDEX "campaign_participants_campaignId_state_idx" ON "campaign_participants"("campaignId", "state");

-- CreateIndex
CREATE INDEX "campaign_participants_targetModel_targetId_idx" ON "campaign_participants"("targetModel", "targetId");

-- AddForeignKey
ALTER TABLE "campaign_participants" ADD CONSTRAINT "campaign_participants_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "marketing_campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;
