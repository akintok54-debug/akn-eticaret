"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type IdeaSoftProduct = {
    id: number;
    name?: string;
    fullName?: string;
    sku?: string;
    barcode?: string | null;
    stockAmount?: number;
    price1?: number;
    tax?: number;
    status?: number;
    brand?: {
        id?: number;
        name?: string;
    } | null;
    categories?: Array<{
        id?: number;
        name?: string;
    }>;
    images?: Array<{
        id?: number;
        filename?: string;
        thumbUrl?: string;
        originalUrl?: string;
    }>;
};

function imageUrl(product: IdeaSoftProduct) {
    const image = product.images?.[0];
    const url = image?.originalUrl || image?.thumbUrl || "";

    if (!url) return "";

    return url.startsWith("//") ? `https:${url}` : url;
}

function money(value?: number) {
    return Number(value || 0).toLocaleString("tr-TR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}

export default function IdeaSoftIntegrationPage() {
    const [products, setProducts] = useState<IdeaSoftProduct[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [importing, setImporting] = useState(false);
    const [importMessage, setImportMessage] = useState("");

    async function importProducts() {
        if (products.length === 0) {
            setError("Aktarılacak ürün bulunamadı.");
            return;
        }

        const confirmed = window.confirm(
            `${products.length} ürün AKN veritabanına aktarılacak. Devam edilsin mi?`
        );

        if (!confirmed) return;

        setImporting(true);
        setImportMessage("");
        setError("");

        try {
            const response = await fetch("/api/ideasoft/import", {
                method: "POST",
            });

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(
                    result.message || "Ürün aktarımı başarısız oldu."
                );
            }

            setImportMessage(
                `Aktarım tamamlandı: ${result.added} yeni ürün eklendi, ${result.updated} ürün güncellendi, ${result.skipped} ürün atlandı.`
            );
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Ürün aktarımı başarısız oldu."
            );
        } finally {
            setImporting(false);
        }
    }

    async function loadProducts() {
        setLoading(true);
        setError("");
        setImportMessage("");

        try {
            const response = await fetch(
                "/api/ideasoft/products?all=1",
                {
                    cache: "no-store",
                }
            );

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(
                    result.message || "IdeaSoft ürünleri alınamadı."
                );
            }

            setProducts(
                Array.isArray(result.data) ? result.data : []
            );
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "IdeaSoft bağlantı hatası."
            );
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        void loadProducts();
    }, []);

    return (
        <main className="px-5 py-8 lg:px-8 lg:py-10">
            <div className="mx-auto max-w-7xl">

                <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">

                    <div>
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                            Entegrasyonlar / IdeaSoft
                        </p>

                        <h1 className="mt-2 text-3xl font-black text-slate-950">
                            IdeaSoft Ürün Aktarımı
                        </h1>

                        <p className="mt-2 text-sm text-slate-500">
                            IdeaSoft mağazasındaki ürünleri kontrol edin
                            ve AKN ürün sistemine aktarın.
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-3">

                        <button
                            type="button"
                            onClick={loadProducts}
                            disabled={loading || importing}
                            className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {loading ? "Çekiliyor..." : "Yeniden Çek"}
                        </button>

                        <button
                            type="button"
                            onClick={importProducts}
                            disabled={
                                loading ||
                                importing ||
                                products.length === 0
                            }
                            className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {importing
                                ? "AKN'ye Aktarılıyor..."
                                : `AKN'ye Aktar (${products.length})`}
                        </button>

                        <Link
                            href="/admin/entegrasyonlar"
                            className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white"
                        >
                            Entegrasyonlara Dön
                        </Link>

                    </div>
                </div>

                <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

                    <div className="rounded-2xl border bg-white p-5 shadow-sm">
                        <div className="text-sm text-slate-500">
                            Gelen Ürün
                        </div>

                        <div className="mt-2 text-3xl font-black">
                            {products.length}
                        </div>
                    </div>

                    <div className="rounded-2xl border bg-white p-5 shadow-sm">
                        <div className="text-sm text-slate-500">
                            Görselli
                        </div>

                        <div className="mt-2 text-3xl font-black">
                            {
                                products.filter(
                                    (product) =>
                                        product.images?.length
                                ).length
                            }
                        </div>
                    </div>

                    <div className="rounded-2xl border bg-white p-5 shadow-sm">
                        <div className="text-sm text-slate-500">
                            Aktif
                        </div>

                        <div className="mt-2 text-3xl font-black">
                            {
                                products.filter(
                                    (product) =>
                                        product.status === 1
                                ).length
                            }
                        </div>
                    </div>

                    <div className="rounded-2xl border bg-white p-5 shadow-sm">
                        <div className="text-sm text-slate-500">
                            Stokta
                        </div>

                        <div className="mt-2 text-3xl font-black">
                            {
                                products.filter(
                                    (product) =>
                                        Number(
                                            product.stockAmount || 0
                                        ) > 0
                                ).length
                            }
                        </div>
                    </div>

                </section>

                {importMessage && (
                    <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-sm font-bold text-emerald-800">
                        {importMessage}
                    </div>
                )}

                {loading && (
                    <div className="mt-8 rounded-2xl border bg-white p-10 text-center font-bold">
                        IdeaSoft ürünleri çekiliyor...
                    </div>
                )}

                {error && (
                    <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm font-bold text-red-700">
                        {error}
                    </div>
                )}

                {!loading &&
                    !error &&
                    products.length > 0 && (
                        <section className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

                            <div className="border-b px-5 py-5">
                                <h2 className="text-xl font-black">
                                    IdeaSoft Ürün Önizleme
                                </h2>

                                <p className="mt-1 text-sm text-slate-500">
                                    Ürünleri kontrol ettikten sonra
                                    AKN&apos;ye Aktar butonuna basın.
                                </p>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[1000px] text-left text-sm">

                                    <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                                        <tr>
                                            <th className="px-5 py-4">
                                                Görsel
                                            </th>

                                            <th className="px-5 py-4">
                                                Ürün
                                            </th>

                                            <th className="px-5 py-4">
                                                SKU
                                            </th>

                                            <th className="px-5 py-4">
                                                Barkod
                                            </th>

                                            <th className="px-5 py-4">
                                                Marka
                                            </th>

                                            <th className="px-5 py-4">
                                                Kategori
                                            </th>

                                            <th className="px-5 py-4">
                                                Fiyat
                                            </th>

                                            <th className="px-5 py-4">
                                                Stok
                                            </th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {products.map((product) => {
                                            const src =
                                                imageUrl(product);

                                            return (
                                                <tr
                                                    key={product.id}
                                                    className="border-t border-slate-100"
                                                >
                                                    <td className="px-5 py-4">
                                                        <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-xl border bg-slate-50">

                                                            {src ? (
                                                                <img
                                                                    src={src}
                                                                    alt={
                                                                        product.name ||
                                                                        "Ürün"
                                                                    }
                                                                    className="h-full w-full object-contain"
                                                                />
                                                            ) : (
                                                                <span className="text-xs text-slate-400">
                                                                    Görsel yok
                                                                </span>
                                                            )}

                                                        </div>
                                                    </td>

                                                    <td className="px-5 py-4">
                                                        <div className="max-w-[280px] font-bold text-slate-950">
                                                            {product.name ||
                                                                product.fullName ||
                                                                "-"}
                                                        </div>

                                                        <div className="mt-1 text-xs text-slate-400">
                                                            IdeaSoft ID:{" "}
                                                            {product.id}
                                                        </div>
                                                    </td>

                                                    <td className="px-5 py-4">
                                                        {product.sku || "-"}
                                                    </td>

                                                    <td className="px-5 py-4">
                                                        {product.barcode ||
                                                            "-"}
                                                    </td>

                                                    <td className="px-5 py-4">
                                                        {product.brand?.name ||
                                                            "-"}
                                                    </td>

                                                    <td className="px-5 py-4">
                                                        {product
                                                            .categories?.[0]
                                                            ?.name || "-"}
                                                    </td>

                                                    <td className="px-5 py-4 font-bold">
                                                        {money(
                                                            product.price1
                                                        )}{" "}
                                                        TL
                                                    </td>

                                                    <td className="px-5 py-4 font-bold">
                                                        {Number(
                                                            product.stockAmount ||
                                                            0
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>

                                </table>
                            </div>
                        </section>
                    )}

                {!loading &&
                    !error &&
                    products.length === 0 && (
                        <div className="mt-8 rounded-2xl border bg-white p-10 text-center">
                            IdeaSoft&apos;tan ürün gelmedi.
                        </div>
                    )}

            </div>
        </main>
    );
}