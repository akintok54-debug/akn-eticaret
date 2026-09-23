"use client";

import { useEffect, useMemo, useState } from "react";

type OrderItem = {
    id: string;
    productName: string;
    sku: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
};

type Order = {
    id: string;
    orderNumber: string;
    customerName: string;
    customerPhone: string;
    customerEmail?: string | null;
    city: string;
    district: string;
    deliveryAddress: string;
    paymentMethod: string;
    shippingMethod: string;
    status: string;
    subtotal: number;
    shippingTotal: number;
    discountTotal: number;
    total: number;
    createdAt: string;
    items?: OrderItem[];
};

function money(value: number) {
    return new Intl.NumberFormat("tr-TR", {
        style: "currency",
        currency: "TRY",
    }).format(value || 0);
}

export default function DraftOrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState("");
    const [updatingId, setUpdatingId] = useState<string | null>(null);

    async function loadOrders() {
        setLoading(true);
        setMessage("");

        try {
            const response = await fetch("/api/orders", {
                cache: "no-store",
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Siparişler alınamadı.");
            }

            setOrders(
                (data.orders || []).filter(
                    (order: Order) => order.status === "Taslak"
                )
            );
        } catch (error) {
            setMessage(
                error instanceof Error
                    ? error.message
                    : "Siparişler alınamadı."
            );
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        void loadOrders();
    }, []);

    const filteredOrders = useMemo(() => {
        const q = search.trim().toLocaleLowerCase("tr-TR");

        if (!q) return orders;

        return orders.filter((order) =>
            [
                order.orderNumber,
                order.customerName,
                order.customerPhone,
                order.customerEmail,
                order.city,
                order.district,
            ].some((value) =>
                (value || "").toLocaleLowerCase("tr-TR").includes(q)
            )
        );
    }, [orders, search]);

    async function makeOrder(order: Order) {
        const approved = window.confirm(
            `${order.orderNumber} numaralı taslak normal siparişe dönüştürülsün mü?`
        );

        if (!approved) return;

        setUpdatingId(order.id);
        setMessage("");

        try {
            const response = await fetch(`/api/orders/${order.id}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    status: "Yeni",
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Taslak sipariş dönüştürülemedi."
                );
            }

            setOrders((current) =>
                current.filter((item) => item.id !== order.id)
            );

            setMessage(
                `${order.orderNumber} normal siparişe dönüştürüldü.`
            );
        } catch (error) {
            setMessage(
                error instanceof Error
                    ? error.message
                    : "İşlem gerçekleştirilemedi."
            );
        } finally {
            setUpdatingId(null);
        }
    }

    return (
        <main className="p-4 md:p-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold">Taslak Siparişler</h1>

                <p className="mt-1 text-sm text-slate-500">
                    Kaydedilmiş ancak henüz normal siparişe dönüştürülmemiş
                    taslakları yönetin.
                </p>
            </div>

            <section className="rounded-xl border bg-white">
                <div className="flex flex-col gap-3 border-b p-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <div className="font-semibold">
                            Taslak Siparişler
                        </div>

                        <div className="text-sm text-slate-500">
                            {orders.length} taslak sipariş
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Sipariş no, müşteri, telefon ara"
                            className="w-full rounded-lg border px-3 py-2 text-sm md:w-80"
                        />

                        <button
                            type="button"
                            onClick={() => void loadOrders()}
                            className="rounded-lg border px-4 py-2 text-sm font-medium"
                        >
                            Yenile
                        </button>
                    </div>
                </div>

                {message && (
                    <div className="border-b bg-slate-50 px-4 py-3 text-sm font-medium">
                        {message}
                    </div>
                )}

                {loading ? (
                    <div className="p-10 text-center text-sm text-slate-500">
                        Taslak siparişler yükleniyor...
                    </div>
                ) : filteredOrders.length === 0 ? (
                    <div className="p-12 text-center">
                        <div className="text-lg font-semibold">
                            Henüz taslak sipariş yok
                        </div>

                        <p className="mt-2 text-sm text-slate-500">
                            Taslak olarak kaydedilen siparişler burada
                            görüntülenecek.
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b bg-slate-50 text-left">
                                    <th className="p-3">Sipariş No</th>
                                    <th className="p-3">Müşteri</th>
                                    <th className="p-3">Telefon</th>
                                    <th className="p-3">Konum</th>
                                    <th className="p-3">Ürün</th>
                                    <th className="p-3">Toplam</th>
                                    <th className="p-3">Tarih</th>
                                    <th className="p-3 text-right">İşlem</th>
                                </tr>
                            </thead>

                            <tbody>
                                {filteredOrders.map((order) => (
                                    <tr
                                        key={order.id}
                                        className="border-b align-top"
                                    >
                                        <td className="p-3 font-semibold">
                                            {order.orderNumber}
                                        </td>

                                        <td className="p-3">
                                            {order.customerName}
                                        </td>

                                        <td className="p-3">
                                            {order.customerPhone}
                                        </td>

                                        <td className="p-3">
                                            {order.city} / {order.district}
                                        </td>

                                        <td className="p-3">
                                            {order.items?.reduce(
                                                (total, item) =>
                                                    total + item.quantity,
                                                0
                                            ) || 0}
                                        </td>

                                        <td className="p-3 font-semibold">
                                            {money(order.total)}
                                        </td>

                                        <td className="p-3">
                                            {new Date(order.createdAt).toLocaleString(
                                                "tr-TR"
                                            )}
                                        </td>

                                        <td className="p-3 text-right">
                                            <button
                                                type="button"
                                                disabled={updatingId === order.id}
                                                onClick={() => void makeOrder(order)}
                                                className="rounded-lg bg-slate-900 px-3 py-2 font-medium text-white disabled:opacity-50"
                                            >
                                                {updatingId === order.id
                                                    ? "İşleniyor..."
                                                    : "Siparişe Dönüştür"}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
        </main>
    );
}