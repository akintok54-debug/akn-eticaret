"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { useProducts } from "@/context/ProductContext";
import type { Product } from "@/types/product";

type PriceTarget =
  | "retail"
  | "dealer"
  | "both";

type PriceOperation =
  | "increase"
  | "decrease"
  | "multiplier";

type StockOperation =
  | "add"
  | "subtract"
  | "set";

function money(value: number) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
  }).format(value);
}

function roundPrice(value: number) {
  return Math.round(value * 100) / 100;
}

export default function BulkProductsPage() {
  const {
    products,
    updateManyProducts,
  } = useProducts();

  const [category, setCategory] = useState("all");
  const [brand, setBrand] = useState("all");

  const [priceTarget, setPriceTarget] =
    useState<PriceTarget>("both");

  const [priceOperation, setPriceOperation] =
    useState<PriceOperation>("increase");

  const [priceValue, setPriceValue] =
    useState("10");

  const [stockOperation, setStockOperation] =
    useState<StockOperation>("add");

  const [stockValue, setStockValue] =
    useState("0");

  const [vatValue, setVatValue] =
    useState("20");

  const categories = useMemo(
    () =>
      Array.from(
        new Set(products.map((p) => p.category))
      ).sort(),
    [products]
  );

  const brands = useMemo(
    () =>
      Array.from(
        new Set(products.map((p) => p.brand))
      ).sort(),
    [products]
  );

  const selectedProducts = useMemo(
    () =>
      products.filter((product) => {
        const categoryMatch =
          category === "all" ||
          product.category === category;

        const brandMatch =
          brand === "all" ||
          product.brand === brand;

        return categoryMatch && brandMatch;
      }),
    [products, category, brand]
  );

  const ids = selectedProducts.map(
    (product) => product.id
  );

  function calculatePrice(oldPrice: number) {
    const value = Number(priceValue);

    if (!Number.isFinite(value)) {
      return oldPrice;
    }

    if (priceOperation === "increase") {
      return roundPrice(
        oldPrice * (1 + value / 100)
      );
    }

    if (priceOperation === "decrease") {
      return roundPrice(
        Math.max(0, oldPrice * (1 - value / 100))
      );
    }

    return roundPrice(
      Math.max(0, oldPrice * value)
    );
  }

  function applyPrice() {
    if (ids.length === 0) return;

    const value = Number(priceValue);

    if (
      !Number.isFinite(value) ||
      value < 0
    ) {
      alert("Geçerli bir değer girin.");
      return;
    }

    const text =
      priceOperation === "multiplier"
        ? `${value} katsayısı`
        : `%${value}`;

    if (
      !window.confirm(
        `${ids.length} ürüne ${text} fiyat işlemi uygulansın mı?`
      )
    ) {
      return;
    }

    updateManyProducts(ids, (product) => {
      const changes: Product = { ...product };

      if (
        priceTarget === "retail" ||
        priceTarget === "both"
      ) {
        changes.retailPrice =
          calculatePrice(product.retailPrice);
      }

      if (
        priceTarget === "dealer" ||
        priceTarget === "both"
      ) {
        changes.dealerPrice =
          calculatePrice(product.dealerPrice);
      }

      return changes;
    });

    alert("Toplu fiyat güncellemesi tamamlandı.");
  }

  function applyStock() {
    const value = Number(stockValue);

    if (
      !Number.isFinite(value) ||
      value < 0 ||
      ids.length === 0
    ) {
      alert("Geçerli stok değeri girin.");
      return;
    }

    if (
      !window.confirm(
        `${ids.length} ürünün stokları güncellensin mi?`
      )
    ) {
      return;
    }

    updateManyProducts(ids, (product) => {
      let stock = product.stock;

      if (stockOperation === "add") {
        stock += value;
      }

      if (stockOperation === "subtract") {
        stock = Math.max(0, stock - value);
      }

      if (stockOperation === "set") {
        stock = value;
      }

      return {
        ...product,
        stock,
      };
    });

    alert("Toplu stok işlemi tamamlandı.");
  }

  function applyVat() {
    const vat = Number(vatValue);

    if (
      !Number.isFinite(vat) ||
      vat < 0 ||
      ids.length === 0
    ) {
      alert("Geçerli KDV oranı girin.");
      return;
    }

    if (
      !window.confirm(
        `${ids.length} ürünün KDV oranı %${vat} yapılsın mı?`
      )
    ) {
      return;
    }

    updateManyProducts(ids, (product) => ({
      ...product,
      vatRate: vat,
    }));

    alert("KDV güncellendi.");
  }

  function setStatus(active: boolean) {
    if (ids.length === 0) return;

    if (
      !window.confirm(
        `${ids.length} ürün ${
          active ? "aktif" : "pasif"
        } yapılsın mı?`
      )
    ) {
      return;
    }

    updateManyProducts(ids, (product) => ({
      ...product,
      active,
    }));
  }

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      <header className="border-b bg-slate-950 text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5">
          <div className="font-black">
            AKN YÖNETİM
          </div>

          <Link
            href="/admin/urunler"
            className="rounded-xl border border-slate-700 px-4 py-2 font-bold"
          >
            Ürünlere Dön
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="text-sm font-black text-amber-600">
          TOPLU İŞLEMLER
        </div>

        <h1 className="text-3xl font-black">
          Toplu Ürün Güncelleme
        </h1>

        <p className="mt-2 text-slate-500">
          Önce işlem uygulanacak ürün grubunu seçin.
        </p>

        <section className="mt-7 rounded-2xl border bg-white p-6">
          <h2 className="text-xl font-black">
            1. Ürün Grubu
          </h2>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <label>
              <span className="mb-2 block text-sm font-bold">
                Kategori
              </span>

              <select
                value={category}
                onChange={(e) =>
                  setCategory(e.target.value)
                }
                className="w-full rounded-xl border px-4 py-3"
              >
                <option value="all">
                  Tüm Kategoriler
                </option>

                {categories.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span className="mb-2 block text-sm font-bold">
                Marka
              </span>

              <select
                value={brand}
                onChange={(e) =>
                  setBrand(e.target.value)
                }
                className="w-full rounded-xl border px-4 py-3"
              >
                <option value="all">
                  Tüm Markalar
                </option>

                {brands.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="mt-5 rounded-xl bg-amber-50 p-4">
            <div className="text-sm text-amber-800">
              Bu işlemlerden etkilenecek ürün
            </div>

            <div className="text-3xl font-black text-amber-950">
              {selectedProducts.length}
            </div>
          </div>
        </section>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border bg-white p-6">
            <h2 className="text-xl font-black">
              2. Toplu Fiyat
            </h2>

            <div className="mt-5 space-y-4">
              <label className="block">
                <span className="mb-2 block text-sm font-bold">
                  Değişecek fiyat
                </span>

                <select
                  value={priceTarget}
                  onChange={(e) =>
                    setPriceTarget(
                      e.target.value as PriceTarget
                    )
                  }
                  className="w-full rounded-xl border px-4 py-3"
                >
                  <option value="both">
                    Perakende + Bayi
                  </option>
                  <option value="retail">
                    Sadece Perakende
                  </option>
                  <option value="dealer">
                    Sadece Bayi
                  </option>
                </select>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-bold">
                  İşlem
                </span>

                <select
                  value={priceOperation}
                  onChange={(e) =>
                    setPriceOperation(
                      e.target.value as PriceOperation
                    )
                  }
                  className="w-full rounded-xl border px-4 py-3"
                >
                  <option value="increase">
                    Yüzde Artır
                  </option>

                  <option value="decrease">
                    Yüzde Azalt
                  </option>

                  <option value="multiplier">
                    Katsayı Uygula
                  </option>
                </select>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-bold">
                  {priceOperation === "multiplier"
                    ? "Katsayı"
                    : "Yüzde"}
                </span>

                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={priceValue}
                  onChange={(e) =>
                    setPriceValue(e.target.value)
                  }
                  className="w-full rounded-xl border px-4 py-3"
                />
              </label>

              {selectedProducts[0] && (
                <div className="rounded-xl bg-slate-50 p-4 text-sm">
                  <div className="font-black">
                    Önizleme
                  </div>

                  <div className="mt-2">
                    {selectedProducts[0].name}
                  </div>

                  {(priceTarget === "retail" ||
                    priceTarget === "both") && (
                    <div className="mt-1">
                      Perakende:{" "}
                      {money(
                        selectedProducts[0].retailPrice
                      )}{" "}
                      →{" "}
                      <strong>
                        {money(
                          calculatePrice(
                            selectedProducts[0]
                              .retailPrice
                          )
                        )}
                      </strong>
                    </div>
                  )}

                  {(priceTarget === "dealer" ||
                    priceTarget === "both") && (
                    <div className="mt-1">
                      Bayi:{" "}
                      {money(
                        selectedProducts[0].dealerPrice
                      )}{" "}
                      →{" "}
                      <strong>
                        {money(
                          calculatePrice(
                            selectedProducts[0]
                              .dealerPrice
                          )
                        )}
                      </strong>
                    </div>
                  )}
                </div>
              )}

              <button
                type="button"
                onClick={applyPrice}
                className="w-full rounded-xl bg-red-600 py-3 font-black text-white"
              >
                Fiyatları Güncelle
              </button>
            </div>
          </section>

          <section className="rounded-2xl border bg-white p-6">
            <h2 className="text-xl font-black">
              3. Toplu Stok
            </h2>

            <div className="mt-5 space-y-4">
              <select
                value={stockOperation}
                onChange={(e) =>
                  setStockOperation(
                    e.target.value as StockOperation
                  )
                }
                className="w-full rounded-xl border px-4 py-3"
              >
                <option value="add">
                  Mevcut Stoğa Ekle
                </option>

                <option value="subtract">
                  Mevcut Stoktan Çıkar
                </option>

                <option value="set">
                  Stoku Bu Değere Eşitle
                </option>
              </select>

              <input
                type="number"
                min="0"
                step="1"
                value={stockValue}
                onChange={(e) =>
                  setStockValue(e.target.value)
                }
                className="w-full rounded-xl border px-4 py-3"
              />

              <button
                type="button"
                onClick={applyStock}
                className="w-full rounded-xl bg-slate-900 py-3 font-black text-white"
              >
                Stokları Güncelle
              </button>
            </div>
          </section>

          <section className="rounded-2xl border bg-white p-6">
            <h2 className="text-xl font-black">
              4. Toplu KDV
            </h2>

            <div className="mt-5 space-y-4">
              <input
                type="number"
                min="0"
                step="0.01"
                value={vatValue}
                onChange={(e) =>
                  setVatValue(e.target.value)
                }
                className="w-full rounded-xl border px-4 py-3"
              />

              <button
                type="button"
                onClick={applyVat}
                className="w-full rounded-xl bg-slate-900 py-3 font-black text-white"
              >
                KDV Oranını Güncelle
              </button>
            </div>
          </section>

          <section className="rounded-2xl border bg-white p-6">
            <h2 className="text-xl font-black">
              5. Ürün Durumu
            </h2>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setStatus(true)}
                className="rounded-xl bg-green-600 py-3 font-black text-white"
              >
                Tümünü Aktif Yap
              </button>

              <button
                type="button"
                onClick={() => setStatus(false)}
                className="rounded-xl bg-slate-700 py-3 font-black text-white"
              >
                Tümünü Pasif Yap
              </button>
            </div>
          </section>
        </div>

        <section className="mt-6 rounded-2xl border bg-white p-6">
          <h2 className="text-xl font-black">
            Seçilen Ürünlerden Örnekler
          </h2>

          <div className="mt-4 divide-y">
            {selectedProducts
              .slice(0, 10)
              .map((product) => (
                <div
                  key={product.id}
                  className="flex flex-col justify-between gap-2 py-3 sm:flex-row"
                >
                  <div>
                    <strong>{product.name}</strong>
                    <div className="text-xs text-slate-500">
                      {product.brand} • {product.category}
                    </div>
                  </div>

                  <div className="text-sm">
                    Perakende{" "}
                    <strong>
                      {money(product.retailPrice)}
                    </strong>
                    {" • "}
                    Bayi{" "}
                    <strong>
                      {money(product.dealerPrice)}
                    </strong>
                  </div>
                </div>
              ))}
          </div>

          {selectedProducts.length > 10 && (
            <div className="mt-3 text-sm text-slate-500">
              + {selectedProducts.length - 10} ürün daha
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
