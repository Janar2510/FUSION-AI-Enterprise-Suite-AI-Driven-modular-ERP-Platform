-- CreateTable
CREATE TABLE "mrp_routings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "mrp_routing_operations" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL DEFAULT 10,
    "routingId" INTEGER NOT NULL,
    "workcenterId" INTEGER NOT NULL,
    "duration" REAL NOT NULL DEFAULT 60,
    CONSTRAINT "mrp_routing_operations_routingId_fkey" FOREIGN KEY ("routingId") REFERENCES "mrp_routings" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "mrp_routing_operations_workcenterId_fkey" FOREIGN KEY ("workcenterId") REFERENCES "mrp_workcenters" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_mrp_boms" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT,
    "code" TEXT,
    "type" TEXT NOT NULL DEFAULT 'normal',
    "productQty" REAL NOT NULL DEFAULT 1,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "routingId" INTEGER,
    CONSTRAINT "mrp_boms_routingId_fkey" FOREIGN KEY ("routingId") REFERENCES "mrp_routings" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_mrp_boms" ("active", "code", "createdAt", "id", "name", "productQty", "type", "updatedAt") SELECT "active", "code", "createdAt", "id", "name", "productQty", "type", "updatedAt" FROM "mrp_boms";
DROP TABLE "mrp_boms";
ALTER TABLE "new_mrp_boms" RENAME TO "mrp_boms";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
