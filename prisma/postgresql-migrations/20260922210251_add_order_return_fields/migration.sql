-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "returnNote" TEXT,
ADD COLUMN     "returnReason" TEXT,
ADD COLUMN     "returnedAt" TIMESTAMP(3);
