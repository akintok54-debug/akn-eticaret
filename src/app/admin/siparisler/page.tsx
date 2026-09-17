"use client";

import Link from "next/link";

import {
  useOrders,
  type OrderStatus,
} from "@/context/OrderContext";

import { useProducts } from "@/context/ProductContext";

const STATUSES: OrderStatus[] = [
  "Yeni",
  "Hazırlanıyor",
  "Kargoda",
  "Tamamlandı",
  "İptal",
];

export default function AdminOrdersPage() {
  const {
    orders,
    updateStatus,
  } = useOrders();

  const { changeStock } =
    useProducts();

  function changeStatus(
    orderId: string,
    nextStatus: OrderStatus
  ) {
    const order = orders.find(
      (order) => order.id === orderId
    );

    if (!order) return;

    const oldStatus =
      order.status;

    if (oldStatus === nextStatus) {
      return;
    }

    if (
      nextStatus === "İptal" &&
      oldStatus !== "İptal"
    ) {
      order.items.forEach((item) => {
        changeStock(
          item.productId,
          item.quantity
        );
      });
    }

    if (
      oldStatus === "İptal" &&
      nextStatus !== "İptal"
    ) {
      order.items.forEach((item) => {
        changeStock(
          item.productId,
          -item.quantity
        );
      });
    }

    updateStatus(
      orderId,
      nextStatus
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      <header className="bg-slate-950 text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5">
          <div className="font-black">
            AKN YÖNETİM
          </div>

          <Link
            href="/admin"
            className="rounded-xl border border-slate-700 px-4 py-2 font-bold"
          >
            Yönetim Paneli
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="text-sm font-black text-red-600">
          SİPARİŞ YÖNETİMİ
        </div>

        <h1 className="text-3xl font-black">
          Siparişler
        </h1>

        <div className="mt-2 text-sm text-slate-500">
          Toplam {orders.length} sipariş
        </div>

        {orders.length === 0 ? (
          <div className="mt-6 rounded-2xl border bg-white p-10 text-center font-bold text-slate-500">
            Henüz sipariş bulunmuyor.
          </div>
        ) : (
          <div className="mt-6 space-y-5">
            {orders.map((order) => (
              <article
                key={order.id}
                className="rounded-2xl border bg-white p-5"
              >
                <div className="grid gap-5 lg:grid-cols-[1fr_220px]">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-xl font-black">
                        {order.orderNumber}
                      </h2>

                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black">
                        {order.status}
                      </span>
                    </div>

                    <div className="mt-2 text-sm text-slate-500">
                      {new Date(
                        order.createdAt
                      ).toLocaleString(
                        "tr-TR"
                      )}
                    </div>

                    <div className="mt-5 grid gap-4 md:grid-cols-2">
                      <div className="rounded-xl bg-slate-50 p-4">
                        <div className="text-xs font-bold text-slate-400">
                          MÜŞTERİ
                        </div>

                        <div className="mt-1 font-black">
                          {
                            order.customer
                              .fullName
                          }
                        </div>

                        <div className="mt-1 text-sm">
                          {
                            order.customer
                              .phone
                          }
                        </div>

                        <div className="text-sm">
                          {
                            order.customer
                              .email
                          }
                        </div>
                      </div>

                      <div className="rounded-xl bg-slate-50 p-4">
                        <div className="text-xs font-bold text-slate-400">
                          TESLİMAT
                        </div>

                        <div className="mt-1 font-bold">
                          {
                            order.delivery
                              .city
                          }{" "}
                          /{" "}
                          {
                            order.delivery
                              .district
                          }
                        </div>

                        <div className="mt-1 text-sm">
                          {
                            order.delivery
                              .address
                          }
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 overflow-x-auto">
                      <table className="w-full min-w-[600px] text-left text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="py-3">
                              Ürün
                            </th>

                            <th className="py-3">
                              Adet
                            </th>

                            <th className="py-3">
                              Fiyat
                            </th>

                            <th className="py-3 text-right">
                              Toplam
                            </th>
                          </tr>
                        </thead>

                        <tbody>
                          {order.items.map(
                            (item) => (
                              <tr
                                key={
                                  item.productId
                                }
                                className="border-b"
                              >
                                <td className="py-3 font-bold">
                                  {
                                    item.name
                                  }
                                </td>

                                <td className="py-3">
                                  {
                                    item.quantity
                                  }
                                </td>

                                <td className="py-3">
                                  ₺
                                  {item.price.toLocaleString(
                                    "tr-TR",
                                    {
                                      minimumFractionDigits:
                                        2,
                                    }
                                  )}
                                </td>

                                <td className="py-3 text-right font-black">
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
                                </td>
                              </tr>
                            )
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <aside className="rounded-xl bg-slate-50 p-4">
                    <div className="text-xs font-bold text-slate-400">
                      SİPARİŞ TOPLAMI
                    </div>

                    <div className="mt-1 text-2xl font-black">
                      ₺
                      {order.total.toLocaleString(
                        "tr-TR",
                        {
                          minimumFractionDigits:
                            2,
                        }
                      )}
                    </div>

                    <div className="mt-5 text-xs font-bold text-slate-400">
                      DURUM
                    </div>

                    <select
                      value={order.status}
                      onChange={(event) =>
                        changeStatus(
                          order.id,
                          event.target
                            .value as OrderStatus
                        )
                      }
                      className="mt-2 w-full rounded-xl border bg-white px-3 py-3 font-bold"
                    >
                      {STATUSES.map(
                        (status) => (
                          <option
                            key={status}
                            value={status}
                          >
                            {status}
                          </option>
                        )
                      )}
                    </select>

                    <div className="mt-5 text-xs font-bold text-slate-400">
                      ÖDEME
                    </div>

                    <div className="mt-1 text-sm font-bold">
                      {
                        order.paymentMethod
                      }
                    </div>

                    <div className="mt-4 text-xs font-bold text-slate-400">
                      KARGO
                    </div>

                    <div className="mt-1 text-sm font-bold">
                      {
                        order.shippingMethod
                      }
                    </div>
                  </aside>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}