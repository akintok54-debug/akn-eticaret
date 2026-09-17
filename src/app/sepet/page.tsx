"use client";

import Link from "next/link";
import { useEffect } from "react";

import { useCart } from "@/context/CartContext";
import { useProducts } from "@/context/ProductContext";

export default function CartPage() {
  const {
    items,
    itemCount,
    total,
    removeItem,
    updateQuantity,
    clearCart,
  } = useCart();

  const { products } = useProducts();

  useEffect(() => {
    items.forEach((item) => {
      const product = products.find(
        (product) => product.id === item.id
      );

      if (!product || !product.active || product.stock <= 0) {
        removeItem(item.id);
        return;
      }

      if (item.quantity > product.stock) {
        updateQuantity(
          item.id,
          product.stock
        );
      }
    });
  }, [
    products,
    items,
    removeItem,
    updateQuantity,
  ]);

  function stockFor(id: string) {
    return (
      products.find(
        (product) => product.id === id
      )?.stock ?? 0
    );
  }

  function increase(
    id: string,
    quantity: number
  ) {
    const stock = stockFor(id);

    if (quantity >= stock) {
      return;
    }

    updateQuantity(id, quantity + 1);
  }

  function decrease(
    id: string,
    quantity: number
  ) {
    if (quantity <= 1) {
      removeItem(id);
      return;
    }

    updateQuantity(id, quantity - 1);
  }

  if (items.length === 0) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-16">
        <div className="mx-auto max-w-xl rounded-2xl border bg-white p-10 text-center">
          <div className="text-5xl">
            🛒
          </div>

          <h1 className="mt-5 text-3xl font-black">
            Sepetiniz boş
          </h1>

          <p className="mt-2 text-slate-500">
            Ürünleri inceleyip sepetinize ekleyebilirsiniz.
          </p>

          <Link
            href="/urunler"
            className="mt-6 inline-block rounded-xl bg-red-600 px-6 py-3 font-black text-white"
          >
            Ürünlere Git
          </Link>
        </div>
      </main>
    );
  }

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
            href="/urunler"
            className="rounded-xl border px-4 py-2 font-bold"
          >
            Alışverişe Devam
          </Link>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 lg:grid-cols-[1fr_360px]">
        <section>
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-black">
                Sepetim
              </h1>

              <div className="mt-1 text-sm text-slate-500">
                {itemCount} adet ürün
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                if (
                  window.confirm(
                    "Sepet tamamen temizlensin mi?"
                  )
                ) {
                  clearCart();
                }
              }}
              className="text-sm font-bold text-red-600"
            >
              Sepeti Temizle
            </button>
          </div>

          <div className="space-y-4">
            {items.map((item) => {
              const product =
                products.find(
                  (product) =>
                    product.id === item.id
                );

              const stock =
                product?.stock ?? 0;

              return (
                <article
                  key={item.id}
                  className="flex gap-4 rounded-2xl border bg-white p-4"
                >
                  <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-100">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="h-full w-full object-contain p-2"
                      />
                    ) : (
                      <span className="text-xs font-bold text-slate-400">
                        Görsel Yok
                      </span>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/urun/${item.id}`}
                      className="font-black"
                    >
                      {item.name}
                    </Link>

                    <div className="mt-1 text-sm text-slate-500">
                      Stok: {stock}
                    </div>

                    <div className="mt-2 text-lg font-black">
                      ₺
                      {item.price.toLocaleString(
                        "tr-TR",
                        {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        }
                      )}
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          decrease(
                            item.id,
                            item.quantity
                          )
                        }
                        className="h-9 w-9 rounded-lg border font-black"
                      >
                        -
                      </button>

                      <div className="min-w-10 text-center font-black">
                        {item.quantity}
                      </div>

                      <button
                        type="button"
                        disabled={
                          item.quantity >= stock
                        }
                        onClick={() =>
                          increase(
                            item.id,
                            item.quantity
                          )
                        }
                        className="h-9 w-9 rounded-lg border font-black disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-300"
                      >
                        +
                      </button>

                      {item.quantity >= stock &&
                        stock > 0 && (
                          <span className="text-xs font-bold text-amber-600">
                            Maksimum stok adedi
                          </span>
                        )}

                      <button
                        type="button"
                        onClick={() =>
                          removeItem(item.id)
                        }
                        className="ml-auto text-sm font-bold text-red-600"
                      >
                        Kaldır
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <aside className="h-fit rounded-2xl border bg-white p-6 lg:sticky lg:top-5">
          <h2 className="text-xl font-black">
            Sipariş Özeti
          </h2>

          <div className="mt-5 flex justify-between text-sm">
            <span>
              Ürün adedi
            </span>

            <strong>
              {itemCount}
            </strong>
          </div>

          <div className="mt-3 flex justify-between text-sm">
            <span>
              Ara Toplam
            </span>

            <strong>
              ₺
              {total.toLocaleString(
                "tr-TR",
                {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                }
              )}
            </strong>
          </div>

          <div className="my-5 border-t" />

          <div className="flex items-end justify-between">
            <span className="font-bold">
              Toplam
            </span>

            <strong className="text-2xl">
              ₺
              {total.toLocaleString(
                "tr-TR",
                {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                }
              )}
            </strong>
          </div>

          <Link
            href="/odeme"
            className="mt-6 block rounded-xl bg-red-600 py-4 text-center font-black text-white"
          >
            Siparişi Tamamla
          </Link>
        </aside>
      </div>
    </main>
  );
}