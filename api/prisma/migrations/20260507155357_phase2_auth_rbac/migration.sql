/*
  Warnings:

  - You are about to drop the `_SpinePermissionToSpineRole` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "SpineUserRole" DROP CONSTRAINT "SpineUserRole_roleId_fkey";

-- DropForeignKey
ALTER TABLE "SpineUserRole" DROP CONSTRAINT "SpineUserRole_userId_fkey";

-- DropForeignKey
ALTER TABLE "_SpinePermissionToSpineRole" DROP CONSTRAINT "_SpinePermissionToSpineRole_A_fkey";

-- DropForeignKey
ALTER TABLE "_SpinePermissionToSpineRole" DROP CONSTRAINT "_SpinePermissionToSpineRole_B_fkey";

-- AlterTable
ALTER TABLE "SpineRole" ADD COLUMN     "description" TEXT,
ADD COLUMN     "organizationId" TEXT;

-- AlterTable
ALTER TABLE "SpineUser" ADD COLUMN     "active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "companyId" TEXT,
ADD COLUMN     "name" TEXT NOT NULL DEFAULT '';

-- DropTable
DROP TABLE "_SpinePermissionToSpineRole";

-- CreateTable
CREATE TABLE "SpineRolePermission" (
    "roleId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,

    CONSTRAINT "SpineRolePermission_pkey" PRIMARY KEY ("roleId","permissionId")
);

-- AddForeignKey
ALTER TABLE "SpineRole" ADD CONSTRAINT "SpineRole_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpineUserRole" ADD CONSTRAINT "SpineUserRole_userId_fkey" FOREIGN KEY ("userId") REFERENCES "SpineUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpineUserRole" ADD CONSTRAINT "SpineUserRole_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "SpineRole"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpineRolePermission" ADD CONSTRAINT "SpineRolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "SpineRole"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpineRolePermission" ADD CONSTRAINT "SpineRolePermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "SpinePermission"("id") ON DELETE CASCADE ON UPDATE CASCADE;
