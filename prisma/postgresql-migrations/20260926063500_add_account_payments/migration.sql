CREATE TABLE "AccountPayment" (
  "id" TEXT NOT NULL,
  "customerId" TEXT NOT NULL,
  "amount" DOUBLE PRECISION NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "provider" TEXT NOT NULL DEFAULT 'sipay',
  "providerRef" TEXT,
  "erpMovementId" TEXT,
  "erpSyncedAt" TIMESTAMP(3),
  "paidAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AccountPayment_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "AccountPayment" ADD CONSTRAINT "AccountPayment_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE INDEX "AccountPayment_customerId_createdAt_idx" ON "AccountPayment"("customerId", "createdAt");
CREATE INDEX "AccountPayment_status_idx" ON "AccountPayment"("status");
