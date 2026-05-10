-- AlterTable
ALTER TABLE "helpdesk_tickets" ADD COLUMN     "slaDeadline" TIMESTAMP(3),
ADD COLUMN     "slaExceeded" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "teamId" INTEGER;

-- AlterTable
ALTER TABLE "hr_applicants" ADD COLUMN     "resumeUrl" TEXT,
ADD COLUMN     "stageId" INTEGER;

-- AlterTable
ALTER TABLE "mail_messages" ADD COLUMN     "authorId" TEXT;

-- CreateTable
CREATE TABLE "crm_activities" (
    "id" SERIAL NOT NULL,
    "leadId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "body" TEXT,
    "dueAt" TIMESTAMP(3),
    "doneAt" TIMESTAMP(3),
    "organizationId" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "crm_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "helpdesk_teams" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "helpdesk_teams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "appraisal_goals" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "deadline" TIMESTAMP(3),
    "progress" INTEGER NOT NULL DEFAULT 0,
    "tag" TEXT,
    "appraisalId" INTEGER NOT NULL,
    "employeeId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "appraisal_goals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mrp_eco_lines" (
    "id" SERIAL NOT NULL,
    "ecoId" INTEGER NOT NULL,
    "action" TEXT NOT NULL DEFAULT 'change',
    "productId" TEXT NOT NULL,
    "newQty" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "bomLineId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mrp_eco_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mail_message_reactions" (
    "id" SERIAL NOT NULL,
    "emoji" TEXT NOT NULL,
    "authorId" TEXT,
    "messageId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mail_message_reactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_recruitment_stages" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL DEFAULT 10,
    "requirements" TEXT,
    "foldedKanban" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hr_recruitment_stages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "crm_activities_leadId_idx" ON "crm_activities"("leadId");

-- CreateIndex
CREATE INDEX "crm_activities_organizationId_idx" ON "crm_activities"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "mail_message_reactions_messageId_emoji_authorId_key" ON "mail_message_reactions"("messageId", "emoji", "authorId");

-- CreateIndex
CREATE INDEX "helpdesk_tickets_teamId_idx" ON "helpdesk_tickets"("teamId");

-- AddForeignKey
ALTER TABLE "crm_activities" ADD CONSTRAINT "crm_activities_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "crm_leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "helpdesk_tickets" ADD CONSTRAINT "helpdesk_tickets_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "helpdesk_teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr_applicants" ADD CONSTRAINT "hr_applicants_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "hr_recruitment_stages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appraisal_goals" ADD CONSTRAINT "appraisal_goals_appraisalId_fkey" FOREIGN KEY ("appraisalId") REFERENCES "hr_appraisals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appraisal_goals" ADD CONSTRAINT "appraisal_goals_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "hr_employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mrp_eco_lines" ADD CONSTRAINT "mrp_eco_lines_ecoId_fkey" FOREIGN KEY ("ecoId") REFERENCES "mrp_ecos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mrp_eco_lines" ADD CONSTRAINT "mrp_eco_lines_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mrp_eco_lines" ADD CONSTRAINT "mrp_eco_lines_bomLineId_fkey" FOREIGN KEY ("bomLineId") REFERENCES "mrp_bom_lines"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mail_message_reactions" ADD CONSTRAINT "mail_message_reactions_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "mail_messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
