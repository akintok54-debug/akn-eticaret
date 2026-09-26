CREATE TABLE "LegalAcceptance" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "documentType" TEXT NOT NULL,
  "version" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "acceptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "LegalAcceptance_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "LegalAcceptance_orderId_documentType_key" ON "LegalAcceptance"("orderId","documentType");
CREATE INDEX "LegalAcceptance_orderId_idx" ON "LegalAcceptance"("orderId");
ALTER TABLE "LegalAcceptance" ADD CONSTRAINT "LegalAcceptance_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AccountPayment" ADD COLUMN "legalVersion" TEXT;
ALTER TABLE "AccountPayment" ADD COLUMN "legalTitle" TEXT;
ALTER TABLE "AccountPayment" ADD COLUMN "legalContent" TEXT;
ALTER TABLE "AccountPayment" ADD COLUMN "legalAcceptedAt" TIMESTAMP(3);
