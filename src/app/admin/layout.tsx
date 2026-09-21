"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode, useState } from "react";

const menu = [
  {
    title: "Ana Sayfa",
    href: "/admin",
  },
  {
    title: "Katalog",
    items: [
      { title: "Ürünler", href: "/admin/urunler" },
      { title: "Kategoriler", href: "/admin/kategoriler" },
      { title: "Markalar", href: "/admin/markalar" },
      { title: "Varyant Sistemi", href: "/admin/varyantlar" },
      { title: "Ek Bilgiler", href: "/admin/ek-bilgiler" },
      { title: "Ek Özellikler", href: "/admin/ek-ozellikler" },
      { title: "Ürün Aktarımı", href: "/admin/urunler/aktarim" },
      { title: "Toplu İşlemler", href: "/admin/urunler/toplu" },
    ],
  },
  {
    title: "Siparişler",
    items: [
      { title: "Siparişler", href: "/admin/siparisler" },
      { title: "Taslak Siparişler", href: "/admin/taslak-siparisler" },
      { title: "İptal ve İade", href: "/admin/iptal-iade" },
      { title: "Aktif Sepetler", href: "/admin/aktif-sepetler" },
      { title: "Terk Edilen Sepetler", href: "/admin/terk-edilen-sepetler" },
      { title: "Terk Edilen Siparişler", href: "/admin/terk-edilen-siparisler" },
      { title: "Sepet Hatırlatma", href: "/admin/sepet-hatirlatma" },
      { title: "Risk Kriterleri", href: "/admin/risk-kriterleri" },
    ],
  },
  {
    title: "Üye & Bayiler",
    items: [
      { title: "Müşteriler", href: "/admin/musteriler" },
      { title: "Bayi Başvuruları", href: "/admin/bayiler" },
      { title: "Üye / Bayi Grupları", href: "/admin/uye-bayi-gruplari" },
      { title: "Destek Talepleri", href: "/admin/destek-talepleri" },
    ],
  },
  {
    title: "İçerikler",
    items: [
      { title: "Sayfalar", href: "/admin/sayfalar" },
      { title: "Bloglar", href: "/admin/bloglar" },
      { title: "Anketler", href: "/admin/anketler" },
      { title: "Formlar", href: "/admin/formlar" },
      { title: "İçerik Ayarları", href: "/admin/icerik-ayarlari" },
    ],
  },
  {
    title: "Kampanyalar",
    items: [
      { title: "Hediye Çekleri", href: "/admin/hediye-cekleri" },
      { title: "Puan Sistemi", href: "/admin/puan-sistemi" },
      { title: "Puan Geçmişi", href: "/admin/puan-gecmisi" },
      { title: "POS Kampanyaları", href: "/admin/pos-kampanyalari" },
      { title: "Paket Oluşturucu", href: "/admin/paket-olusturucu" },
      { title: "Satın Alma Limiti", href: "/admin/satin-alma-limiti" },
      { title: "Hızlı Satın Al", href: "/admin/hizli-satin-al" },
    ],
  },
  {
    title: "Entegrasyonlar",
    items: [
      { title: "Entegrasyonlar", href: "/admin/entegrasyonlar" },
      { title: "Excel / CSV", href: "/admin/entegrasyonlar/excel" },
      { title: "Feed / XML", href: "/admin/entegrasyonlar/feed" },
      { title: "Google Merchant", href: "/admin/entegrasyonlar/google-merchant" },
      { title: "Facebook Katalog", href: "/admin/entegrasyonlar/facebook" },
      { title: "API Yönetimi", href: "/admin/entegrasyonlar/api" },
    ],
  },
  {
    title: "İstatistikler",
    items: [
      { title: "Özet", href: "/admin/istatistikler" },
      { title: "Sipariş", href: "/admin/istatistikler/siparis" },
      { title: "Ziyaret", href: "/admin/istatistikler/ziyaret" },
      { title: "Ürün", href: "/admin/istatistikler/urun" },
      { title: "Üyeler", href: "/admin/istatistikler/uyeler" },
      { title: "Raporlar", href: "/admin/raporlar" },
    ],
  },
  {
    title: "Ayarlar",
    items: [
      { title: "Genel Ayarlar", href: "/admin/ayarlar" },
      { title: "SEO / GEO", href: "/admin/ayarlar/seo" },
      { title: "Firma Tanımları", href: "/admin/ayarlar/firma" },
      { title: "Kullanıcılar", href: "/admin/kullanicilar" },
      { title: "Roller & Yetkiler", href: "/admin/roller-yetkiler" },
      { title: "Tasarım Ayarları", href: "/admin/tasarim-ayarlari" },
      { title: "Kargo Ayarları", href: "/admin/kargo-ayarlari" },
      { title: "Ödeme Ayarları", href: "/admin/odeme-ayarlari" },
      { title: "Mail / SMS", href: "/admin/mail-sms" },
      { title: "Döviz Kurları", href: "/admin/doviz-kurlari" },
      { title: "Güvenlik", href: "/admin/guvenlik" },
      { title: "İşlem Kayıtları", href: "/admin/audit-log" },
    ],
  },
  {
    title: "Yapay Zekâ Araçları",
    items: [
      { title: "Ürün Açıklaması Oluştur", href: "/admin/ai/urun-aciklamasi" },
      { title: "SEO Oluştur", href: "/admin/ai/seo" },
      { title: "Ürün Görseli Oluştur", href: "/admin/ai/urun-gorseli" },
      { title: "Arka Plan Temizle", href: "/admin/ai/arka-plan" },
    ],
  },
];

