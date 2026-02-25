-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_quality_checks" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'none',
    "testType" TEXT NOT NULL DEFAULT 'passfail',
    "measureValue" REAL,
    "notes" TEXT,
    "picture" TEXT,
    "pointId" INTEGER,
    "productId" INTEGER,
    "productionId" INTEGER,
    "workorderId" INTEGER,
    "pickingId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "quality_checks_pointId_fkey" FOREIGN KEY ("pointId") REFERENCES "quality_points" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "quality_checks_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "quality_checks_productionId_fkey" FOREIGN KEY ("productionId") REFERENCES "mrp_productions" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "quality_checks_workorderId_fkey" FOREIGN KEY ("workorderId") REFERENCES "mrp_workorders" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "quality_checks_pickingId_fkey" FOREIGN KEY ("pickingId") REFERENCES "stock_pickings" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_quality_checks" ("createdAt", "id", "measureValue", "name", "notes", "pickingId", "picture", "pointId", "productId", "productionId", "state", "testType", "updatedAt") SELECT "createdAt", "id", "measureValue", "name", "notes", "pickingId", "picture", "pointId", "productId", "productionId", "state", "testType", "updatedAt" FROM "quality_checks";
DROP TABLE "quality_checks";
ALTER TABLE "new_quality_checks" RENAME TO "quality_checks";
CREATE TABLE "new_quality_points" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "testType" TEXT NOT NULL DEFAULT 'passfail',
    "productId" INTEGER,
    "workcenterId" INTEGER,
    "teamId" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "quality_points_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "quality_points_workcenterId_fkey" FOREIGN KEY ("workcenterId") REFERENCES "mrp_workcenters" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_quality_points" ("createdAt", "id", "name", "notes", "productId", "teamId", "testType", "updatedAt") SELECT "createdAt", "id", "name", "notes", "productId", "teamId", "testType", "updatedAt" FROM "quality_points";
DROP TABLE "quality_points";
ALTER TABLE "new_quality_points" RENAME TO "quality_points";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
