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
      { title: "Üye / Bayi Grupları", href: "/admin/uye-gruplari" },
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
      { title: "Kuponlar", href: "/admin/hediye-cekleri" },
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
      { title: "E-posta Ayarları", href: "/admin/mail-sms" },
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

const available = new Set(["/admin/ayarlar/seo","/admin/mail-sms","/admin/guvenlik","/admin/urunler","/admin/kategoriler","/admin/markalar","/admin/varyantlar","/admin/ek-bilgiler","/admin/ek-ozellikler","/admin/urunler/aktarim","/admin/urunler/toplu","/admin/siparisler","/admin/taslak-siparisler","/admin/iptal-iade","/admin/aktif-sepetler","/admin/terk-edilen-sepetler","/admin/terk-edilen-siparisler","/admin/sepet-hatirlatma","/admin/risk-kriterleri","/admin/musteriler","/admin/bayiler","/admin/uye-gruplari","/admin/destek-talepleri","/admin/hediye-cekleri","/admin/entegrasyonlar","/admin/istatistikler","/admin/istatistikler/siparis","/admin/istatistikler/urun","/admin/raporlar","/admin/ayarlar","/admin/kargo-ayarlari","/admin/odeme-ayarlari"]);


const navigation = menu.filter(group => group.href || group.items?.some(item => available.has(item.href)));
const links = navigation.flatMap(group => group.href ? [{title:group.title,href:group.href}] : group.items!.filter(item => available.has(item.href)));
export default function AdminLayout({children}: {children: ReactNode}) {
  const pathname = usePathname();
  const [mobileMenu, setMobileMenu] = useState(false);
  const [query, setQuery] = useState("");
  const [closedMenus, setClosedMenus] = useState<string[]>([]);
  const [openMenus, setOpenMenus] = useState<string[]>([]);
  const active = links.filter(item => pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href + "/"))).sort((a,b) => b.href.length-a.href.length)[0];
  const results = query.trim() ? links.filter(item => item.title.toLocaleLowerCase("tr-TR").includes(query.trim().toLocaleLowerCase("tr-TR"))) : [];
  function navigate() {setMobileMenu(false);setQuery("");}
  return <div className="akn-admin">
    <a className="akn-skip" href="#admin-content">İçeriğe geç</a>
    <aside className="akn-sidebar">
      <Link href="/admin" onClick={navigate} className="akn-brand"><span>AKN<span className="akn-brand-dot">.</span></span><small>MOTOSİKLET · YÖNETİM</small></Link>
      <button className="akn-menu-toggle" type="button" aria-expanded={mobileMenu} aria-controls="admin-navigation" onClick={()=>setMobileMenu(!mobileMenu)}>{mobileMenu ? "Menüyü kapat ×" : "Yönetim menüsü ☰"}</button>
      <nav id="admin-navigation" aria-label="Yönetim" className={mobileMenu ? "akn-navigation is-open" : "akn-navigation"}>
        {navigation.map((group,index) => {
          const selected = group.href ? pathname === group.href : group.items?.some(item=>item.href===active?.href);
          const opened = openMenus.includes(group.title) || (!!selected && !closedMenus.includes(group.title));
          const icon = ["M3 11 12 3l9 8v10h-6v-7H9v7H3Z","M3 7 12 3l9 4v10l-9 4-9-4Zm0 0 9 4 9-4M12 11v10","M3 3h2l3 13h10l3-9H6M9 21h.01M18 21h.01","M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M20 8v6m-3-3h6","M3 3h8l10 10-8 8L3 11ZM7 7h.01","M8 3v5H3m13 13v-5h5M3 8a9 9 0 0 1 17-2M21 16a9 9 0 0 1-17 2","M4 21V11h4v10m4 0V3h4v18m4 0v-7h3v7","M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8M12 2v3m0 14v3M2 12h3m14 0h3M5 5l2 2m10 10 2 2M5 19l2-2M17 7l2-2"][index];
          const symbol = <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={icon}/></svg>;
          return <div key={group.title} className="akn-nav-group">{group.href ? <Link href={group.href} onClick={navigate} aria-current={selected ? "page" : undefined} className={selected ? "akn-nav-heading selected" : "akn-nav-heading"}>{symbol}<span>{group.title}</span></Link> : <>
            <button type="button" className={selected ? "akn-nav-heading selected" : "akn-nav-heading"} aria-expanded={opened} onClick={()=>{setOpenMenus(old=>opened ? old.filter(x=>x!==group.title) : [...old,group.title]);setClosedMenus(old=>opened ? [...old,group.title] : old.filter(x=>x!==group.title));}}>{symbol}<span>{group.title}</span><span aria-hidden="true">{opened ? "⌄" : "›"}</span></button>
            {opened && <div className="akn-nav-items">{group.items?.filter(item=>available.has(item.href)).map(item=><Link key={item.href} href={item.href} onClick={navigate} aria-current={active?.href===item.href ? "page" : undefined}>{item.title}</Link>)}</div>}
          </>}</div>;
        })}
        <button className="akn-store-link" type="button" onClick={async()=>{try{const r=await fetch("/api/admin-session",{method:"DELETE"});if(!r.ok)throw new Error();window.location.replace("/yonetici-giris");}catch{window.alert("Çıkış yapılamadı. Tekrar deneyin.");}}}>Güvenli çıkış</button><Link className="akn-store-link" href="/">Mağazayı görüntüle ↗</Link>
      </nav>
    </aside>
    <section className="akn-workspace">
      <header className="akn-topbar">
        <div className="akn-breadcrumb">Yönetim <span>/</span> <strong>{active?.title || "Mağaza"}</strong></div>
        <div className="akn-search"><label htmlFor="admin-search" className="sr-only">Yönetim alanlarında ara</label><input id="admin-search" type="search" autoComplete="off" placeholder="Menüde ara: ürün, müşteri, ayarlar…" value={query} onChange={e=>setQuery(e.target.value)} onKeyDown={e=>{if(e.key==="Escape")setQuery("");}}/>{query.trim() && <div className="akn-search-results" aria-label="Arama sonuçları">{results.length ? results.map(item=><Link key={item.href} href={item.href} onClick={navigate}>{item.title}<span>↗</span></Link>) : <p>Eşleşen yönetim alanı bulunamadı.</p>}</div>}</div>
        <div className="akn-user"><span>AK</span><div>Yönetici<small>AKN E-Ticaret</small></div></div>
      </header>
      <div id="admin-content" className="akn-admin-content" tabIndex={-1}>{children}</div>
    </section>
  </div>;
}
