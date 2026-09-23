"use client";

import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import { useState } from "react";
import StoreHeader from "@/components/layout/StoreHeader";
import StoreFooter from "@/components/layout/StoreFooter";
import AddToCart from "@/components/AddToCart";
import { useProducts } from "@/context/ProductContext";
import { money } from "@/lib/store";

export default function ProductDetailPage() {
    const { id } = useParams<{ id: string }>();
    const { products, loaded, error } = useProducts();
    const [imageOpen, setImageOpen] = useState(false);

    const p = products.find(
        (product) => product.id === id && product.active
    );

    return (
        <>
            <StoreHeader />

            <main className="store-container">
                <div className="page-heading">
                    <p>
                        <Link href="/">Ana sayfa</Link> /{" "}
                        <Link href="/urunler">Ürünler</Link> /{" "}
                        {p?.name ?? "Ürün"}
                    </p>
                </div>

                {!loaded ? (
                    <div className="catalog-message mb-12" role="status">
                        Ürün yükleniyor…
                    </div>
                ) : error ? (
                    <div className="catalog-message mb-12" role="alert">
                        {error}
                    </div>
                ) : !p ? (
                    <div className="catalog-message mb-12">
                        Ürün bulunamadı.{" "}
                        <Link href="/urunler" className="underline">
                            Kataloğa dönün.
                        </Link>
                    </div>
                ) : (
                    <>
                        <div className="grid md:grid-cols-2 gap-10 mb-10">
                            <div
                                className={`relative aspect-square rounded-lg bg-slate-50 flex items-center justify-center ${p.image ? "cursor-zoom-in" : ""
                                    }`}
                                onClick={() => {
                                    if (p.image) setImageOpen(true);
                                }}
                            >
                                {p.image ? (
                                    <Image
                                        src={p.image}
                                        alt={p.name}
                                        fill
                                        unoptimized
                                        sizes="(max-width:700px) 100vw, 50vw"
                                        style={{
                                            objectFit: "contain",
                                            padding: 35,
                                        }}
                                    />
                                ) : (
                                    <div className="text-center text-slate-400">
                                        <span className="text-5xl block font-black">
                                            AKN
                                        </span>

                                        <span className="text-sm block mt-4">
                                            Ürün görseli hazırlanıyor
                                        </span>
                                    </div>
                                )}
                            </div>

                            <div>
                                <Link
                                    href={`/urunler?brand=${encodeURIComponent(
                                        p.brand
                                    )}`}
                                    className="overline"
                                >
                                    {p.brand}
                                </Link>

                                <h1 className="text-3xl lg:text-4xl font-bold mt-4 leading-tight">
                                    {p.name}
                                </h1>

                                <p className="text-xs text-slate-400 mt-4">
                                    Stok kodu: {p.sku} · {p.category}
                                </p>

                                <p className="text-sm text-slate-600 mt-6 leading-7">
                                    {p.description}
                                </p>

                                <p className="text-sm text-emerald-700 mt-6">
                                    {p.stock > 0
                                        ? `● ${p.stock} adet stokta`
                                        : "Stokta yok"}
                                </p>

                                <strong className="text-4xl block mt-3">
                                    {money(p.retailPrice)}
                                </strong>

                                <span className="text-xs text-slate-400">
                                    KDV dahil
                                </span>

                                <AddToCart
                                    product={{
                                        id: p.id,
                                        name: p.name,
                                        price: p.retailPrice,
                                        image: p.image,
                                        stock: p.stock,
                                    }}
                                />

                                <div className="notice mt-7">
                                    Sipariş öncesinde parçanın motosikletinizin
                                    marka, model ve üretim yılıyla uyumunu kontrol
                                    edin.
                                </div>
                            </div>
                        </div>

                        <div className="form-panel mb-12">
                            <h2>Ürün bilgileri</h2>

                            <dl className="grid grid-cols-2 sm:grid-cols-4 gap-5 text-sm">
                                <div>
                                    <dt className="text-slate-400">Marka</dt>
                                    <dd className="mt-2">{p.brand}</dd>
                                </div>

                                <div>
                                    <dt className="text-slate-400">Kategori</dt>
                                    <dd className="mt-2">{p.category}</dd>
                                </div>

                                <div>
                                    <dt className="text-slate-400">Stok kodu</dt>
                                    <dd className="mt-2">{p.sku}</dd>
                                </div>

                                <div>
                                    <dt className="text-slate-400">Barkod</dt>
                                    <dd className="mt-2">
                                        {p.barcode || "Belirtilmedi"}
                                    </dd>
                                </div>
                            </dl>
                        </div>

                        {imageOpen && p.image && (
                            <div
                                className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 p-4"
                                onClick={() => setImageOpen(false)}
                            >
                                <button
                                    type="button"
                                    onClick={() => setImageOpen(false)}
                                    className="absolute right-5 top-5 z-10 h-12 w-12 rounded-full bg-white text-2xl font-black text-black"
                                    aria-label="Kapat"
                                >
                                    ×
                                </button>

                                <div
                                    className="relative h-[90vh] w-[95vw]"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <Image
                                        src={p.image}
                                        alt={p.name}
                                        fill
                                        unoptimized
                                        sizes="95vw"
                                        style={{ objectFit: "contain" }}
                                    />
                                </div>
                            </div>
                        )}
                    </>
                )}
            </main>

            <StoreFooter />
        </>
    );
}
