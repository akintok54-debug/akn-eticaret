"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useProducts } from "@/context/ProductContext";

function formatPrice(price: number) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
  }).format(price);
}

type FilterType = "all" | "active" | "passive" | "critical";

export default function AdminProductsPage() {
  const {
    products,
    deleteProduct,
    toggleProduct,
  } = useProducts();

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");

  const activeCount = products.filter(
    (product) => product.active
  ).length;

  const passiveCount = products.filter(
    (product) => !product.active
  ).length;

  const criticalCount = products.filter(
    (product) =>
      product.stock <= product.criticalStock
  ).length;

  const filteredProducts = useMemo(() => {
    const query = search
      .trim()
      .toLocaleLowerCase("tr-TR");

    return products.filter((product) => {
      const matchesSearch =
        !query ||
        product.name
          .toLocaleLowerCase("tr-TR")
          .includes(query) ||
        product.sku
          .toLocaleLowerCase("tr-TR")
          .includes(query) ||
        product.brand
          .toLocaleLowerCase("tr-TR")
          .includes(query) ||
        product.category
          .toLocaleLowerCase("tr-TR")
          .includes(query) ||
        (product.barcode ?? "")
          .toLocaleLowerCase("tr-TR")
          .includes(query);

      if (!matchesSearch) {
        return false;
      }

      if (filter === "active") {
        return product.active;
      }

      if (filter === "passive") {
        return !product.active;
      }

      if (filter === "critical") {
        return (
          product.stock <= product.criticalStock
        );
      }

      return true;
    });
  }, [products, search, filter]);

  return (
    <main className="px-5 py-8 lg:px-8 lg:py-10">
      <div className="mx-auto max-w-[1600px]">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              Katalog Yönetimi
            </p>

            <h1 className="mt-2 text-3xl font-bold text-slate-950">
              Ürünler
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Ürün, fiyat, stok ve satış durumlarını yönetin.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin/urunler/aktarim"
              className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              Ürün Aktarımı
            </Link>

            <Link
              href="/admin/urunler/toplu"
              className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800 transition hover:bg-amber-100"
            >
              Toplu İşlemler
            </Link>

            <Link
              href="/admin/urunler/yeni"
              className="rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700"
            >
              + Yeni Ürün
            </Link>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-4 xl:grid-cols-4">
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={`rounded-2xl border p-5 text-left shadow-sm transition ${filter === "all"
              ? "border-slate-950 bg-slate-950 text-white"
              : "border-slate-200 bg-white text-slate-950 hover:border-slate-300"
              }`}
          >
            <p
              className={`text-xs font-medium ${filter === "all"
                ? "text-slate-300"
                : "text-slate-500"
                }`}
            >
              Toplam Ürün
            </p>

            <strong className="mt-3 block text-2xl font-bold">
              {products.length}
            </strong>
          </button>

          <button
            type="button"
            onClick={() => setFilter("active")}
            className={`rounded-2xl border p-5 text-left shadow-sm transition ${filter === "active"
              ? "border-green-600 bg-green-600 text-white"
              : "border-slate-200 bg-white text-slate-950 hover:border-green-300"
              }`}
          >
            <p
              className={`text-xs font-medium ${filter === "active"
                ? "text-green-100"
                : "text-slate-500"
                }`}
            >
              Aktif
            </p>

            <strong className="mt-3 block text-2xl font-bold">
              {activeCount}
            </strong>
          </button>

          <button
            type="button"
            onClick={() => setFilter("passive")}
            className={`rounded-2xl border p-5 text-left shadow-sm transition ${filter === "passive"
              ? "border-slate-600 bg-slate-600 text-white"
              : "border-slate-200 bg-white text-slate-950 hover:border-slate-400"
              }`}
          >
            <p
              className={`text-xs font-medium ${filter === "passive"
                ? "text-slate-200"
                : "text-slate-500"
                }`}
            >
              Pasif
            </p>

            <strong className="mt-3 block text-2xl font-bold">
              {passiveCount}
            </strong>
          </button>

          <button
            type="button"
            onClick={() => setFilter("critical")}
            className={`rounded-2xl border p-5 text-left shadow-sm transition ${filter === "critical"
              ? "border-orange-500 bg-orange-500 text-white"
              : "border-slate-200 bg-white text-slate-950 hover:border-orange-300"
              }`}
          >
            <p
              className={`text-xs font-medium ${filter === "critical"
                ? "text-orange-100"
                : "text-slate-500"
                }`}
            >
              Kritik Stok
            </p>

            <strong className="mt-3 block text-2xl font-bold">
              {criticalCount}
            </strong>
          </button>
        </div>

        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="w-full lg:max-w-xl">
              <input
                type="search"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Ürün adı, stok kodu, barkod, marka veya kategori ara..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:bg-white"
              />
            </div>

            <div className="text-sm text-slate-500">
              <strong className="font-semibold text-slate-950">
                {filteredProducts.length}
              </strong>{" "}
              ürün gösteriliyor
            </div>
          </div>
        </div>

        <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {filteredProducts.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <h2 className="text-lg font-semibold text-slate-950">
                Ürün bulunamadı
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Arama kelimesini veya filtreyi değiştirin.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1150px] text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-4">
                      Ürün
                    </th>

                    <th className="px-5 py-4">
                      Kategori
                    </th>

                    <th className="px-5 py-4">
                      Stok
                    </th>

                    <th className="px-5 py-4">
                      Perakende
                    </th>

                    <th className="px-5 py-4">
                      Bayi
                    </th>

                    <th className="px-5 py-4">
                      KDV
                    </th>

                    <th className="px-5 py-4">
                      Durum
                    </th>

                    <th className="px-5 py-4 text-right">
                      İşlemler
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredProducts.map((product) => {
                    const critical =
                      product.stock <=
                      product.criticalStock;

                    return (
                      <tr
                        key={product.id}
                        className="transition hover:bg-slate-50/80"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                              {product.image ? (
                                <img
                                  src={product.image}
                                  alt={product.name}
                                  className="h-full w-full object-contain"
                                />
                              ) : (
                                <span className="text-xs font-bold text-slate-400">
                                  AKN
                                </span>
                              )}
                            </div>

                            <div className="min-w-0">
                              <div className="max-w-[330px] truncate font-semibold text-slate-950">
                                {product.name}
                              </div>

                              <div className="mt-1 text-xs text-slate-500">
                                {product.brand || "Markasız"}
                                {" • "}
                                {product.sku || "Kod yok"}
                              </div>

                              {product.barcode && (
                                <div className="mt-0.5 text-xs text-slate-400">
                                  Barkod: {product.barcode}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4 text-slate-600">
                          {product.category ||
                            "Kategori yok"}
                        </td>

                        <td className="px-5 py-4">
                          <div
                            className={`font-bold ${critical
                              ? "text-orange-600"
                              : "text-green-700"
                              }`}
                          >
                            {product.stock}
                          </div>

                          {critical && (
                            <div className="mt-1 text-xs font-medium text-orange-500">
                              Kritik stok
                            </div>
                          )}
                        </td>

                        <td className="px-5 py-4 font-semibold text-slate-950">
                          {formatPrice(
                            product.retailPrice
                          )}
                        </td>

                        <td className="px-5 py-4 font-semibold text-slate-950">
                          {formatPrice(
                            product.dealerPrice
                          )}
                        </td>

                        <td className="px-5 py-4 text-slate-600">
                          %{product.vatRate}
                        </td>

                        <td className="px-5 py-4">
                          <button
                            type="button"
                            onClick={() =>
                              toggleProduct(
                                product.id
                              )
                            }
                            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${product.active
                              ? "bg-green-100 text-green-700 hover:bg-green-200"
                              : "bg-slate-200 text-slate-600 hover:bg-slate-300"
                              }`}
                          >
                            {product.active
                              ? "Aktif"
                              : "Pasif"}
                          </button>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex justify-end gap-2">
                            <Link
                              href={`/admin/urunler/${product.id}/duzenle`}
                              className="rounded-lg bg-slate-950 px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-800"
                            >
                              Düzenle
                            </Link>

                            <Link
                              href={`/urun/${product.id}`}
                              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                            >
                              Gör
                            </Link>

                            <button
                              type="button"
                              onClick={() => {
                                if (
                                  window.confirm(
                                    `${product.name} silinsin mi?`
                                  )
                                ) {
                                  deleteProduct(
                                    product.id
                                  );
                                }
                              }}
                              className="rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                            >
                              Sil
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}