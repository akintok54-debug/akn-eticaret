"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useProducts } from "@/context/ProductContext";

type Variant = {
    id: string;
    productId: string;
    sku: string;
    barcode: string | null;
    name: string | null;
    color: string | null;
    size: string | null;
    purchasePrice: number | null;
    retailPrice: number | null;
    dealerPrice: number | null;
    stock: number;
    image: string | null;
    active: boolean;
    product?: {
        id: string;
        name: string;
        sku: string;
        image: string | null;
    };
};

type FormState = {
    productId: string;
    name: string;
    color: string;
    size: string;
    sku: string;
    barcode: string;
    purchasePrice: string;
    retailPrice: string;
    dealerPrice: string;
    stock: string;
    image: string;
    active: boolean;
};

const emptyForm: FormState = {
    productId: "",
    name: "",
    color: "",
    size: "",
    sku: "",
    barcode: "",
    purchasePrice: "",
    retailPrice: "",
    dealerPrice: "",
    stock: "0",
    image: "",
    active: true,
};

export default function VariantsAdminPage() {
    const { products } = useProducts();

    const [variants, setVariants] = useState<Variant[]>([]);
    const [form, setForm] = useState<FormState>(emptyForm);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const filteredProducts = useMemo(() => {
        const q = search.trim().toLocaleLowerCase("tr-TR");

        if (!q) return products.slice(0, 30);

        return products
            .filter(
                (product) =>
                    product.name.toLocaleLowerCase("tr-TR").includes(q) ||
                    product.sku.toLocaleLowerCase("tr-TR").includes(q) ||
                    (product.barcode || "").toLocaleLowerCase("tr-TR").includes(q)
            )
            .slice(0, 30);
    }, [products, search]);

    const selectedProduct = products.find(
        (product) => product.id === form.productId
    );

    async function loadVariants() {
        setLoading(true);

        try {
            const response = await fetch("/api/variants", {
                cache: "no-store",
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.message || "Varyantlar alınamadı.");
            }

            setVariants(data.variants || []);
        } catch (error) {
            alert(
                error instanceof Error
                    ? error.message
                    : "Varyantlar alınamadı."
            );
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        void loadVariants();
    }, []);

    function selectProduct(productId: string) {
        const product = products.find((item) => item.id === productId);

        if (!product) return;

        setForm((current) => ({
            ...current,
            productId: product.id,
            purchasePrice: String(product.purchasePrice ?? 0),
            retailPrice: String(product.retailPrice ?? 0),
            dealerPrice: String(product.dealerPrice ?? 0),
            image: product.image || "",
        }));
    }

    function resetForm() {
        setForm(emptyForm);
        setEditingId(null);
        setSearch("");
    }

    function editVariant(variant: Variant) {
        setEditingId(variant.id);

        setForm({
            productId: variant.productId,
            name: variant.name || "",
            color: variant.color || "",
            size: variant.size || "",
            sku: variant.sku,
            barcode: variant.barcode || "",
            purchasePrice:
                variant.purchasePrice === null
                    ? ""
                    : String(variant.purchasePrice),
            retailPrice:
                variant.retailPrice === null
                    ? ""
                    : String(variant.retailPrice),
            dealerPrice:
                variant.dealerPrice === null
                    ? ""
                    : String(variant.dealerPrice),
            stock: String(variant.stock),
            image: variant.image || "",
            active: variant.active,
        });

        const product = products.find(
            (item) => item.id === variant.productId
        );

        setSearch(product?.name || "");
        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    async function saveVariant() {
        if (!form.productId) {
            alert("Önce ürün seçin.");
            return;
        }

        if (!form.sku.trim()) {
            alert("Varyant SKU zorunlu.");
            return;
        }

        setSaving(true);

        try {
            const payload = {
                ...(editingId ? { id: editingId } : {}),
                productId: form.productId,
                name: form.name.trim() || null,
                color: form.color.trim() || null,
                size: form.size.trim() || null,
                sku: form.sku.trim(),
                barcode: form.barcode.trim() || null,
                purchasePrice:
                    form.purchasePrice === ""
                        ? null
                        : Number(form.purchasePrice),
                retailPrice:
                    form.retailPrice === ""
                        ? null
                        : Number(form.retailPrice),
                dealerPrice:
                    form.dealerPrice === ""
                        ? null
                        : Number(form.dealerPrice),
                stock: Number(form.stock || 0),
                image: form.image.trim() || null,
                active: form.active,
            };

            const response = await fetch("/api/variants", {
                method: editingId ? "PATCH" : "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.message || "Varyant kaydedilemedi.");
            }

            await loadVariants();
            resetForm();
        } catch (error) {
            alert(
                error instanceof Error
                    ? error.message
                    : "Varyant kaydedilemedi."
            );
        } finally {
            setSaving(false);
        }
    }

    async function deleteVariant(id: string) {
        if (!window.confirm("Bu varyant silinsin mi?")) return;

        try {
            const response = await fetch(
                `/api/variants?id=${encodeURIComponent(id)}`,
                {
                    method: "DELETE",
                }
            );

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.message || "Varyant silinemedi.");
            }

            await loadVariants();

            if (editingId === id) {
                resetForm();
            }
        } catch (error) {
            alert(
                error instanceof Error
                    ? error.message
                    : "Varyant silinemedi."
            );
        }
    }

    return (
        <main className="min-h-screen bg-slate-100 text-slate-900">
            <header className="bg-slate-950 text-white">
                <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5">
                    <div className="font-black">AKN YÖNETİM</div>

                    <Link
                        href="/admin"
                        className="rounded-xl border border-slate-700 px-4 py-2 font-bold"
                    >
                        Yönetim Paneli
                    </Link>
                </div>
            </header>

            <div className="mx-auto max-w-7xl px-4 py-8">
                <div className="flex flex-wrap items-end justify-between gap-3">
                    <div>
                        <h1 className="text-3xl font-black">
                            Varyant Yönetimi
                        </h1>
                        <p className="mt-1 text-slate-500">
                            Ürünlere renk, beden, stok ve fiyat varyantları ekleyin.
                        </p>
                    </div>

                    <div className="rounded-xl bg-white px-4 py-2 font-bold shadow-sm">
                        {variants.length} varyant
                    </div>
                </div>

                <section className="mt-6 rounded-2xl border bg-white p-5">
                    <h2 className="text-xl font-black">
                        {editingId ? "Varyant Düzenle" : "Yeni Varyant"}
                    </h2>

                    <div className="mt-5">
                        <label className="mb-2 block text-sm font-bold">
                            Ana Ürün
                        </label>

                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Ürün adı, SKU veya barkod ara..."
                            className="w-full rounded-xl border px-4 py-3"
                        />

                        {search && !form.productId && (
                            <div className="mt-2 max-h-64 overflow-y-auto rounded-xl border">
                                {filteredProducts.map((product) => (
                                    <button
                                        key={product.id}
                                        type="button"
                                        onClick={() => {
                                            selectProduct(product.id);
                                            setSearch(product.name);
                                        }}
                                        className="flex w-full items-center gap-3 border-b p-3 text-left last:border-0 hover:bg-slate-50"
                                    >
                                        {product.image ? (
                                            <img
                                                src={product.image}
                                                alt=""
                                                className="h-12 w-12 rounded-lg object-cover"
                                            />
                                        ) : (
                                            <div className="h-12 w-12 rounded-lg bg-slate-100" />
                                        )}

                                        <div className="min-w-0">
                                            <div className="truncate font-bold">
                                                {product.name}
                                            </div>
                                            <div className="text-xs text-slate-500">
                                                SKU: {product.sku}
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}

                        {selectedProduct && (
                            <div className="mt-3 rounded-xl bg-slate-100 p-3">
                                <div className="font-black">
                                    {selectedProduct.name}
                                </div>
                                <div className="text-sm text-slate-500">
                                    Ana SKU: {selectedProduct.sku}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        <Field
                            label="Varyant Adı"
                            value={form.name}
                            onChange={(value) =>
                                setForm({ ...form, name: value })
                            }
                            placeholder="Örn: Kırmızı XL"
                        />

                        <Field
                            label="Renk"
                            value={form.color}
                            onChange={(value) =>
                                setForm({ ...form, color: value })
                            }
                            placeholder="Kırmızı"
                        />

                        <Field
                            label="Beden / Ölçü"
                            value={form.size}
                            onChange={(value) =>
                                setForm({ ...form, size: value })
                            }
                            placeholder="XL / 42 / 120"
                        />

                        <Field
                            label="Varyant SKU *"
                            value={form.sku}
                            onChange={(value) =>
                                setForm({ ...form, sku: value })
                            }
                            placeholder="SKU"
                        />

                        <Field
                            label="Barkod"
                            value={form.barcode}
                            onChange={(value) =>
                                setForm({ ...form, barcode: value })
                            }
                            placeholder="Barkod"
                        />

                        <Field
                            label="Stok"
                            type="number"
                            value={form.stock}
                            onChange={(value) =>
                                setForm({ ...form, stock: value })
                            }
                        />

                        <Field
                            label="Alış Fiyatı"
                            type="number"
                            value={form.purchasePrice}
                            onChange={(value) =>
                                setForm({ ...form, purchasePrice: value })
                            }
                        />

                        <Field
                            label="Perakende Fiyatı"
                            type="number"
                            value={form.retailPrice}
                            onChange={(value) =>
                                setForm({ ...form, retailPrice: value })
                            }
                        />

                        <Field
                            label="Bayi Fiyatı"
                            type="number"
                            value={form.dealerPrice}
                            onChange={(value) =>
                                setForm({ ...form, dealerPrice: value })
                            }
                        />

                        <div className="md:col-span-2">
                            <Field
                                label="Görsel URL"
                                value={form.image}
                                onChange={(value) =>
                                    setForm({ ...form, image: value })
                                }
                                placeholder="https://..."
                            />
                        </div>

                        <label className="flex items-center gap-3 rounded-xl border px-4 py-3">
                            <input
                                type="checkbox"
                                checked={form.active}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        active: e.target.checked,
                                    })
                                }
                                className="h-5 w-5"
                            />
                            <span className="font-bold">Aktif varyant</span>
                        </label>
                    </div>

                    <div className="mt-6 flex flex-wrap gap-2">
                        <button
                            type="button"
                            disabled={saving}
                            onClick={saveVariant}
                            className="rounded-xl bg-red-600 px-6 py-3 font-black text-white disabled:opacity-50"
                        >
                            {saving
                                ? "Kaydediliyor..."
                                : editingId
                                    ? "Değişiklikleri Kaydet"
                                    : "Varyant Ekle"}
                        </button>

                        {editingId && (
                            <button
                                type="button"
                                onClick={resetForm}
                                className="rounded-xl border px-6 py-3 font-bold"
                            >
                                İptal
                            </button>
                        )}
                    </div>
                </section>

                <section className="mt-6 overflow-hidden rounded-2xl border bg-white">
                    <div className="border-b p-5">
                        <h2 className="text-xl font-black">
                            Kayıtlı Varyantlar
                        </h2>
                    </div>

                    {loading ? (
                        <div className="p-8 text-center text-slate-500">
                            Yükleniyor...
                        </div>
                    ) : variants.length === 0 ? (
                        <div className="p-8 text-center text-slate-500">
                            Henüz varyant eklenmedi.
                        </div>
                    ) : (
                        variants.map((variant) => (
                            <div
                                key={variant.id}
                                className="flex flex-col gap-4 border-b p-4 last:border-0 lg:flex-row lg:items-center lg:justify-between"
                            >
                                <div className="flex min-w-0 items-center gap-4">
                                    {variant.image || variant.product?.image ? (
                                        <img
                                            src={variant.image || variant.product?.image || ""}
                                            alt=""
                                            className="h-16 w-16 rounded-xl object-cover"
                                        />
                                    ) : (
                                        <div className="h-16 w-16 rounded-xl bg-slate-100" />
                                    )}

                                    <div className="min-w-0">
                                        <div className="font-black">
                                            {variant.product?.name || "Ürün"}
                                        </div>

                                        <div className="mt-1 text-sm text-slate-600">
                                            {[variant.color, variant.size, variant.name]
                                                .filter(Boolean)
                                                .join(" • ") || "Standart varyant"}
                                        </div>

                                        <div className="mt-1 text-xs text-slate-500">
                                            SKU: {variant.sku} • Stok: {variant.stock}
                                            {" • "}
                                            {variant.active ? "Aktif" : "Pasif"}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => editVariant(variant)}
                                        className="rounded-lg bg-slate-900 px-4 py-2 font-bold text-white"
                                    >
                                        Düzenle
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => deleteVariant(variant.id)}
                                        className="rounded-lg border border-red-200 px-4 py-2 font-bold text-red-600"
                                    >
                                        Sil
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </section>
            </div>
        </main>
    );
}

function Field({
    label,
    value,
    onChange,
    placeholder,
    type = "text",
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    type?: string;
}) {
    return (
        <label className="block">
            <span className="mb-2 block text-sm font-bold">{label}</span>
            <input
                type={type}
                min={type === "number" ? 0 : undefined}
                step={type === "number" ? "0.01" : undefined}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="w-full rounded-xl border px-4 py-3"
            />
        </label>
    );
}