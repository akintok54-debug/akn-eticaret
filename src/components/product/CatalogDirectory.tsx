"use client";
import Link from "next/link";
import StoreHeader from "@/components/layout/StoreHeader";
import StoreFooter from "@/components/layout/StoreFooter";
import { useProducts } from "@/context/ProductContext";
export default function CatalogDirectory({kind}:{kind:"category"|"brand"}) {
 const {products,loaded,error,refreshProducts}=useProducts();
 const active=products.filter(p=>p.active);
 const entries=Array.from(new Set(active.map(p=>p[kind]))).filter(Boolean).sort((a,b)=>a.localeCompare(b,"tr"));
 const title=kind==="category"?"Kategoriler":"Markalar";
 return <><StoreHeader/><main className="store-container"><div className="page-heading"><p><Link href="/">Ana sayfa</Link> / {title}</p><span className="overline">AKN KATALOĞU</span><h1>{title}</h1></div>{error?<div className="catalog-message mb-12" role="alert">{error}<button onClick={()=>void refreshProducts()}>Tekrar dene</button></div>:!loaded?<div className="catalog-message mb-12" role="status">Yükleniyor…</div>:entries.length?<div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">{entries.map(entry=><Link key={entry} href={`/urunler?${kind}=${encodeURIComponent(entry)}`} className="form-panel hover:border-red-400"><h2>{entry} ↗</h2><p className="text-xs text-slate-400">{active.filter(p=>p[kind]===entry).length} ürün</p></Link>)}</div>:<div className="catalog-message mb-12">Kataloğumuz güncelleniyor.</div>}</main><StoreFooter/></>;
}
