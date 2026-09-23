"use client";
import Image from "next/image";
import Link from "next/link";
import StoreHeader from "@/components/layout/StoreHeader";
import StoreFooter from "@/components/layout/StoreFooter";
import StoreProductCard from "@/components/product/StoreProductCard";
import { useProducts } from "@/context/ProductContext";
import { store } from "@/lib/store";
export default function Home() {
 const { products, loaded, error, refreshProducts } = useProducts();
 const featured = products.filter(p=>p.active).slice(0,4);
 return <><StoreHeader/><main id="main-content" className="store-container home-content">
 <section className="store-hero"><Image src="/akn-workshop.png" alt="Atölyede motosiklet" fill priority sizes="(max-width: 1280px) 100vw, 1280px" className="hero-image"/><div className="hero-shade"/><div className="hero-copy"><div className="eyebrow"><span/> YOLA HAZIR MISIN?</div><h1>Tutkun aynı.<br/>Parçan <em>AKN.</em></h1><p>Bakımından performansına, motosikletin için<br className="desktop-break"/> aradığın yedek parça ve aksesuarlar.</p><Link href="/urunler" className="button-red">Ürünleri keşfet <span>↗</span></Link><div className="hero-caption">YEDEK PARÇA <i/> BAKIM <i/> AKSESUAR</div></div><span className="hero-index">AKN / MOTO ESSENTIALS</span></section>
 <section className="benefit-strip" aria-label="Alışveriş avantajları">{[["01","Aradığın parçayı bul","Marka, kategori veya stok koduyla ara"],["02","Stoktan alışveriş","Güncel ürün ve stok bilgileri"],["03","Siparişini takip et","Sipariş durumuna kolayca ulaş"],["04","İşletmene özel","Bayi başvurusu ile iş birliği"]].map(([n,t,d])=><div key={n}><span>{n}</span><div><strong>{t}</strong><p>{d}</p></div></div>)}</section>
 <section className="home-section"><div className="section-heading"><div><span className="overline">MOTOSİKLETİN İÇİN HER ŞEY</span><h2>Doğru parçaya, kolayca.</h2></div><Link href="/kategoriler">Tüm kategoriler ↗</Link></div><div className="category-tiles">{store.categories.map((c,i)=><Link href={`/urunler?category=${encodeURIComponent(c)}`} key={c}><span className="category-number">0{i+1}</span><span className="category-symbol" aria-hidden="true">{["⚙","◉","⛓","◈","ϟ","◎"][i]}</span><strong>{c}</strong><span className="category-arrow">↗</span></Link>)}</div></section>
 <section className="home-section"><div className="section-heading"><div><span className="overline">AKN KATALOĞU</span><h2>Yolculuğun eksik parçaları.</h2></div><Link href="/urunler">Tüm ürünler ↗</Link></div>{!loaded ? <div className="catalog-message" role="status">Ürünler yükleniyor…</div> : error ? <div className="catalog-message" role="alert">{error} <button onClick={()=>void refreshProducts()}>Tekrar dene</button></div> : featured.length ? <div className="product-grid">{featured.map(p=><StoreProductCard key={p.id} product={p}/>)}</div> : <div className="catalog-message">Kataloğumuz güncelleniyor. Ürünler yakında burada.</div>}</section>
 <section className="workshop-banner"><div><span className="overline">BİRLİKTE DAHA İLERİYE</span><h2>Sen işine odaklan.<br/>Parça tedarikini bize bırak.</h2><p>Servis, yedek parça mağazası veya motosiklet işletmesi misin?</p></div><Link href="/bayi" className="button-dark">Bayi başvurusu yap ↗</Link></section>
 </main><StoreFooter/></>;
}
