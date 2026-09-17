"use client";

import Link from "next/link";
import { useProducts } from "@/context/ProductContext";

function formatPrice(price: number) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
  }).format(price);
}

export default function AdminProductsPage() {
  const {
    products,
    deleteProduct,
    toggleProduct,
  } = useProducts();

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      <header className="border-b bg-slate-950 text-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-5 sm:flex-row sm:items-center sm:justify-between">
          <Link href="/admin" className="font-black">
            AKN YÖNETİM
          </Link>

          <div className="flex gap-2">
            <Link
              href="/admin/urunler/toplu"
              className="rounded-xl bg-amber-500 px-4 py-3 text-sm font-black text-slate-950"
            >
              Toplu İşlemler
            </Link>

            <Link
              href="/admin/urunler/yeni"
              className="rounded-xl bg-red-600 px-4 py-3 text-sm font-black"
            >
              + Yeni Ürün
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8">
        <Link
          href="/admin"
          className="text-sm font-bold text-slate-500"
        >
          ← Yönetim Paneli
        </Link>

        <h1 className="mt-3 text-3xl font-black">
          Ürün Yönetimi
        </h1>

        <p className="mt-2 text-slate-500">
          Toplam {products.length} ürün
        </p>

        <div className="mt-7 overflow-hidden rounded-2xl border bg-white">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] text-left text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="p-4">Ürün</th>
                  <th className="p-4">Kategori</th>
                  <th className="p-4">Stok</th>
                  <th className="p-4">Perakende</th>
                  <th className="p-4">Bayi</th>
                  <th className="p-4">KDV</th>
                  <th className="p-4">Durum</th>
                  <th className="p-4">İşlem</th>
                </tr>
              </thead>

              <tbody>
                {products.map((product) => (
                  <tr key={product.id} className="border-t">
                    <td className="p-4">
                      <div className="font-black">
                        {product.name}
                      </div>

                      <div className="text-xs text-slate-500">
                        {product.brand} • {product.sku}
                      </div>

                      <div className="text-xs text-slate-400">
                        {product.barcode}
                      </div>
                    </td>

                    <td className="p-4">
                      {product.category}
                    </td>

                    <td className="p-4">
                      <span
                        className={
                          product.stock <= product.criticalStock
                            ? "font-black text-orange-600"
                            : "font-black text-green-700"
                        }
                      >
                        {product.stock}
                      </span>
                    </td>

                    <td className="p-4 font-bold">
                      {formatPrice(product.retailPrice)}
                    </td>

                    <td className="p-4 font-bold">
                      {formatPrice(product.dealerPrice)}
                    </td>

                    <td className="p-4">
                      %{product.vatRate}
                    </td>

                    <td className="p-4">
                      <button
                        type="button"
                        onClick={() =>
                          toggleProduct(product.id)
                        }
                        className={`rounded-full px-3 py-1 text-xs font-black ${
                          product.active
                            ? "bg-green-100 text-green-700"
                            : "bg-slate-200 text-slate-600"
                        }`}
                      >
                        {product.active
                          ? "Aktif"
                          : "Pasif"}
                      </button>
                    </td>

                    <td className="p-4">
                      <div className="flex gap-2">
                        <Link
                          href={`/admin/urunler/${product.id}/duzenle`}
                          className="rounded-lg bg-slate-900 px-3 py-2 font-bold text-white"
                        >
                          Düzenle
                        </Link>

                        <Link
                          href={`/urun/${product.id}`}
                          className="rounded-lg border px-3 py-2 font-bold"
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
                              deleteProduct(product.id);
                            }
                          }}
                          className="rounded-lg border border-red-200 px-3 py-2 font-bold text-red-600"
                        >
                          Sil
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}
