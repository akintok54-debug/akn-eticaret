ALTER TABLE "Order" ADD COLUMN "guestSessionId" TEXT;
ALTER TABLE "Order" ADD COLUMN "checkoutKey" TEXT;
CREATE UNIQUE INDEX "Order_checkoutKey_key" ON "Order"("checkoutKey");
CREATE INDEX "Order_guestSessionId_idx" ON "Order"("guestSessionId");
