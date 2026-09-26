CREATE TABLE "Subscription" (
  "id" TEXT NOT NULL,
  "customerId" TEXT,
  "customerName" TEXT NOT NULL,
  "customerPhone" TEXT NOT NULL,
  "customerEmail" TEXT,
  "status" TEXT NOT NULL DEFAULT 'active',
  "frequency" TEXT NOT NULL,
  "intervalCount" INTEGER NOT NULL DEFAULT 1,
  "remainingRuns" INTEGER,
  "nextRunAt" TIMESTAMP(3) NOT NULL,
  "lastRunAt" TIMESTAMP(3),
  "paymentMethod" TEXT NOT NULL DEFAULT 'transfer',
  "deliveryCity" TEXT NOT NULL,
  "deliveryDistrict" TEXT NOT NULL,
  "deliveryAddress" TEXT NOT NULL,
  "invoiceType" TEXT NOT NULL DEFAULT 'individual',
  "companyName" TEXT,
  "taxOffice" TEXT,
  "taxNumber" TEXT,
  "note" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SubscriptionItem" (
  "id" TEXT NOT NULL,
  "subscriptionId" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "productName" TEXT NOT NULL,
  "sku" TEXT NOT NULL,
  "unitPrice" DOUBLE PRECISION NOT NULL,
  "quantity" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SubscriptionItem_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Subscription_customerId_idx" ON "Subscription"("customerId");
CREATE INDEX "Subscription_status_idx" ON "Subscription"("status");
CREATE INDEX "Subscription_nextRunAt_idx" ON "Subscription"("nextRunAt");
CREATE INDEX "SubscriptionItem_subscriptionId_idx" ON "SubscriptionItem"("subscriptionId");
CREATE INDEX "SubscriptionItem_productId_idx" ON "SubscriptionItem"("productId");

ALTER TABLE "SubscriptionItem"
ADD CONSTRAINT "SubscriptionItem_subscriptionId_fkey"
FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
