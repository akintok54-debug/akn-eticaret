"use client";

import Link from "next/link";
import { useProducts } from "@/context/ProductContext";

export default function BrandsPage() {
  const { products, loaded } = useProducts();

  const brands = Array.from(
    new Set(
      products
        .filter((product) => product.active)
        .map((product) => product.brand)
        .filter(Boolean)
    )
  ).sort((a, b) => a.localeCompare(b, "tr"));

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <div className="text-sm font-black text-red-600">
              AKN MOTOSİKLET
            </div>
            <h1 className="text-3xl font-black">
              Markalar
            </h1>
          </div>

          <Link
            href="/urunler"
            className="rounded-xl bg-slate-950 px-4 py-3 font-bold text-white"
          >
            Tüm Ürünler
          </Link>
        </div>

        {!loaded ? (
          <div className="rounded-2xl border bg-white p-8">
            Markalar yükleniyor...
          </div>
        ) : brands.length === 0 ? (
          <div className="rounded-2xl border bg-white p-8">
            Henüz marka bulunmuyor.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {brands.map((brand) => {
              const count = products.filter(
                (product) =>
                  product.active &&
                  product.brand === brand
              ).length;

              return (
                <Link
                  key={brand}
                  href={`/urunler?marka=${encodeURIComponent(
                    brand
                  )}`}
                  className="rounded-2xl border bg-white p-6 text-center transition hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className="text-xl font-black">
                    {brand}
                  </div>

                  <div className="mt-2 text-sm text-slate-500">
                    {count} ürün
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}