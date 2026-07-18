-- AlterTable
ALTER TABLE "Influencer" ADD COLUMN     "addressCity" TEXT,
ADD COLUMN     "addressNeighborhood" TEXT,
ADD COLUMN     "addressNumber" TEXT,
ADD COLUMN     "addressState" TEXT,
ADD COLUMN     "addressStreet" TEXT,
ADD COLUMN     "addressZip" TEXT,
ADD COLUMN     "cpf" TEXT,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "shirtSize" TEXT;

-- CreateTable
CREATE TABLE "TutorialVideo" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "url" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TutorialVideo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TutorialVideo_order_idx" ON "TutorialVideo"("order");
