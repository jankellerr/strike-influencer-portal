/*
  Warnings:

  - You are about to drop the column `paidAt` on the `Order` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Order_paidAt_idx";

-- AlterTable
ALTER TABLE "Order" DROP COLUMN "paidAt",
ADD COLUMN     "orderedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Order_orderedAt_idx" ON "Order"("orderedAt");
