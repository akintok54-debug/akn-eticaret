BEGIN;
CREATE TABLE "CustomerAccount" (
"id" TEXT NOT NULL PRIMARY KEY, "customerId" TEXT NOT NULL UNIQUE, "email" TEXT NOT NULL UNIQUE,
"passwordHash" TEXT NOT NULL, "failedLogins" INTEGER NOT NULL DEFAULT 0, "lockedUntil" TIMESTAMP(3),
"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
CONSTRAINT "CustomerAccount_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE TABLE "CustomerSession" (
"id" TEXT NOT NULL PRIMARY KEY, "accountId" TEXT NOT NULL, "expiresAt" TIMESTAMP(3) NOT NULL,
"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
CONSTRAINT "CustomerSession_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "CustomerAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "CustomerSession_accountId_idx" ON "CustomerSession"("accountId");
CREATE INDEX "CustomerSession_expiresAt_idx" ON "CustomerSession"("expiresAt");
ALTER TABLE "Order"
ADD COLUMN "shippingCompany" TEXT, ADD COLUMN "trackingNumber" TEXT, ADD COLUMN "trackingUrl" TEXT,
ADD COLUMN "paymentStatus" TEXT NOT NULL DEFAULT 'pending', ADD COLUMN "paidAt" TIMESTAMP(3),
ADD COLUMN "returnRequestedAt" TIMESTAMP(3);

COMMIT;
