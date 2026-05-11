-- AlterTable
ALTER TABLE "calendar_events" ADD COLUMN     "rrule" TEXT;

-- AlterTable
ALTER TABLE "knowledge_articles" ADD COLUMN     "parentId" INTEGER;

-- AlterTable
ALTER TABLE "maintenance_equipment" ADD COLUMN     "nextDueDate" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "planning_slots" ADD COLUMN     "isRecurring" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "recurrenceRule" TEXT;

-- AddForeignKey
ALTER TABLE "knowledge_articles" ADD CONSTRAINT "knowledge_articles_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "knowledge_articles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
