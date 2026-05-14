-- CreateEnum
CREATE TYPE "CrmTeamMemberRole" AS ENUM ('MANAGER', 'MEMBER');

-- CreateTable
CREATE TABLE "crm_teams" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "crm_teams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm_team_members" (
    "teamId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "CrmTeamMemberRole" NOT NULL DEFAULT 'MEMBER',

    CONSTRAINT "crm_team_members_pkey" PRIMARY KEY ("teamId","userId")
);

-- AlterTable
ALTER TABLE "crm_leads" ADD COLUMN "teamId" TEXT;

-- CreateIndex
CREATE INDEX "crm_teams_organizationId_idx" ON "crm_teams"("organizationId");

-- CreateIndex
CREATE INDEX "crm_leads_teamId_idx" ON "crm_leads"("teamId");

-- AddForeignKey
ALTER TABLE "crm_teams" ADD CONSTRAINT "crm_teams_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "crm_team_members" ADD CONSTRAINT "crm_team_members_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "crm_teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "crm_team_members" ADD CONSTRAINT "crm_team_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "SpineUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "crm_leads" ADD CONSTRAINT "crm_leads_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "crm_teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;
