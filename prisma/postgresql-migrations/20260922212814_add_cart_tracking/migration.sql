-- CreateTable
CREATE TABLE "ShoppingCart" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "customerId" TEXT,
    "customerName" TEXT,
    "customerPhone" TEXT,
    "customerEmail" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Aktif',
    "checkoutStarted" BOOLEAN NOT NULL DEFAULT false,
    "itemCount" INTEGER NOT NULL DEFAULT 0,
    "total" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lastActivityAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShoppingCart_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShoppingCartItem" (
    "id" TEXT NOT NULL,
    "cartId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "image" TEXT,
    "price" DOUBLE PRECISION NOT NULL,
    "quantity" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShoppingCartItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ShoppingCart_sessionId_key" ON "ShoppingCart"("sessionId");

-- CreateIndex
CREATE INDEX "ShoppingCart_status_idx" ON "ShoppingCart"("status");

-- CreateIndex
CREATE INDEX "ShoppingCart_lastActivityAt_idx" ON "ShoppingCart"("lastActivityAt");

-- CreateIndex
CREATE INDEX "ShoppingCart_customerId_idx" ON "ShoppingCart"("customerId");

-- CreateIndex
CREATE INDEX "ShoppingCartItem_cartId_idx" ON "ShoppingCartItem"("cartId");

-- CreateIndex
CREATE INDEX "ShoppingCartItem_productId_idx" ON "ShoppingCartItem"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "ShoppingCartItem_cartId_productId_key" ON "ShoppingCartItem"("cartId", "productId");

-- AddForeignKey
ALTER TABLE "ShoppingCartItem" ADD CONSTRAINT "ShoppingCartItem_cartId_fkey" FOREIGN KEY ("cartId") REFERENCES "ShoppingCart"("id") ON DELETE CASCADE ON UPDATE CASCADE;
