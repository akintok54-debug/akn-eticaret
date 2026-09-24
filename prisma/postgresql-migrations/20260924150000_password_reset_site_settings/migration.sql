BEGIN;
ALTER TABLE "CustomerAccount" ADD COLUMN "resetTokenHash" TEXT, ADD COLUMN "resetExpiresAt" TIMESTAMP(3), ADD COLUMN "resetRequestedAt" TIMESTAMP(3), ADD COLUMN "resetWindowAt" TIMESTAMP(3), ADD COLUMN "resetRequests" INTEGER NOT NULL DEFAULT 0;
CREATE UNIQUE INDEX "CustomerAccount_resetTokenHash_key" ON "CustomerAccount"("resetTokenHash");
CREATE TABLE "SiteConfiguration" (
"id" TEXT NOT NULL DEFAULT 'main', "siteTitle" TEXT NOT NULL DEFAULT 'AKN Motosiklet | Yedek Parça ve Aksesuar',
"siteDescription" TEXT NOT NULL DEFAULT 'Motosiklet yedek parça ve aksesuar mağazası', "keywords" TEXT NOT NULL DEFAULT '', "geoContent" TEXT NOT NULL DEFAULT '',
"smtpHost" TEXT NOT NULL DEFAULT '', "smtpPort" INTEGER NOT NULL DEFAULT 587, "smtpUser" TEXT NOT NULL DEFAULT '', "smtpPassword" TEXT NOT NULL DEFAULT '', "smtpFrom" TEXT NOT NULL DEFAULT '', "smtpEnabled" BOOLEAN NOT NULL DEFAULT false, "publicUrl" TEXT NOT NULL DEFAULT '', "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
CONSTRAINT "SiteConfiguration_pkey" PRIMARY KEY ("id"));
COMMIT;
