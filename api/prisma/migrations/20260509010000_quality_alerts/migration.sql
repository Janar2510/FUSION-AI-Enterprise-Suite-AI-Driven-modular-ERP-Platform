-- Quality Alerts module
CREATE TABLE "quality_alerts" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "stage" TEXT NOT NULL DEFAULT 'new',
    "priority" INTEGER NOT NULL DEFAULT 0,
    "description" TEXT,
    "rootCause" TEXT,
    "correctiveAction" TEXT,
    "productId" TEXT,
    "workcenterId" INTEGER,
    "teamId" TEXT,
    "checkId" INTEGER,
    "deadline" TIMESTAMP(3),
    "doneDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quality_alerts_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "quality_alerts_stage_idx" ON "quality_alerts"("stage");

ALTER TABLE "quality_alerts" ADD CONSTRAINT "quality_alerts_productId_fkey"
    FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "quality_alerts" ADD CONSTRAINT "quality_alerts_workcenterId_fkey"
    FOREIGN KEY ("workcenterId") REFERENCES "mrp_workcenters"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "quality_alerts" ADD CONSTRAINT "quality_alerts_checkId_fkey"
    FOREIGN KEY ("checkId") REFERENCES "quality_checks"("id") ON DELETE SET NULL ON UPDATE CASCADE;
