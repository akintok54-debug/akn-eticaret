$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "========================================"
Write-Host " AKN SEPET TAKIP SISTEMI KURULUMU"
Write-Host "========================================"
Write-Host ""

$root = (Resolve-Path "$PSScriptRoot\..").Path
Set-Location $root

$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backup = Join-Path $root "scripts\yedek-sepet-$stamp"

New-Item -ItemType Directory -Force $backup | Out-Null

Write-Host "[1/8] Yedek aliniyor..."

Copy-Item ".\prisma\schema.prisma" "$backup\schema.prisma" -Force
Copy-Item ".\src\context\CartContext.tsx" "$backup\CartContext.tsx" -Force

Write-Host "Yedek: $backup"

# ------------------------------------------------------------
# PRISMA
# ------------------------------------------------------------

Write-Host "[2/8] Prisma sepet modelleri kontrol ediliyor..."

$schemaPath = ".\prisma\schema.prisma"
$schema = Get-Content $schemaPath -Raw

if ($schema -notmatch "model ShoppingCart\s*\{") {

    $models = @'

model ShoppingCart {
  id             String   @id @default(cuid())
  sessionId      String   @unique
  customerId     String?
  customerName   String?
  customerPhone  String?
  customerEmail  String?

  status         String   @default("Aktif")
  checkoutStarted Boolean  @default(false)

  itemCount      Int      @default(0)
  total          Float    @default(0)

  lastActivityAt DateTime @default(now())
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  items ShoppingCartItem[]

  @@index([status])
  @@index([lastActivityAt])
  @@index([customerId])
}

model ShoppingCartItem {
  id       String @id @default(cuid())
  cartId   String
  cart     ShoppingCart @relation(fields: [cartId], references: [id], onDelete: Cascade)

  productId   String
  productName String
  image       String?
  price       Float
  quantity    Int

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([cartId, productId])
  @@index([cartId])
  @@index([productId])
}
'@

    Add-Content $schemaPath $models -Encoding utf8

    Write-Host "ShoppingCart modelleri schema.prisma dosyasina eklendi."
}
else {
    Write-Host "ShoppingCart modeli zaten mevcut. Atlandi."
}

# ------------------------------------------------------------
# API
# ------------------------------------------------------------

Write-Host "[3/8] Sepet API olusturuluyor..."

$apiDir = ".\src\app\api\cart-tracking"
New-Item -ItemType Directory -Force $apiDir | Out-Null

$api = @'
import { prisma } from "@/lib/prisma";
import { adminGuard } from "@/lib/admin";

type CartInput = {
  sessionId?: string;
  customerName?: string | null;
  customerPhone?: string | null;
  customerEmail?: string | null;
  checkoutStarted?: boolean;
  items?: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
    image?: string | null;
  }>;
};

