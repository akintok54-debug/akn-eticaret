"use client";

import Link from "next/link";
import { useOrders } from "@/context/OrderContext";

export default function OrdersPage() {
  const { orders } = useOrders();

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5">
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
            Ürünler
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="text-3xl font-black">
          Siparişlerim
        </h1>

        {orders.length === 0 ? (
          <div className="mt-6 rounded-2xl border bg-white p-10 text-center">
            <div className="text-xl font-black">
              Henüz siparişiniz yok
            </div>

            <Link
              href="/urunler"
              className="mt-5 inline-block rounded-xl bg-red-600 px-6 py-3 font-black text-white"
            >
              Alışverişe Başla
            </Link>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {orders.map((order) => (
              <article
                key={order.id}
                className="rounded-2xl border bg-white p-5"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="text-xs font-bold text-slate-400">
                      SİPARİŞ
                    </div>

                    <div className="text-lg font-black">
                      {order.orderNumber}
                    </div>

                    <div className="mt-1 text-sm text-slate-500">
                      {new Date(
                        order.createdAt
                      ).toLocaleString(
                        "tr-TR"
                      )}
                    </div>
                  </div>

                  <div className="rounded-full bg-slate-100 px-4 py-2 text-sm font-black">
                    {order.status}
                  </div>
                </div>

                <div className="mt-5 space-y-2 border-t pt-4">
                  {order.items.map(
                    (item) => (
                      <div
                        key={
                          item.productId
                        }
                        className="flex justify-between gap-4 text-sm"
                      >
                        <span>
                          {item.name} ×{" "}
                          {item.quantity}
                        </span>

                        <strong>
                          ₺
                          {(
                            item.price *
                            item.quantity
                          ).toLocaleString(
                            "tr-TR",
                            {
                              minimumFractionDigits:
                                2,
                            }
                          )}
                        </strong>
                      </div>
                    )
                  )}
                </div>

                <div className="mt-5 flex justify-between border-t pt-4">
                  <strong>
                    Toplam
                  </strong>

                  <strong className="text-xl">
                    ₺
                    {order.total.toLocaleString(
                      "tr-TR",
                      {
                        minimumFractionDigits:
                          2,
                      }
                    )}
                  </strong>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}