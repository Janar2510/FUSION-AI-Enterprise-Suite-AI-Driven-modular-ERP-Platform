-- Manufacturing backorders: self-referential FK on mrp_productions
ALTER TABLE "mrp_productions" ADD COLUMN "backorderId" INTEGER;
ALTER TABLE "mrp_productions" ADD CONSTRAINT "mrp_productions_backorderId_fkey"
    FOREIGN KEY ("backorderId") REFERENCES "mrp_productions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Scrap orders
CREATE TABLE "mrp_scraps" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'draft',
    "productQty" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "scrapQty" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "origin" TEXT,
    "productionId" INTEGER,
    "productId" TEXT,
    "locationId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mrp_scraps_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "mrp_scraps" ADD CONSTRAINT "mrp_scraps_productionId_fkey"
    FOREIGN KEY ("productionId") REFERENCES "mrp_productions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "mrp_scraps" ADD CONSTRAINT "mrp_scraps_productId_fkey"
    FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;
