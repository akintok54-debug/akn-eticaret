"use client";

import Link from "next/link";
import { useState } from "react";
import { useCatalog } from "@/context/CatalogContext";
import { useProducts } from "@/context/ProductContext";

export default function CategoriesAdminPage() {
  const {
    categories,
    error,
    addCategory,
    renameCategory,
    deleteCategory,
  } = useCatalog();

  const { products } = useProducts();
  const [name, setName] = useState("");

  async function add() {
    if (!await addCategory(name)) {
      alert("Kategori adı boş veya bu kategori zaten mevcut.");
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
        <h1 className="text-3xl font-black">Kategori Yönetimi</h1>

        {error&&<p role="alert" className="notice error-notice mt-4">{error}</p>}
        <div className="mt-6 flex gap-2 rounded-2xl border bg-white p-4">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") add();
            }}
            placeholder="Yeni kategori adı"
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
          {categories.map((category) => {
            const count = products.filter(
              (product) => product.category === category
            ).length;

            return (
              <div
                key={category}
                className="flex flex-col gap-3 border-b p-4 last:border-0 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <div className="font-black">{category}</div>
                  <div className="text-sm text-slate-500">
                    {count} ürün
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={async () => {
                      const value = window.prompt(
                        "Yeni kategori adı:",
                        category
                      );

                      if (!value) return;

                      if (!await renameCategory(category, value)) {
                        alert("Kategori adı geçersiz veya zaten mevcut.");
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
                          `${category} kategorisi pasife alınsın mı?`
                        )
                      ) {
                        return;
                      }

                      if (!await deleteCategory(category)) {
                        alert(
                          "Bu kategori ürünlerde kullanılıyor. Önce ürünlerin kategorisini değiştirin."
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