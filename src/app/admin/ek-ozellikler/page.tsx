"use client";

import { useEffect, useMemo, useState } from "react";
import { useProducts } from "@/context/ProductContext";

type ProductAttribute = {
    id: string;
    productId: string;
    name: string;
    value: string;
    unit: string | null;
    note: string | null;
};

export default function ProductAttributesPage() {
    const { products, loaded } = useProducts();

    const [search, setSearch] = useState("");
    const [productId, setProductId] = useState("");

    const [name, setName] = useState("");
    const [value, setValue] = useState("");
    const [unit, setUnit] = useState("");
    const [note, setNote] = useState("");

    const [attributes, setAttributes] = useState<ProductAttribute[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");

    const filteredProducts = useMemo(() => {
        const q = search.trim().toLocaleLowerCase("tr-TR");

        return products
            .filter((product) => product.active)
            .filter((product) => {
                if (!q) return true;

                return [
                    product.name,
                    product.sku,
                    product.barcode,
                    product.brand,
                ].some((item) =>
                    (item || "").toLocaleLowerCase("tr-TR").includes(q)
                );
            })
            .slice(0, 100);
    }, [products, search]);

    const selectedProduct = products.find(
        (product) => product.id === productId
    );

    async function loadAttributes(id: string) {
        if (!id) {
            setAttributes([]);
            return;
        }

        setLoading(true);
        setMessage("");

        try {
            const response = await fetch(
                `/api/product-attributes?productId=${encodeURIComponent(id)}`,
                { cache: "no-store" }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Özellikler alınamadı.");
            }

            setAttributes(data.attributes || []);
        } catch (error) {
            setMessage(
                error instanceof Error ? error.message : "Bir hata oluştu."
            );
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
    if (!productId) return;
    const controller = new AbortController();
    fetch("/api/product-attributes?productId=" + encodeURIComponent(productId), { cache: "no-store", signal: controller.signal })
      .then(async response => { const data = await response.json(); if (!response.ok) throw new Error(data.message); return data; })
      .then(data => { if (!controller.signal.aborted) setAttributes(data.attributes || []); })
      .catch(error => { if (!controller.signal.aborted) setMessage(error instanceof Error ? error.message : "Kayıtlar alınamadı."); });
    return () => controller.abort();
  }, [productId]);

    async function addAttribute() {
        if (!productId) {
            setMessage("Önce bir ürün seçin.");
            return;
        }

        if (!name.trim() || !value.trim()) {
            setMessage("Özellik adı ve değeri zorunlu.");
            return;
        }

        setSaving(true);
        setMessage("");

        try {
            const response = await fetch("/api/product-attributes", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    productId,
                    name: name.trim(),
                    value: value.trim(),
                    unit: unit.trim() || null,
                    note: note.trim() || null,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Özellik kaydedilemedi.");
            }

            setName("");
            setValue("");
            setUnit("");
            setNote("");

            setMessage("Özellik başarıyla eklendi.");
            await loadAttributes(productId);
        } catch (error) {
            setMessage(
                error instanceof Error ? error.message : "Bir hata oluştu."
            );
        } finally {
            setSaving(false);
        }
    }

    async function deleteAttribute(id: string) {
        if (!window.confirm("Bu özellik silinsin mi?")) return;

        setMessage("");

        try {
            const response = await fetch(
                `/api/product-attributes?id=${encodeURIComponent(id)}`,
                {
                    method: "DELETE",
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Özellik silinemedi.");
            }

            setMessage("Özellik silindi.");
            await loadAttributes(productId);
        } catch (error) {
            setMessage(
                error instanceof Error ? error.message : "Bir hata oluştu."
            );
        }
    }

    return (
        <main className="p-4 md:p-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold">Ek Özellikler</h1>
                <p className="mt-1 text-sm text-slate-500">
                    Ürünlerin teknik ve ek özelliklerini yönetin.
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
                        <p className="text-sm text-slate-500">
                            Ürünler yükleniyor...
                        </p>
                    ) : (
                        <select
                            value={productId}
                            onChange={(e) => { setProductId(e.target.value); setAttributes([]); setMessage(""); }}
                            className="w-full rounded-lg border px-3 py-2"
                            size={14}
                        >
                            <option value="">Ürün seçin</option>

                            {filteredProducts.map((product) => (
                                <option key={product.id} value={product.id}>
                                    {product.sku} — {product.name}
                                </option>
                            ))}
                        </select>
                    )}
                </section>

                <section className="space-y-6">
                    <div className="rounded-xl border bg-white p-5">
                        <h2 className="text-lg font-semibold">
                            Yeni Özellik Ekle
                        </h2>

                        {selectedProduct ? (
                            <p className="mb-5 mt-1 text-sm text-slate-500">
                                {selectedProduct.name} · {selectedProduct.sku}
                            </p>
                        ) : (
                            <p className="mb-5 mt-1 text-sm text-slate-500">
                                Soldan bir ürün seçin.
                            </p>
                        )}

                        <div className="grid gap-4 md:grid-cols-2">
                            <label className="text-sm">
                                <span className="mb-1 block font-medium">
                                    Özellik Adı
                                </span>
                                <input
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Örn: Malzeme"
                                    className="w-full rounded-lg border px-3 py-2"
                                />
                            </label>

                            <label className="text-sm">
                                <span className="mb-1 block font-medium">Değer</span>
                                <input
                                    value={value}
                                    onChange={(e) => setValue(e.target.value)}
                                    placeholder="Örn: Alüminyum"
                                    className="w-full rounded-lg border px-3 py-2"
                                />
                            </label>

                            <label className="text-sm">
                                <span className="mb-1 block font-medium">Birim</span>
                                <input
                                    value={unit}
                                    onChange={(e) => setUnit(e.target.value)}
                                    placeholder="Örn: mm, V, cc"
                                    className="w-full rounded-lg border px-3 py-2"
                                />
                            </label>

                            <label className="text-sm">
                                <span className="mb-1 block font-medium">Not</span>
                                <input
                                    value={note}
                                    onChange={(e) => setNote(e.target.value)}
                                    placeholder="İsteğe bağlı açıklama"
                                    className="w-full rounded-lg border px-3 py-2"
                                />
                            </label>
                        </div>

                        <button
                            type="button"
                            onClick={() => void addAttribute()}
                            disabled={!productId || saving}
                            className="mt-5 rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                        >
                            {saving ? "Kaydediliyor..." : "Özellik Ekle"}
                        </button>

                        {message && (
                            <p className="mt-4 text-sm font-medium">{message}</p>
                        )}
                    </div>

                    <div className="rounded-xl border bg-white p-5">
                        <h2 className="mb-4 text-lg font-semibold">
                            Kayıtlı Özellikler
                        </h2>

                        {!productId ? (
                            <p className="text-sm text-slate-500">
                                Önce bir ürün seçin.
                            </p>
                        ) : loading ? (
                            <p className="text-sm text-slate-500">
                                Özellikler yükleniyor...
                            </p>
                        ) : attributes.length === 0 ? (
                            <p className="text-sm text-slate-500">
                                Bu ürüne henüz ek özellik girilmemiş.
                            </p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b text-left">
                                            <th className="p-3">Özellik</th>
                                            <th className="p-3">Değer</th>
                                            <th className="p-3">Not</th>
                                            <th className="p-3 text-right">İşlem</th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {attributes.map((attribute) => (
                                            <tr key={attribute.id} className="border-b">
                                                <td className="p-3 font-medium">
                                                    {attribute.name}
                                                </td>

                                                <td className="p-3">
                                                    {attribute.value}
                                                    {attribute.unit
                                                        ? ` ${attribute.unit}`
                                                        : ""}
                                                </td>

                                                <td className="p-3 text-slate-500">
                                                    {attribute.note || "—"}
                                                </td>

                                                <td className="p-3 text-right">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            void deleteAttribute(attribute.id)
                                                        }
                                                        className="rounded-lg border border-red-200 px-3 py-1.5 font-medium text-red-600"
                                                    >
                                                        Sil
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </section>
            </div>
        </main>
    );
}