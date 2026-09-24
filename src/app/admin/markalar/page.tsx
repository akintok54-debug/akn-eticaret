"use client";

import Link from "next/link";
import { useState } from "react";
import { useCatalog } from "@/context/CatalogContext";
import { useProducts } from "@/context/ProductContext";

export default function BrandsAdminPage() {
  const {
    brands,
    error,
    addBrand,
    renameBrand,
    deleteBrand,
  } = useCatalog();

  const { products } = useProducts();
  const [name, setName] = useState("");

  async function add() {
    if (!await addBrand(name)) {
      alert("Marka adı boş veya bu marka zaten mevcut.");
      return;
    }

    setName("");
  }

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      <header className="bg-slate-950 text-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-5">
          <div className="font-black">AKN YÖNETİM</div>
          <Link href="/admin" className="rounded-xl border border-slate-700 px-4 py-2 font-bold">
            Yönetim Paneli
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-8">
        <h1 className="text-3xl font-black">Marka Yönetimi</h1>

        {error&&<p role="alert" className="notice error-notice mt-4">{error}</p>}
        <div className="mt-6 flex gap-2 rounded-2xl border bg-white p-4">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") add();
            }}
            placeholder="Yeni marka adı"
            className="min-w-0 flex-1 rounded-xl border px-4 py-3"
          />

          <button
            type="button"
            onClick={add}
            className="rounded-xl bg-red-600 px-5 font-black text-white"
          >
            Ekle
          </button>
        </div>

        <div className="mt-6 overflow-hidden rounded-2xl border bg-white">
          {brands.map((brand) => {
            const count = products.filter(
              (product) => product.brand === brand
            ).length;

            return (
              <div
                key={brand}
                className="flex flex-col gap-3 border-b p-4 last:border-0 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <div className="font-black">{brand}</div>
                  <div className="text-sm text-slate-500">
                    {count} ürün
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={async () => {
                      const value = window.prompt(
                        "Yeni marka adı:",
                        brand
                      );

                      if (!value) return;

                      if (!await renameBrand(brand, value)) {
                        alert("Marka adı geçersiz veya zaten mevcut.");
                      }
                    }}
                    className="rounded-lg bg-slate-900 px-4 py-2 font-bold text-white"
                  >
                    Düzenle
                  </button>

                  <button
                    type="button"
                    onClick={async () => {
                      if (
                        !window.confirm(
                          `${brand} markası pasife alınsın mı?`
                        )
                      ) {
                        return;
                      }

                      if (!await deleteBrand(brand)) {
                        alert(
                          "Bu marka ürünlerde kullanılıyor. Önce ürünlerin markasını değiştirin."
                        );
                      }
                    }}
                    className="rounded-lg border border-red-200 px-4 py-2 font-bold text-red-600"
                  >
                    Pasife al
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}