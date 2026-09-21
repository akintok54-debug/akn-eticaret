"use client";

import Link from "next/link";
import { useProducts } from "@/context/ProductContext";
import { useOrders } from "@/context/OrderContext";
import { money } from "@/lib/store";

export default function AdminPage() {
    const { products } = useProducts();
    const { orders } = useOrders();

    const cards = [
        ["Ürünler", "Ürün, fiyat ve stok yönetimi", "/admin/urunler"],
        ["Siparişler", "Sipariş takibi ve durum güncelleme", "/admin/siparisler"],
        ["Bayi Başvuruları", "İşletme başvurularını değerlendirin", "/admin/bayiler"],
        ["Müşteriler", "Müşteri kayıtlarını görüntüleyin", "/admin/musteriler"],
        ["Ürün Aktarımı", "Dosyadan ürün aktarın", "/admin/urunler/aktarim"],
        ["Toplu İşlemler", "Fiyat ve stok güncelleyin", "/admin/urunler/toplu"],
        ["Kategoriler", "Ürün gruplarını düzenleyin", "/admin/kategoriler"],
        ["Markalar", "Katalog markalarını düzenleyin", "/admin/markalar"],
    ];

    const activeProducts = products.filter((p) => p.active).length;

    const newOrders = orders.filter(
        (o) => o.status === "Yeni"
    ).length;

    const criticalStock = products.filter(
        (p) => p.stock <= p.criticalStock
    ).length;

    const orderTotal = money(
        orders
            .filter((o) => o.status !== "İptal")
            .reduce((total, order) => total + order.total, 0)
    );

    return (
        <main className="px-5 py-8 lg:px-8 lg:py-10">
            <div className="mb-8">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Mağazanızın kontrol merkezi
                </p>

                <h1 className="mt-2 text-3xl font-bold text-slate-950">
                    Genel Bakış
                </h1>

                <p className="mt-2 text-sm text-slate-500">
                    Ürün, sipariş, müşteri ve mağaza operasyonlarını tek ekrandan yönetin.
                </p>
            </div>

            <div className="mb-8 grid grid-cols-2 gap-4 xl:grid-cols-4">
                {[
                    ["Aktif Ürün", activeProducts],
                    ["Yeni Sipariş", newOrders],
                    ["Kritik Stok", criticalStock],
                    ["Sipariş Toplamı", orderTotal],
                ].map(([title, value]) => (
                    <div
                        key={title}
                        className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                    >
                        <p className="text-xs font-medium text-slate-500">
                            {title}
                        </p>

                        <strong className="mt-3 block text-2xl font-bold text-slate-950">
                            {value}
                        </strong>
                    </div>
                ))}
            </div>

            <div className="mb-4">
                <h2 className="text-lg font-semibold text-slate-950">
                    Hızlı İşlemler
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                    En sık kullanılan yönetim alanlarına hızlı erişim.
                </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {cards.map(([title, description, href]) => (
                    <Link
                        href={href}
                        key={href}
                        className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
                    >
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <h3 className="font-semibold text-slate-950">
                                    {title}
                                </h3>

                                <p className="mt-2 text-sm leading-6 text-slate-500">
                                    {description}
                                </p>
                            </div>

                            <span className="text-slate-400 transition group-hover:text-slate-950">
                                ↗
                            </span>
                        </div>
                    </Link>
                ))}
            </div>

            <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800">
                Sipariş toplamları tahsilat raporu değildir. Havale ödemelerini banka hareketlerinden doğrulayın.
            </div>
        </main>
    );
}