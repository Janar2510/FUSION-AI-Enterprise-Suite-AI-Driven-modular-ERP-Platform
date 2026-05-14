-- AlterTable
ALTER TABLE "crm_activities" ADD COLUMN     "calendarEventId" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "crm_activities_calendarEventId_key" ON "crm_activities"("calendarEventId");

-- AddForeignKey
ALTER TABLE "crm_activities" ADD CONSTRAINT "crm_activities_calendarEventId_fkey" FOREIGN KEY ("calendarEventId") REFERENCES "calendar_events"("id") ON DELETE SET NULL ON UPDATE CASCADE;
