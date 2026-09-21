"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const names: Record<string, string> = {
    varyantlar: "Varyant Sistemi",
    "ek-bilgiler": "Ek Bilgiler",
    "ek-ozellikler": "Ek Özellikler",
    "taslak-siparisler": "Taslak Siparişler",
    "iptal-iade": "İptal ve İade",
    "aktif-sepetler": "Aktif Sepetler",
    "terk-edilen-sepetler": "Terk Edilen Sepetler",
    "terk-edilen-siparisler": "Terk Edilen Siparişler",
    "sepet-hatirlatma": "Sepet Hatırlatma",
    "risk-kriterleri": "Risk Kriterleri",
    "uye-bayi-gruplari": "Üye / Bayi Grupları",
    "destek-talepleri": "Destek Talepleri",
    sayfalar: "Sayfalar",
    bloglar: "Bloglar",
    anketler: "Anketler",
    formlar: "Formlar",
    "icerik-ayarlari": "İçerik Ayarları",
    "hediye-cekleri": "Hediye Çekleri",
    "puan-sistemi": "Puan Sistemi",
    "puan-gecmisi": "Puan Geçmişi",
    "pos-kampanyalari": "POS Kampanyaları",
    "paket-olusturucu": "Paket Oluşturucu",
    "satin-alma-limiti": "Satın Alma Limiti",
    "hizli-satin-al": "Hızlı Satın Al",
    entegrasyonlar: "Entegrasyonlar",
    excel: "Excel / CSV",
    feed: "Feed / XML",
    "google-merchant": "Google Merchant",
    facebook: "Facebook Katalog",
    api: "API Yönetimi",
    istatistikler: "İstatistikler",
    siparis: "Sipariş İstatistikleri",
    ziyaret: "Ziyaret İstatistikleri",
    urun: "Ürün İstatistikleri",
    uyeler: "Üye İstatistikleri",
    raporlar: "Raporlar",
    ayarlar: "Genel Ayarlar",
    seo: "SEO / GEO",
    firma: "Firma Tanımları",
    kullanicilar: "Kullanıcılar",
    "roller-yetkiler": "Roller & Yetkiler",
    "tasarim-ayarlari": "Tasarım Ayarları",
    "kargo-ayarlari": "Kargo Ayarları",
    "odeme-ayarlari": "Ödeme Ayarları",
    "mail-sms": "Mail / SMS",
    "doviz-kurlari": "Döviz Kurları",
    guvenlik: "Güvenlik",
    "audit-log": "İşlem Kayıtları",
    ai: "Yapay Zekâ Araçları",
    "urun-aciklamasi": "Ürün Açıklaması Oluştur",
    "urun-gorseli": "Ürün Görseli Oluştur",
    "arka-plan": "Arka Plan Temizleme",
};

function getTitle(pathname: string) {
    const parts = pathname.split("/").filter(Boolean);
    const last = parts[parts.length - 1];

    return names[last] || "Yönetim Modülü";
}

export default function AdminModulePlaceholder() {
    const pathname = usePathname();
    const title = getTitle(pathname);

    return (
        <main className="px-5 py-8 lg:px-8 lg:py-10">
            <div className="mx-auto max-w-5xl">
                <div className="mb-8">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                        AKN Yönetim Paneli V2
                    </p>

                    <h1 className="mt-2 text-3xl font-bold text-slate-950">
                        {title}
                    </h1>

                    <p className="mt-2 text-sm text-slate-500">
                        Bu yönetim modülü yeni AKN E-Ticaret altyapısı için hazırlanıyor.
                    </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-950 text-xl font-bold text-white">
                        AKN
                    </div>

                    <h2 className="mt-6 text-xl font-bold text-slate-950">
                        {title} hazırlanıyor
                    </h2>

                    <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
                        Bu bölüm yönetim paneline bağlandı. Gerçek işlevleri, veritabanı
                        yapısı ve yönetim ekranları sonraki geliştirme aşamalarında eklenecek.
                    </p>

                    <div className="mt-7 flex flex-wrap gap-3">
                        <Link
                            href="/admin"
                            className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                        >
                            Genel Bakışa Dön
                        </Link>

                        <Link
                            href="/"
                            className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                        >
                            Mağazayı Görüntüle
                        </Link>
                    </div>
                </div>
            </div>
        </main>
    );
}