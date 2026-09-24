BEGIN;
CREATE TABLE "CatalogEntry" ("id" TEXT NOT NULL PRIMARY KEY, "kind" TEXT NOT NULL, "name" TEXT NOT NULL, "active" BOOLEAN NOT NULL DEFAULT true, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "CatalogEntry_kind_check" CHECK ("kind" IN ('category','brand')));
CREATE UNIQUE INDEX "CatalogEntry_kind_name_key" ON "CatalogEntry"("kind","name");

COMMIT;
