"use client";

import Link from "next/link";

const integrations = [
    {
        name: "IdeaSoft",
        description:
            "Ürün, kategori, marka, stok, fiyat, görsel ve sipariş verilerini IdeaSoft ile senkronize edin.",
        status: "Bağlantı Bekliyor",
        type: "Kaynak Sistem",
        href: "/admin/entegrasyonlar/ideasoft",
    },
    {
        name: "Google Merchant",
        description:
            "Ürün kataloğunu Google Merchant Center'a gönderin ve fiyat/stok verilerini güncel tutun.",
        status: "Hazırlanıyor",
        type: "Satış Kanalı",
        href: "/admin/entegrasyonlar/google-merchant",
    },
    {
        name: "Meta / Facebook Katalog",
        description:
            "Facebook ve Instagram katalogları için ürün feedlerini yönetin.",
        status: "Hazırlanıyor",
        type: "Satış Kanalı",
        href: "/admin/entegrasyonlar/facebook",
    },
    {
        name: "Excel / CSV",
        description:
            "Ürünleri toplu içe aktarın, dışa aktarın ve şablonlarla veri taşıyın.",
        status: "Kullanılabilir",
        type: "Dosya Aktarımı",
        href: "/admin/urunler/aktarim",
    },
    {
        name: "Feed / XML",
        description:
            "Bayi, pazaryeri ve harici sistemler için XML ve CSV ürün çıktıları oluşturun.",
        status: "Hazırlanıyor",
        type: "Ürün Çıktısı",
        href: "/admin/entegrasyonlar/feed",
    },
    {
        name: "API Yönetimi",
        description:
            "Harici uygulamaların AKN E-Ticaret sistemine güvenli erişimini yönetin.",
        status: "Hazırlanıyor",
        type: "Geliştirici",
        href: "/admin/entegrasyonlar/api",
    },
];

const feeds = [
    {
        id: 1,
        name: "Google Merchant Ürün Çıktısı",
        format: "XML",
        info: "Google Merchant uyumlu ürün kataloğu",
        status: "Taslak",
    },
    {
        id: 2,
        name: "Meta Katalog Çıktısı",
        format: "XML",
        info: "Facebook / Instagram ürün kataloğu",
        status: "Taslak",
    },
    {
        id: 3,
        name: "AKN Bayi Ürün Çıktısı",
        format: "XML",
        info: "Bayilere özel ürün, fiyat ve stok çıktısı",
        status: "Taslak",
    },
    {
        id: 4,
        name: "AKN Ürün CSV Çıktısı",
        format: "CSV",
        info: "Toplu ürün aktarım çıktısı",
        status: "Kullanılabilir",
    },
];

export default function IntegrationsPage() {
    return (
        <main className="px-5 py-8 lg:px-8 lg:py-10">
            <div className="mx-auto max-w-7xl">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                            Sistem Bağlantıları
                        </p>

                        <h1 className="mt-2 text-3xl font-black text-slate-950">
                            Entegrasyonlar
                        </h1>

                        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
                            IdeaSoft, Google Merchant, Meta, XML, Excel ve API bağlantılarını
                            tek merkezden yönetin.
                        </p>
                    </div>

                    <Link
                        href="/admin/entegrasyonlar/ideasoft"
                        className="rounded-xl bg-red-600 px-5 py-3 text-sm font-black text-white shadow-sm hover:bg-red-700"
                    >
                        + IdeaSoft Bağlantısı
                    </Link>
                </div>

                <section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {integrations.map((item) => (
                        <article
                            key={item.name}
                            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                        {item.type}
                                    </div>

                                    <h2 className="mt-2 text-xl font-black text-slate-950">
                                        {item.name}
                                    </h2>
                                </div>

                                <span
                                    className={
                                        item.status === "Kullanılabilir"
                                            ? "rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700"
                                            : "rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700"
                                    }
                                >
                                    {item.status}
                                </span>
                            </div>

                            <p className="mt-4 min-h-16 text-sm leading-6 text-slate-500">
                                {item.description}
                            </p>

                            <Link
                                href={item.href}
                                className="mt-5 inline-block rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-bold text-white hover:bg-slate-800"
                            >
                                Yönet
                            </Link>
                        </article>
                    ))}
                </section>

                <section className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="flex items-center justify-between border-b border-slate-200 px-5 py-5">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                Ürün Feedleri
                            </p>

                            <h2 className="mt-1 text-xl font-black text-slate-950">
                                Ürün Çıktıları
                            </h2>
                        </div>

                        <Link
                            href="/admin/entegrasyonlar/feed"
                            className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-bold text-white"
                        >
                            + Yeni Çıktı
                        </Link>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[800px] text-left text-sm">
                            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                                <tr>
                                    <th className="px-5 py-4">ID</th>
                                    <th className="px-5 py-4">Adı</th>
                                    <th className="px-5 py-4">Format</th>
                                    <th className="px-5 py-4">Bilgi</th>
                                    <th className="px-5 py-4">Durum</th>
                                    <th className="px-5 py-4 text-right">İşlem</th>
                                </tr>
                            </thead>

                            <tbody>
                                {feeds.map((feed) => (
                                    <tr
                                        key={feed.id}
                                        className="border-t border-slate-100"
                                    >
                                        <td className="px-5 py-4">{feed.id}</td>

                                        <td className="px-5 py-4 font-bold">
                                            {feed.name}
                                        </td>

                                        <td className="px-5 py-4">
                                            <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-bold">
                                                {feed.format}
                                            </span>
                                        </td>

                                        <td className="px-5 py-4 text-slate-500">
                                            {feed.info}
                                        </td>

                                        <td className="px-5 py-4">
                                            {feed.status}
                                        </td>

                                        <td className="px-5 py-4 text-right">
                                            <Link
                                                href="/admin/entegrasyonlar/feed"
                                                className="font-bold text-red-600"
                                            >
                                                Yönet
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>

                <section className="mt-8 rounded-2xl bg-slate-950 p-6 text-white">
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                İlk Senkronizasyon
                            </p>

                            <h2 className="mt-2 text-2xl font-black">
                                IdeaSoft → AKN E-Ticaret
                            </h2>

                            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
                                IdeaSoft mağazasındaki ürünleri önce önizleyip ardından AKN
                                E-Ticaret veritabanına aktaracağız.
                            </p>
                        </div>

                        <Link
                            href="/admin/entegrasyonlar/ideasoft"
                            className="rounded-xl bg-white px-5 py-3 text-sm font-black text-slate-950"
                        >
                            IdeaSoft&apos;tan Ürünleri Çek
                        </Link>
                    </div>
                </section>
            </div>
        </main>
    );
}