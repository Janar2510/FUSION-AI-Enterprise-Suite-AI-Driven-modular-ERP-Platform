/*
  Warnings:

  - Added the required column `updatedAt` to the `maintenance_equipment` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "maintenance_equipment" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "lastMaintenanceDate" TIMESTAMP(3),
ADD COLUMN     "nextMaintenanceDate" TIMESTAMP(3),
ADD COLUMN     "preventiveFreqDays" INTEGER,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "maintenance_requests" ADD COLUMN     "durationHours" DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "fleet_contracts" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'new',
    "contractType" TEXT NOT NULL DEFAULT 'insurance',
    "startDate" TIMESTAMP(3) NOT NULL,
    "expirationDate" TIMESTAMP(3),
    "costPerMonth" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "insurer" TEXT,
    "notes" TEXT,
    "vehicleId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fleet_contracts_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "fleet_contracts" ADD CONSTRAINT "fleet_contracts_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "fleet_vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