export default function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();

  const [openMenus, setOpenMenus] = useState<string[]>([
    "Katalog",
    "Siparişler",
    "Üye & Bayiler",
  ]);

  function toggleMenu(title: string) {
    setOpenMenus((current) =>
      current.includes(title)
        ? current.filter((item) => item !== title)
        : [...current, title]
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 lg:flex">
      <aside className="w-full border-b bg-slate-950 text-white lg:sticky lg:top-0 lg:h-screen lg:w-72 lg:flex-shrink-0 lg:overflow-y-auto lg:border-b-0 lg:border-r lg:border-slate-800">
        <div className="border-b border-slate-800 px-6 py-6">
          <div className="text-xs font-semibold tracking-[0.2em] text-slate-400">
            AKN MOTOSİKLET
          </div>

          <div className="mt-2 text-xl font-bold">
            Yönetim Paneli
          </div>
        </div>

        <nav className="space-y-2 p-4">
          {menu.map((group) => {
            if (group.href) {
              const active = pathname === group.href;

              return (
                <Link
                  key={group.title}
                  href={group.href}
                  className={`block rounded-lg px-4 py-3 text-sm font-medium transition ${active
                    ? "bg-white text-slate-950"
                    : "text-slate-300 hover:bg-slate-900 hover:text-white"
                    }`}
                >
                  {group.title}
                </Link>
              );
            }

            const opened = openMenus.includes(group.title);

            return (
              <div key={group.title}>
                <button
                  type="button"
                  onClick={() => toggleMenu(group.title)}
                  className="flex w-full items-center justify-between rounded-lg px-4 py-3 text-left text-sm font-semibold text-slate-200 hover:bg-slate-900"
                >
                  <span>{group.title}</span>
                  <span className="text-xs">
                    {opened ? "−" : "+"}
                  </span>
                </button>

                {opened && (
                  <div className="mt-1 space-y-1 pl-3">
                    {group.items.map((item) => {
                      const active =
                        pathname === item.href ||
                        pathname.startsWith(item.href + "/");

                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={`block rounded-lg px-4 py-2.5 text-sm transition ${active
                            ? "bg-red-600 text-white"
                            : "text-slate-400 hover:bg-slate-900 hover:text-white"
                            }`}
                        >
                          {item.title}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </aside>

      <section className="min-w-0 flex-1">
        <header className="sticky top-0 z-20 flex min-h-16 items-center justify-between border-b bg-white/95 px-5 backdrop-blur lg:px-8">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              AKN E-Ticaret
            </div>

            <div className="text-sm font-semibold text-slate-700">
              Yönetim
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-sm font-medium text-slate-600 hover:text-slate-950"
            >
              Mağazayı görüntüle ↗
            </Link>

            <div className="rounded-full bg-slate-950 px-3 py-2 text-xs font-semibold text-white">
              AKN
            </div>
          </div>
        </header>

        <div className="min-w-0">
          {children}
        </div>
      </section>
    </div>
  );
}