-- AlterTable
ALTER TABLE "sale_orders" ADD COLUMN     "pricelistId" INTEGER;

-- AddForeignKey
ALTER TABLE "sale_orders" ADD CONSTRAINT "sale_orders_pricelistId_fkey" FOREIGN KEY ("pricelistId") REFERENCES "pricelists"("id") ON DELETE SET NULL ON UPDATE CASCADE;