export async function GET(request: Request) {
  const denied = adminGuard(request);
  if (denied) return denied;

  try {
    const carts = await prisma.shoppingCart.findMany({
      include: {
        items: true,
      },
      orderBy: {
        lastActivityAt: "desc",
      },
      take: 500,
    });

    return Response.json(
      { carts },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error("GET /api/cart-tracking", error);

    return Response.json(
      { message: "Sepetler alınamadı." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const data = (await request.json()) as CartInput;

    if (!data.sessionId) {
      return Response.json(
        { message: "sessionId zorunlu." },
        { status: 400 }
      );
    }

    const items = Array.isArray(data.items)
      ? data.items.filter(
          (item) =>
            item &&
            typeof item.id === "string" &&
            typeof item.name === "string" &&
            Number.isFinite(item.price) &&
            item.price >= 0 &&
            Number.isInteger(item.quantity) &&
            item.quantity > 0
        )
      : [];

    const itemCount = items.reduce(
      (sum, item) => sum + item.quantity,
      0
    );

    const total = items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    const status = itemCount > 0 ? "Aktif" : "Boş";

    const cart = await prisma.shoppingCart.upsert({
      where: {
        sessionId: data.sessionId,
      },

      create: {
        sessionId: data.sessionId,
        customerName: data.customerName || null,
        customerPhone: data.customerPhone || null,
        customerEmail: data.customerEmail || null,
        checkoutStarted: Boolean(data.checkoutStarted),
        status,
        itemCount,
        total,
        lastActivityAt: new Date(),

        items: {
          create: items.map((item) => ({
            productId: item.id,
            productName: item.name,
            image: item.image || null,
            price: item.price,
            quantity: item.quantity,
          })),
        },
      },

      update: {
        customerName: data.customerName || undefined,
        customerPhone: data.customerPhone || undefined,
        customerEmail: data.customerEmail || undefined,
        checkoutStarted:
          data.checkoutStarted === undefined
            ? undefined
            : Boolean(data.checkoutStarted),

        status,
        itemCount,
        total,
        lastActivityAt: new Date(),

        items: {
          deleteMany: {},
          create: items.map((item) => ({
            productId: item.id,
            productName: item.name,
            image: item.image || null,
            price: item.price,
            quantity: item.quantity,
          })),
        },
      },

      include: {
        items: true,
      },
    });

    return Response.json({ cart });
  } catch (error) {
    console.error("POST /api/cart-tracking", error);

    return Response.json(
      { message: "Sepet kaydedilemedi." },
      { status: 500 }
    );
  }
}
'@

Set-Content "$apiDir\route.ts" $api -Encoding utf8

# ------------------------------------------------------------
# ORTAK ADMIN COMPONENT
# ------------------------------------------------------------

Write-Host "[4/8] Admin sepet ekranlari hazirlaniyor..."

$componentDir = ".\src\components\admin"
New-Item -ItemType Directory -Force $componentDir | Out-Null

$component = @'
"use client";

import { useEffect, useMemo, useState } from "react";

type CartItem = {
  id: string;
  productId: string;
  productName: string;
  price: number;
  quantity: number;
};

type Cart = {
  id: string;
  sessionId: string;
  customerName: string | null;
  customerPhone: string | null;
  customerEmail: string | null;
  status: string;
  checkoutStarted: boolean;
  itemCount: number;
  total: number;
  lastActivityAt: string;
  createdAt: string;
  items: CartItem[];
};

type Mode =
  | "active"
  | "abandoned"
  | "checkout"
  | "reminder"
  | "risk";

const money = (value: number) =>
  new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
  }).format(value || 0);

export default function CartAdmin({
  mode,
  title,
}: {
  mode: Mode;
  title: string;
}) {
  const [carts, setCarts] = useState<Cart[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  async function load() {
    setLoading(true);

    try {
      const response = await fetch("/api/cart-tracking", {
        cache: "no-store",
      });

      const data = await response.json();

      setCarts(data.carts || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const rows = useMemo(() => {
    const now = Date.now();

    let result = carts.filter((cart) => cart.itemCount > 0);

    if (mode === "active") {
      result = result.filter(
        (cart) =>
          now - new Date(cart.lastActivityAt).getTime() <
          30 * 60 * 1000
      );
    }

    if (mode === "abandoned") {
      result = result.filter(
        (cart) =>
          !cart.checkoutStarted &&
          now - new Date(cart.lastActivityAt).getTime() >=
            30 * 60 * 1000
      );
    }

    if (mode === "checkout") {
      result = result.filter(
        (cart) =>
          cart.checkoutStarted &&
          now - new Date(cart.lastActivityAt).getTime() >=
            30 * 60 * 1000
      );
    }

    if (mode === "reminder") {
      result = result.filter(
        (cart) =>
          now - new Date(cart.lastActivityAt).getTime() >=
          60 * 60 * 1000
      );
    }

    if (mode === "risk") {
      result = result.filter(
        (cart) =>
          cart.total >= 5000 ||
          cart.itemCount >= 5 ||
          now - new Date(cart.lastActivityAt).getTime() >=
            24 * 60 * 60 * 1000
      );
    }

    const q = search.trim().toLocaleLowerCase("tr-TR");

    if (!q) return result;

    return result.filter((cart) =>
      [
        cart.customerName,
        cart.customerPhone,
        cart.customerEmail,
        cart.sessionId,
      ].some((value) =>
        (value || "").toLocaleLowerCase("tr-TR").includes(q)
      )
    );
  }, [carts, mode, search]);

  return (
    <main className="p-4 md:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{title}</h1>

        <p className="mt-1 text-sm text-slate-500">
          AKN E-Ticaret canlı sepet takip sistemi
        </p>
      </div>

      <section className="rounded-xl border bg-white">
        <div className="flex flex-col gap-3 border-b p-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="font-semibold">
              {rows.length} kayıt
            </div>
          </div>

          <div className="flex gap-2">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Müşteri, telefon veya e-posta ara"
              className="w-full rounded-lg border px-3 py-2 text-sm md:w-80"
            />

            <button
              onClick={() => void load()}
              className="rounded-lg border px-4 py-2 text-sm font-medium"
            >
              Yenile
            </button>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500">
            Yükleniyor...
          </div>
        ) : rows.length === 0 ? (
          <div className="p-12 text-center">
            <div className="font-semibold">
              Henüz kayıt yok
            </div>

            <div className="mt-2 text-sm text-slate-500">
              Müşteri sepet hareketleri burada görünecek.
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-slate-50 text-left">
                  <th className="p-3">Müşteri</th>
                  <th className="p-3">Sepet</th>
                  <th className="p-3">Tutar</th>
                  <th className="p-3">Checkout</th>
                  <th className="p-3">Son Hareket</th>
                </tr>
              </thead>

              <tbody>
                {rows.map((cart) => (
                  <tr key={cart.id} className="border-b">
                    <td className="p-3">
                      <div className="font-medium">
                        {cart.customerName || "Misafir müşteri"}
                      </div>

                      <div className="text-xs text-slate-500">
                        {cart.customerPhone ||
                          cart.customerEmail ||
                          cart.sessionId.slice(0, 12)}
                      </div>
                    </td>

                    <td className="p-3">
                      {cart.itemCount} ürün
                    </td>

                    <td className="p-3 font-semibold">
                      {money(cart.total)}
                    </td>

                    <td className="p-3">
                      {cart.checkoutStarted
                        ? "Başladı"
                        : "Başlamadı"}
                    </td>

                    <td className="p-3">
                      {new Date(
                        cart.lastActivityAt
                      ).toLocaleString("tr-TR")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
'@

Set-Content "$componentDir\CartAdmin.tsx" $component -Encoding utf8

# ------------------------------------------------------------
# 5 ADMIN SAYFASI
# ------------------------------------------------------------

$pages = @{
    "aktif-sepetler"         = @("Aktif Sepetler", "active")
    "terk-edilen-sepetler"   = @("Terk Edilen Sepetler", "abandoned")
    "terk-edilen-siparisler" = @("Terk Edilen Siparişler", "checkout")
    "sepet-hatirlatma"       = @("Sepet Hatırlatma", "reminder")
    "risk-kriterleri"        = @("Risk Kriterleri", "risk")
}

foreach ($slug in $pages.Keys) {

    $title = $pages[$slug][0]
    $mode = $pages[$slug][1]

    $dir = ".\src\app\admin\$slug"

    New-Item -ItemType Directory -Force $dir | Out-Null

    $page = @"
import CartAdmin from "@/components/admin/CartAdmin";

export default function Page() {
  return (
    <CartAdmin
      mode="$mode"
      title="$title"
    />
  );
}
"@

    Set-Content "$dir\page.tsx" $page -Encoding utf8
}

# ------------------------------------------------------------
# CART CONTEXT SENKRONIZASYONU
# ------------------------------------------------------------

Write-Host "[5/8] CartContext sunucu senkronizasyonu ekleniyor..."

$cartPath = ".\src\context\CartContext.tsx"
$cart = Get-Content $cartPath -Raw

if ($cart -notmatch "akn-cart-session") {

    $syncCode = @'

  useEffect(() => {
    if (!loaded) return;

    try {
      let sessionId = localStorage.getItem("akn-cart-session");

      if (!sessionId) {
        sessionId = crypto.randomUUID();
        localStorage.setItem("akn-cart-session", sessionId);
      }

      const timer = window.setTimeout(() => {
        void fetch("/api/cart-tracking", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            sessionId,
            items,
          }),
        }).catch(() => {
          // Sepet takibi başarısız olsa bile alışveriş devam eder.
        });
      }, 500);

      return () => window.clearTimeout(timer);
    } catch {
      return;
    }
  }, [items, loaded]);

'@

    $marker = "  function addItem("

    if (-not $cart.Contains($marker)) {
        throw "CartContext icinde addItem bulunamadi. Dosya degistirilmedi."
    }

    $cart = $cart.Replace($marker, $syncCode + $marker)

    Set-Content $cartPath $cart -Encoding utf8

    Write-Host "CartContext senkronizasyonu eklendi."
}
else {
    Write-Host "CartContext senkronizasyonu zaten mevcut."
}

# ------------------------------------------------------------
# VALIDATE
# ------------------------------------------------------------

Write-Host "[6/8] Prisma schema kontrol ediliyor..."

npx prisma validate

if ($LASTEXITCODE -ne 0) {
    throw "Prisma validate basarisiz."
}

# ------------------------------------------------------------
# MIGRATION
# ------------------------------------------------------------

Write-Host "[7/8] Railway migration uygulanıyor..."

npx prisma migrate dev --name add_cart_tracking

if ($LASTEXITCODE -ne 0) {
    throw "Migration basarisiz."
}

npx prisma generate

if ($LASTEXITCODE -ne 0) {
    throw "Prisma generate basarisiz."
}

# ------------------------------------------------------------
# TYPESCRIPT
# ------------------------------------------------------------

Write-Host "[8/8] TypeScript kontrol ediliyor..."

npx tsc --noEmit

if ($LASTEXITCODE -ne 0) {
    throw "TypeScript kontrolunde hata bulundu."
}

Write-Host ""
Write-Host "========================================"
Write-Host " AKN SEPET SISTEMI KURULDU"
Write-Host "========================================"
Write-Host ""
Write-Host "Hazir moduller:"
Write-Host " - Aktif Sepetler"
Write-Host " - Terk Edilen Sepetler"
Write-Host " - Terk Edilen Siparisler"
Write-Host " - Sepet Hatirlatma"
Write-Host " - Risk Kriterleri"
Write-Host ""
Write-Host "Yedek:"
Write-Host $backup
Write-Host ""