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
    status: string;
    total: number;
    createdAt: string;
    returnedAt?: string | null;
    returnReason?: string | null;
    returnNote?: string | null;
    items?: OrderItem[];
};

function money(value: number) {
    return new Intl.NumberFormat("tr-TR", {
        style: "currency",
        currency: "TRY",
    }).format(value || 0);
}

export default function CancelReturnPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState("");
    const [processingId, setProcessingId] = useState<string | null>(null);

    const [returnOrder, setReturnOrder] = useState<Order | null>(null);
    const [returnReason, setReturnReason] = useState("");
    const [returnNote, setReturnNote] = useState("");

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

            setOrders(data.orders || []);
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
    const controller = new AbortController();
    fetch("/api/orders", { cache: "no-store", signal: controller.signal })
      .then(async response => { const data = await response.json(); if (!response.ok) throw new Error(data.message || "Kayıtlar alınamadı."); return data; })
      .then(data => { if (!controller.signal.aborted) { setOrders(data.orders || []); } })
      .catch(error => { if (!controller.signal.aborted) setMessage(error instanceof Error ? error.message : "Kayıtlar alınamadı."); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, []);

    const filteredOrders = useMemo(() => {
        const q = search.trim().toLocaleLowerCase("tr-TR");

        const relevant = orders.filter(
            (order) => order.status !== "Taslak"
        );

        if (!q) return relevant;

        return relevant.filter((order) =>
            [
                order.orderNumber,
                order.customerName,
                order.customerPhone,
                order.customerEmail,
                order.status,
            ].some((value) =>
                (value || "").toLocaleLowerCase("tr-TR").includes(q)
            )
        );
    }, [orders, search]);

    async function cancelOrder(order: Order) {
        if (order.status === "İptal" || order.status === "İade") return;

        const approved = window.confirm(
            `${order.orderNumber} numaralı sipariş iptal edilsin mi?\n\nÜrün stokları geri eklenecek.`
        );

        if (!approved) return;

        setProcessingId(order.id);
        setMessage("");

        try {
            const response = await fetch(`/api/orders/${order.id}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    status: "İptal",
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Sipariş iptal edilemedi.");
            }

            setMessage(`${order.orderNumber} iptal edildi.`);
            await loadOrders();
        } catch (error) {
            setMessage(
                error instanceof Error
                    ? error.message
                    : "Sipariş iptal edilemedi."
            );
        } finally {
            setProcessingId(null);
        }
    }

    async function submitReturn() {
        if (!returnOrder) return;

        if (!returnReason.trim()) {
            setMessage("İade nedeni zorunludur.");
            return;
        }

        setProcessingId(returnOrder.id);
        setMessage("");

        try {
            const response = await fetch(`/api/orders/${returnOrder.id}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    status: "İade",
                    returnReason: returnReason.trim(),
                    returnNote: returnNote.trim(),
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "İade işlemi yapılamadı.");
            }

            const number = returnOrder.orderNumber;

            setReturnOrder(null);
            setReturnReason("");
            setReturnNote("");

            setMessage(`${number} iade olarak kaydedildi.`);
            await loadOrders();
        } catch (error) {
            setMessage(
                error instanceof Error
                    ? error.message
                    : "İade işlemi yapılamadı."
            );
        } finally {
            setProcessingId(null);
        }
    }

    return (
        <main className="p-4 md:p-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold">İptal ve İade</h1>
                <p className="mt-1 text-sm text-slate-500">
                    Sipariş iptallerini ve müşteri iadelerini yönetin.
                </p>
            </div>

            <section className="rounded-xl border bg-white">
                <div className="flex flex-col gap-3 border-b p-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <div className="font-semibold">Siparişler</div>
                        <div className="text-sm text-slate-500">
                            İptal ve iade işlemleri
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
                    <div className="p-12 text-center text-sm text-slate-500">
                        Siparişler yükleniyor...
                    </div>
                ) : filteredOrders.length === 0 ? (
                    <div className="p-12 text-center">
                        <div className="text-lg font-semibold">
                            İşlem yapılabilecek sipariş yok
                        </div>
                        <p className="mt-2 text-sm text-slate-500">
                            Siparişler oluştuğunda burada görüntülenecek.
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b bg-slate-50 text-left">
                                    <th className="p-3">Sipariş No</th>
                                    <th className="p-3">Müşteri</th>
                                    <th className="p-3">Ürün</th>
                                    <th className="p-3">Toplam</th>
                                    <th className="p-3">Durum</th>
                                    <th className="p-3">Tarih</th>
                                    <th className="p-3 text-right">İşlem</th>
                                </tr>
                            </thead>

                            <tbody>
                                {filteredOrders.map((order) => {
                                    const closed =
                                        order.status === "İptal" ||
                                        order.status === "İade";

                                    return (
                                        <tr key={order.id} className="border-b align-top">
                                            <td className="p-3 font-semibold">
                                                {order.orderNumber}
                                            </td>

                                            <td className="p-3">
                                                <div>{order.customerName}</div>
                                                <div className="text-xs text-slate-500">
                                                    {order.customerPhone}
                                                </div>
                                            </td>

                                            <td className="p-3">
                                                {order.items?.reduce(
                                                    (sum, item) => sum + item.quantity,
                                                    0
                                                ) || 0}
                                            </td>

                                            <td className="p-3 font-semibold">
                                                {money(order.total)}
                                            </td>

                                            <td className="p-3">
                                                <span className="rounded-full border px-2.5 py-1 text-xs font-medium">
                                                    {order.status}
                                                </span>

                                                {order.status === "İade" &&
                                                    order.returnReason && (
                                                        <div className="mt-2 max-w-56 text-xs text-slate-500">
                                                            {order.returnReason}
                                                        </div>
                                                    )}
                                            </td>

                                            <td className="p-3">
                                                {new Date(order.createdAt).toLocaleString(
                                                    "tr-TR"
                                                )}
                                            </td>

                                            <td className="p-3">
                                                <div className="flex justify-end gap-2">
                                                    {!closed && (
                                                        <>
                                                            <button
                                                                type="button"
                                                                disabled={processingId === order.id}
                                                                onClick={() =>
                                                                    void cancelOrder(order)
                                                                }
                                                                className="rounded-lg border border-red-200 px-3 py-2 font-medium text-red-600 disabled:opacity-50"
                                                            >
                                                                İptal
                                                            </button>

                                                            <button
                                                                type="button"
                                                                disabled={processingId === order.id}
                                                                onClick={() => {
                                                                    setReturnOrder(order);
                                                                    setReturnReason("");
                                                                    setReturnNote("");
                                                                    setMessage("");
                                                                }}
                                                                className="rounded-lg bg-slate-900 px-3 py-2 font-medium text-white disabled:opacity-50"
                                                            >
                                                                İade Al
                                                            </button>
                                                        </>
                                                    )}

                                                    {closed && (
                                                        <span className="text-xs text-slate-500">
                                                            İşlem tamamlandı
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>

            {returnOrder && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-xl">
                        <div className="mb-5">
                            <h2 className="text-xl font-bold">İade Al</h2>

                            <p className="mt-1 text-sm text-slate-500">
                                {returnOrder.orderNumber} · {returnOrder.customerName}
                            </p>
                        </div>

                        <label className="mb-4 block">
                            <span className="mb-1 block text-sm font-medium">
                                İade Nedeni *
                            </span>

                            <select
                                value={returnReason}
                                onChange={(e) => setReturnReason(e.target.value)}
                                className="w-full rounded-lg border px-3 py-2"
                            >
                                <option value="">İade nedeni seçin</option>
                                <option value="Yanlış ürün">
                                    Yanlış ürün
                                </option>
                                <option value="Uyumsuz ürün">
                                    Uyumsuz ürün
                                </option>
                                <option value="Hasarlı ürün">
                                    Hasarlı ürün
                                </option>
                                <option value="Eksik ürün">
                                    Eksik ürün
                                </option>
                                <option value="Müşteri vazgeçti">
                                    Müşteri vazgeçti
                                </option>
                                <option value="Diğer">
                                    Diğer
                                </option>
                            </select>
                        </label>

                        <label className="block">
                            <span className="mb-1 block text-sm font-medium">
                                İade Notu
                            </span>

                            <textarea
                                value={returnNote}
                                onChange={(e) => setReturnNote(e.target.value)}
                                rows={4}
                                placeholder="İade hakkında açıklama..."
                                className="w-full resize-none rounded-lg border px-3 py-2"
                            />
                        </label>

                        <div className="mt-6 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
                            İade tamamlandığında siparişteki ürünler stoğa geri
                            eklenecek.
                        </div>

                        <div className="mt-5 flex justify-end gap-2">
                            <button
                                type="button"
                                disabled={processingId === returnOrder.id}
                                onClick={() => {
                                    setReturnOrder(null);
                                    setReturnReason("");
                                    setReturnNote("");
                                }}
                                className="rounded-lg border px-4 py-2 font-medium"
                            >
                                Vazgeç
                            </button>

                            <button
                                type="button"
                                disabled={
                                    !returnReason ||
                                    processingId === returnOrder.id
                                }
                                onClick={() => void submitReturn()}
                                className="rounded-lg bg-slate-900 px-4 py-2 font-semibold text-white disabled:opacity-50"
                            >
                                {processingId === returnOrder.id
                                    ? "İşleniyor..."
                                    : "İadeyi Tamamla"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}