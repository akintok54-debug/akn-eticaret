"use client";

import { useEffect, useMemo, useState } from "react";
import { useProducts } from "@/context/ProductContext";

type Compatibility = {
    id: string;
    productId: string;
    make: string;
    model: string;
    yearFrom: number | null;
    yearTo: number | null;
    engine: string | null;
    note: string | null;
};

export default function ExtraInfoPage() {
    const { products, loaded } = useProducts();

    const [search, setSearch] = useState("");
    const [productId, setProductId] = useState("");

    const [make, setMake] = useState("");
    const [model, setModel] = useState("");
    const [yearFrom, setYearFrom] = useState("");
    const [yearTo, setYearTo] = useState("");
    const [engine, setEngine] = useState("");
    const [note, setNote] = useState("");

    const [items, setItems] = useState<Compatibility[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");

    const activeProducts = useMemo(() => {
        const q = search.trim().toLocaleLowerCase("tr-TR");

        return products
            .filter((p) => p.active)
            .filter((p) => {
                if (!q) return true;

                return [p.name, p.sku, p.barcode, p.brand].some((value) =>
                    (value || "").toLocaleLowerCase("tr-TR").includes(q)
                );
            })
            .slice(0, 100);
    }, [products, search]);

    const selectedProduct = products.find((p) => p.id === productId);

    async function loadCompatibilities(id: string) {
        if (!id) {
            setItems([]);
            return;
        }

        setLoading(true);
        setMessage("");

        try {
            const response = await fetch(
                `/api/product-compatibilities?productId=${encodeURIComponent(id)}`,
                {
                    cache: "no-store",
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Uyumluluk bilgileri alınamadı.");
            }

            setItems(data.compatibilities || []);
        } catch (error) {
            setMessage(
                error instanceof Error ? error.message : "Bir hata oluştu."
            );
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        void loadCompatibilities(productId);
    }, [productId]);

    async function saveCompatibility() {
        if (!productId) {
            setMessage("Önce ürün seçin.");
            return;
        }

        if (!make.trim() || !model.trim()) {
            setMessage("Motosiklet marka ve modelini girin.");
            return;
        }

        setSaving(true);
        setMessage("");

        try {
            const response = await fetch("/api/product-compatibilities", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    productId,
                    make: make.trim(),
                    model: model.trim(),
                    yearFrom: yearFrom ? Number(yearFrom) : null,
                    yearTo: yearTo ? Number(yearTo) : null,
                    engine: engine.trim() || null,
                    note: note.trim() || null,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Uyumluluk kaydedilemedi.");
            }

            setMake("");
            setModel("");
            setYearFrom("");
            setYearTo("");
            setEngine("");
            setNote("");

            setMessage("Uyumluluk başarıyla eklendi.");
            await loadCompatibilities(productId);
        } catch (error) {
            setMessage(
                error instanceof Error ? error.message : "Bir hata oluştu."
            );
        } finally {
            setSaving(false);
        }
    }

    async function deleteCompatibility(id: string) {
        if (!window.confirm("Bu uyumluluk kaydı silinsin mi?")) return;

        setMessage("");

        try {
            const response = await fetch(
                `/api/product-compatibilities?id=${encodeURIComponent(id)}`,
                {
                    method: "DELETE",
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Kayıt silinemedi.");
            }

            setMessage("Uyumluluk kaydı silindi.");
            await loadCompatibilities(productId);
        } catch (error) {
            setMessage(
                error instanceof Error ? error.message : "Bir hata oluştu."
            );
        }
    }

    return (
        <main className="p-4 md:p-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold">Ek Bilgiler</h1>
                <p className="mt-1 text-sm text-slate-500">
                    Ürünlerin motosiklet marka, model, yıl ve motor uyumluluklarını yönetin.
                </p>
            </div>

            <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
                <section className="rounded-xl border bg-white p-4">
                    <h2 className="mb-4 font-semibold">Ürün Seç</h2>

                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Ürün adı, stok kodu, barkod veya marka ara"
                        className="mb-3 w-full rounded-lg border px-3 py-2"
                    />

                    {!loaded ? (
                        <p className="text-sm text-slate-500">Ürünler yükleniyor...</p>
                    ) : (
                        <select
                            value={productId}
                            onChange={(e) => setProductId(e.target.value)}
                            className="w-full rounded-lg border px-3 py-2"
                            size={12}
                        >
                            <option value="">Ürün seçin</option>

                            {activeProducts.map((product) => (
                                <option key={product.id} value={product.id}>
                                    {product.sku} — {product.name}
                                </option>
                            ))}
                        </select>
                    )}
                </section>

                <section className="space-y-6">
                    <div className="rounded-xl border bg-white p-5">
                        <h2 className="mb-1 text-lg font-semibold">
                            Motosiklet Uyumluluğu
                        </h2>

                        {selectedProduct ? (
                            <p className="mb-5 text-sm text-slate-500">
                                {selectedProduct.name} · {selectedProduct.sku}
                            </p>
                        ) : (
                            <p className="mb-5 text-sm text-slate-500">
                                Soldan bir ürün seçin.
                            </p>
                        )}

                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            <label className="text-sm">
                                <span className="mb-1 block font-medium">
                                    Motosiklet Markası
                                </span>
                                <input
                                    value={make}
                                    onChange={(e) => setMake(e.target.value)}
                                    placeholder="Honda"
                                    className="w-full rounded-lg border px-3 py-2"
                                />
                            </label>

                            <label className="text-sm">
                                <span className="mb-1 block font-medium">Model</span>
                                <input
                                    value={model}
                                    onChange={(e) => setModel(e.target.value)}
                                    placeholder="PCX 125"
                                    className="w-full rounded-lg border px-3 py-2"
                                />
                            </label>

                            <label className="text-sm">
                                <span className="mb-1 block font-medium">Motor</span>
                                <input
                                    value={engine}
                                    onChange={(e) => setEngine(e.target.value)}
                                    placeholder="125 cc"
                                    className="w-full rounded-lg border px-3 py-2"
                                />
                            </label>

                            <label className="text-sm">
                                <span className="mb-1 block font-medium">
                                    Başlangıç Yılı
                                </span>
                                <input
                                    type="number"
                                    value={yearFrom}
                                    onChange={(e) => setYearFrom(e.target.value)}
                                    placeholder="2021"
                                    className="w-full rounded-lg border px-3 py-2"
                                />
                            </label>

                            <label className="text-sm">
                                <span className="mb-1 block font-medium">
                                    Bitiş Yılı
                                </span>
                                <input
                                    type="number"
                                    value={yearTo}
                                    onChange={(e) => setYearTo(e.target.value)}
                                    placeholder="2024"
                                    className="w-full rounded-lg border px-3 py-2"
                                />
                            </label>

                            <label className="text-sm">
                                <span className="mb-1 block font-medium">Not</span>
                                <input
                                    value={note}
                                    onChange={(e) => setNote(e.target.value)}
                                    placeholder="Ön fren / ABS model"
                                    className="w-full rounded-lg border px-3 py-2"
                                />
                            </label>
                        </div>

                        <button
                            type="button"
                            onClick={() => void saveCompatibility()}
                            disabled={!productId || saving}
                            className="mt-5 rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                        >
                            {saving ? "Kaydediliyor..." : "Uyumluluk Ekle"}
                        </button>

                        {message && (
                            <p className="mt-4 text-sm font-medium">{message}</p>
                        )}
                    </div>

                    <div className="rounded-xl border bg-white p-5">
                        <h2 className="mb-4 text-lg font-semibold">
                            Kayıtlı Uyumluluklar
                        </h2>

                        {!productId ? (
                            <p className="text-sm text-slate-500">
                                Önce bir ürün seçin.
                            </p>
                        ) : loading ? (
                            <p className="text-sm text-slate-500">Yükleniyor...</p>
                        ) : items.length === 0 ? (
                            <p className="text-sm text-slate-500">
                                Bu ürün için henüz uyumluluk girilmemiş.
                            </p>
                        ) : (
                            <div className="space-y-3">
                                {items.map((item) => (
                                    <div
                                        key={item.id}
                                        className="flex flex-col justify-between gap-3 rounded-lg border p-4 sm:flex-row sm:items-center"
                                    >
                                        <div>
                                            <strong>
                                                {item.make} {item.model}
                                            </strong>

                                            <div className="mt-1 text-sm text-slate-500">
                                                {item.yearFrom || item.yearTo
                                                    ? `${item.yearFrom ?? "?"} - ${item.yearTo ?? "?"}`
                                                    : "Yıl belirtilmedi"}

                                                {item.engine ? ` · ${item.engine}` : ""}
                                            </div>

                                            {item.note && (
                                                <div className="mt-1 text-sm">
                                                    {item.note}
                                                </div>
                                            )}
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => void deleteCompatibility(item.id)}
                                            className="rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600"
                                        >
                                            Sil
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </section>
            </div>
        </main>
    );
}