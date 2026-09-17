"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import AddToCart from "@/components/AddToCart";
import { useProducts } from "@/context/ProductContext";
import { useCustomers } from "@/context/CustomerContext";

export default function ProductsPage() {
  const { products } = useProducts();
  const { isApprovedDealer } = useCustomers();

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [brand, setBrand] = useState("");

  const activeProducts = products.filter(
    (product) => product.active
  );

  const categories = Array.from(
    new Set(
      activeProducts.map(
        (product) => product.category
      )
    )
  ).sort();

  const brands = Array.from(
    new Set(
      activeProducts.map(
        (product) => product.brand
      )
    )
  ).sort();

  const filtered = useMemo(() => {
    const query = search
      .trim()
      .toLocaleLowerCase("tr-TR");

    return activeProducts.filter((product) => {
      const matchesSearch =
        !query ||
        product.name
          .toLocaleLowerCase("tr-TR")
          .includes(query) ||
        product.sku
          .toLocaleLowerCase("tr-TR")
          .includes(query) ||
        product.barcode
          .toLocaleLowerCase("tr-TR")
          .includes(query) ||
        product.brand
          .toLocaleLowerCase("tr-TR")
          .includes(query);

      const matchesCategory =
        !category ||
        product.category === category;

      const matchesBrand =
        !brand ||
        product.brand === brand;

      return (
        matchesSearch &&
        matchesCategory &&
        matchesBrand
      );
    });
  }, [
    activeProducts,
    search,
    category,
    brand,
  ]);

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

          <Link
            href="/sepet"
            className="rounded-xl bg-slate-950 px-4 py-2 font-bold text-white"
          >
            Sepetim
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8">
        <h1 className="text-3xl font-black">
          Tüm Ürünler
        </h1>

        <div className="mt-6 grid gap-3 rounded-2xl border bg-white p-4 md:grid-cols-3">
          <input
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Ürün, barkod, stok kodu veya marka ara"
            className="rounded-xl border px-4 py-3"
          />

          <select
            value={category}
            onChange={(event) =>
              setCategory(event.target.value)
            }
            className="rounded-xl border bg-white px-4 py-3"
          >
            <option value="">
              Tüm Kategoriler
            </option>

            {categories.map((item) => (
              <option
                key={item}
                value={item}
              >
                {item}
              </option>
            ))}
          </select>

          <select
            value={brand}
            onChange={(event) =>
              setBrand(event.target.value)
            }
            className="rounded-xl border bg-white px-4 py-3"
          >
            <option value="">
              Tüm Markalar
            </option>

            {brands.map((item) => (
              <option
                key={item}
                value={item}
              >
                {item}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-4 text-sm font-bold text-slate-500">
          {filtered.length} ürün bulundu
        </div>

        <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((product) => (
            <article
              key={product.id}
              className="overflow-hidden rounded-2xl border bg-white"
            >
              <Link
                href={`/urun/${product.id}`}
                className="block"
              >
                <div className="flex aspect-square items-center justify-center bg-slate-100">
                  {product.image ? (
                    <img
                      src={product.image}
                      alt={product.name}
                      className="h-full w-full object-contain p-4"
                    />
                  ) : (
                    <div className="text-sm font-bold text-slate-400">
                      Görsel Yok
                    </div>
                  )}
                </div>

                <div className="p-4 pb-2">
                  <div className="text-xs font-bold text-red-600">
                    {product.brand}
                  </div>

                  <h2 className="mt-1 min-h-12 font-black">
                    {product.name}
                  </h2>

                  <div className="mt-1 text-xs text-slate-500">
                    {product.category}
                  </div>

                  <div className="mt-4 text-2xl font-black">
                    ₺
                    {(isApprovedDealer ? product.dealerPrice : product.retailPrice).toLocaleString(
                      "tr-TR",
                      {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      }
                    )}
                  </div>

                  <div className="mt-1 text-xs text-slate-500">
                    Stok: {product.stock}
                  </div>
                </div>
              </Link>

              <div className="p-4 pt-2">
                <AddToCart
                  product={{
                    id: product.id,
                    name: product.name,
                    price: isApprovedDealer ? product.dealerPrice : product.retailPrice,
                    image: product.image,
                    stock: product.stock,
                  }}
                />
              </div>
            </article>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="mt-8 rounded-2xl border bg-white p-10 text-center font-bold text-slate-500">
            Aramanıza uygun ürün bulunamadı.
          </div>
        )}
      </div>
    </main>
  );
}