-- AlterTable
ALTER TABLE "ShoppingCart" ADD COLUMN     "abandonedAt" TIMESTAMP(3),
ADD COLUMN     "checkoutStartedAt" TIMESTAMP(3),
ADD COLUMN     "completedAt" TIMESTAMP(3),
ADD COLUMN     "orderId" TEXT,
ADD COLUMN     "orderNumber" TEXT,
ADD COLUMN     "recoveredAt" TIMESTAMP(3),
ADD COLUMN     "reminderCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "reminderSentAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "ShoppingCart_checkoutStarted_idx" ON "ShoppingCart"("checkoutStarted");

-- CreateIndex
CREATE INDEX "ShoppingCart_completedAt_idx" ON "ShoppingCart"("completedAt");

-- CreateIndex
CREATE INDEX "ShoppingCart_orderId_idx" ON "ShoppingCart"("orderId");
