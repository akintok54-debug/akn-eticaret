BEGIN;
CREATE TABLE "GuestSession" ("id" TEXT NOT NULL PRIMARY KEY, "tokenHash" TEXT NOT NULL UNIQUE, "expiresAt" TIMESTAMP(3) NOT NULL);
CREATE INDEX "GuestSession_expiresAt_idx" ON "GuestSession"("expiresAt");
CREATE TABLE "StoreSettings" ("id" TEXT NOT NULL PRIMARY KEY DEFAULT 'main', "enabled" BOOLEAN NOT NULL DEFAULT false, "bankName" TEXT NOT NULL DEFAULT '', "iban" TEXT NOT NULL DEFAULT '', "shipping" DOUBLE PRECISION NOT NULL DEFAULT 99, "threshold" DOUBLE PRECISION NOT NULL DEFAULT 2000, "updatedAt" TIMESTAMP(3) NOT NULL);
CREATE TABLE "Coupon" ("id" TEXT NOT NULL PRIMARY KEY, "code" TEXT NOT NULL UNIQUE, "description" TEXT NOT NULL DEFAULT '', "discountPercent" DOUBLE PRECISION NOT NULL, "minSubtotal" DOUBLE PRECISION NOT NULL DEFAULT 0, "maxUses" INTEGER, "usedCount" INTEGER NOT NULL DEFAULT 0, "startsAt" TIMESTAMP(3), "endsAt" TIMESTAMP(3), "active" BOOLEAN NOT NULL DEFAULT true, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
CONSTRAINT "Coupon_discount_range" CHECK ("discountPercent">0 AND "discountPercent"<=100),
CONSTRAINT "Coupon_amount_range" CHECK ("minSubtotal">=0 AND "usedCount">=0 AND ("maxUses" IS NULL OR "maxUses">0)));
ALTER TABLE "Order" ADD COLUMN "couponCode" TEXT;

COMMIT;
