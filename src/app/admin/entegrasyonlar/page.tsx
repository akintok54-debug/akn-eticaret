"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { integrationItems } from "@/lib/integrations";

type State={enabled:boolean;configured:string[]};
export default function IntegrationsPage(){
 const [states,setStates]=useState<Record<string,State>>({});
 useEffect(()=>{fetch("/api/integrations",{cache:"no-store"}).then(r=>r.ok?r.json():null).then(d=>{if(d?.integrations)setStates(Object.fromEntries(d.integrations.map((x:State&{slug:string})=>[x.slug,x])));}).catch(()=>{});},[]);
 return <main className="px-5 py-8 lg:px-8 lg:py-10"><div className="mx-auto max-w-7xl">
  <div><p className="text-xs font-bold uppercase tracking-[.18em] text-slate-400">Sistem Bağlantıları</p><h1 className="mt-2 text-3xl font-black">Entegrasyon Merkezi</h1><p className="mt-2 max-w-3xl text-sm text-slate-500">Satış kanalları, reklam ölçümü, analitik ve ürün feedlerini tek merkezden yönetin.</p></div>
  <section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
   <Card name="IdeaSoft" type="Kaynak Sistem" description="Ürün, stok, fiyat ve görselleri IdeaSoft ile senkronize edin." href="/admin/entegrasyonlar/ideasoft" status="Kullanılabilir"/>
   {integrationItems.map(item=><Card key={item.slug} name={item.name} type={item.type} description={item.description} href={"/admin/entegrasyonlar/"+item.slug} status={item.mode==="feed"?"Feed Hazır":states[item.slug]?.enabled?"Bağlı":states[item.slug]?.configured?.length?"Yapılandırıldı":"Kurulum Bekliyor"}/>)}
  </section>
  <section className="mt-8 rounded-2xl border bg-white p-6 shadow-sm"><h2 className="text-xl font-black">Canlı ürün feedleri</h2><p className="mt-2 text-sm text-slate-500">Bu adresler ürün, fiyat ve stok verisini veritabanından otomatik üretir.</p><div className="mt-5 grid gap-3 md:grid-cols-2"><Feed title="Google Merchant" url="/api/feeds/google"/><Feed title="Meta Katalog" url="/api/feeds/meta"/></div></section>
 </div></main>;
}
function Card(p:{name:string;type:string;description:string;href:string;status:string}){return <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="text-xs font-bold uppercase tracking-wider text-slate-400">{p.type}</div><h2 className="mt-2 text-xl font-black">{p.name}</h2><span className="mt-3 inline-block rounded-full bg-slate-100 px-3 py-1 text-xs font-bold">{p.status}</span><p className="mt-4 min-h-16 text-sm leading-6 text-slate-500">{p.description}</p><Link href={p.href} className="mt-5 inline-block rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-bold text-white">Yönet</Link></article>}
function Feed({title,url}:{title:string;url:string}){return <div className="rounded-xl bg-slate-50 p-4"><strong>{title}</strong><div className="mt-2 break-all text-xs text-slate-500">{url}</div><a className="mt-3 inline-block text-sm font-bold text-red-600" href={url} target="_blank">Feed'i aç ↗</a></div>}
