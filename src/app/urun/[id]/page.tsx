"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

import AddToCart from "@/components/AddToCart";
import { useProducts } from "@/context/ProductContext";

export default function ProductDetailPage() {
  const params = useParams<{ id: string }>();
  const { products } = useProducts();

  const product = products.find(
    (item) => item.id === params.id
  );

  if (!product || !product.active) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-16">
        <div className="mx-auto max-w-xl rounded-2xl border bg-white p-10 text-center">
          <div className="text-5xl">📦</div>

          <h1 className="mt-5 text-2xl font-black">
            Ürün bulunamadı
          </h1>

          <p className="mt-2 text-slate-500">
            Ürün kaldırılmış, pasif durumda veya mevcut değil.
          </p>

          <Link
            href="/urunler"
            className="mt-6 inline-block rounded-xl bg-slate-950 px-6 py-3 font-black text-white"
          >
            Ürünlere Dön
          </Link>
        </div>
      </main>
    );
  }

  const stockStatus =
    product.stock <= 0
      ? "Tükendi"
      : product.stock <= product.criticalStock
        ? `Son ${product.stock} adet`
        : `${product.stock} adet stokta`;

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5">
          <Link
            href="/"
            className="text-xl font-black"
          >
            AKN MOTOSİKLET
          </Link>

          <div className="flex gap-2">
            <Link
              href="/urunler"
              className="rounded-xl border px-4 py-2 font-bold"
            >
              Ürünler
            </Link>

            <Link
              href="/sepet"
              className="rounded-xl bg-slate-950 px-4 py-2 font-bold text-white"
            >
              Sepetim
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-5 text-sm text-slate-500">
          <Link href="/urunler">
            Ürünler
          </Link>
          {" / "}
          {product.category}
          {" / "}
          {product.name}
        </div>

        <div className="grid gap-8 rounded-3xl border bg-white p-5 md:grid-cols-2 md:p-8">
          <section>
            <div className="flex aspect-square items-center justify-center overflow-hidden rounded-2xl bg-slate-100">
              {product.image ? (
                <img
                  src={product.image}
                  alt={product.name}
                  className="h-full w-full object-contain p-6"
                />
              ) : (
                <div className="text-center">
                  <div className="text-6xl">
                    📦
                  </div>

                  <div className="mt-3 font-bold text-slate-400">
                    Görsel Yok
                  </div>
                </div>
              )}
            </div>
          </section>

          <section className="flex flex-col">
            <div className="text-sm font-black text-red-600">
              {product.brand}
            </div>

            <h1 className="mt-2 text-3xl font-black md:text-4xl">
              {product.name}
            </h1>

            <div className="mt-3 text-sm text-slate-500">
              {product.category}
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3 text-sm">
              <Info
                label="Stok Kodu"
                value={product.sku}
              />

              <Info
                label="Barkod"
                value={product.barcode}
              />

              <Info
                label="KDV"
                value={`%${product.vatRate}`}
              />

              <Info
                label="Stok"
                value={stockStatus}
              />
            </div>

            <div className="mt-7 border-y py-6">
              <div className="text-sm font-bold text-slate-500">
                Perakende Fiyatı
              </div>

              <div className="mt-1 text-4xl font-black">
                ₺
                {product.retailPrice.toLocaleString(
                  "tr-TR",
                  {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  }
                )}
              </div>

              <div className="mt-2 text-xs text-slate-500">
                KDV %{product.vatRate}
              </div>
            </div>

            {product.description && (
              <div className="mt-6">
                <h2 className="font-black">
                  Ürün Açıklaması
                </h2>

                <p className="mt-2 leading-7 text-slate-600">
                  {product.description}
                </p>
              </div>
            )}

            <div className="mt-auto pt-8">
              {product.stock > 0 ? (
                <AddToCart
                  product={{
                    id: product.id,
                    name: product.name,
                    price: product.retailPrice,
                    image: product.image,
                    stock: product.stock,
                  }}
                />
              ) : (
                <button
                  disabled
                  className="w-full rounded-xl bg-slate-300 py-4 font-black text-slate-600"
                >
                  Stokta Yok
                </button>
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

function Info({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-slate-50 p-3">
      <div className="text-xs font-bold text-slate-400">
        {label}
      </div>

      <div className="mt-1 break-all font-black">
        {value || "-"}
      </div>
    </div>
  );
}