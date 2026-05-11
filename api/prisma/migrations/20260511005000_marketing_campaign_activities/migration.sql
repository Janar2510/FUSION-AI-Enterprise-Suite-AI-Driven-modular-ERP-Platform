-- CreateTable
CREATE TABLE "campaign_activities" (
    "id" SERIAL NOT NULL,
    "campaignId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'email',
    "sequence" INTEGER NOT NULL DEFAULT 1,
    "delayValue" INTEGER NOT NULL DEFAULT 0,
    "delayUnit" TEXT NOT NULL DEFAULT 'hours',
    "templateRef" TEXT,
    "subject" TEXT,
    "body" TEXT,
    "serverAction" TEXT,
    "state" TEXT NOT NULL DEFAULT 'draft',
    "successCount" INTEGER NOT NULL DEFAULT 0,
    "rejectedCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "campaign_activities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "campaign_activities_campaignId_sequence_idx" ON "campaign_activities"("campaignId", "sequence");

-- CreateIndex
CREATE INDEX "campaign_activities_type_idx" ON "campaign_activities"("type");

-- AddForeignKey
ALTER TABLE "campaign_activities" ADD CONSTRAINT "campaign_activities_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "marketing_campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;
