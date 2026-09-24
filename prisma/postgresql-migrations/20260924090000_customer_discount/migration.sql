BEGIN;
-- Additive only: existing customer, order and cart data are preserved.
ALTER TABLE "Customer" ADD COLUMN "discountRate" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_discountRate_range" CHECK ("discountRate" >= 0 AND "discountRate" <= 100);

COMMIT;
