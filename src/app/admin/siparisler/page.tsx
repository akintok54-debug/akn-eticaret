"use client";
import Link from "next/link";
import {useMemo,useState} from "react";
import {useOrders} from "@/context/OrderContext";
import {money} from "@/lib/store";

const statuses=["","Yeni","Hazırlanıyor","Kargoda","Tamamlandı","İptal","İade","Taslak"] as const;

export default function AdminOrdersPage(){
 const {orders,error,loaded,refreshOrders,hasMore,loadingMore,loadMoreOrders}=useOrders();
 const [search,setSearch]=useState(""),[status,setStatus]=useState("");
 const q=search.trim().toLocaleLowerCase("tr-TR");
 const rows=useMemo(()=>orders.filter(o=>(!status||o.status===status)&&(!q||[
  o.id,o.orderNumber,o.customer.fullName,o.customer.phone,o.customer.email,o.delivery.city,o.delivery.district
 ].some(v=>(v||"").toLocaleLowerCase("tr-TR").includes(q)))),[orders,status,q]);
 const counts=useMemo(()=>Object.fromEntries(statuses.filter(Boolean).map(s=>[s,orders.filter(o=>o.status===s).length])),[orders]);
 return <main className="p-4 sm:p-7"><div className="max-w-[1500px] mx-auto">
  <div className="flex flex-wrap items-end justify-between gap-4 mb-6"><div><p className="text-xs text-slate-500">Siparişler</p><h1 className="text-3xl font-black mt-1">Sipariş Yönetimi</h1><p className="text-sm text-slate-500 mt-2">Sipariş, müşteri, ödeme, kargo ve fatura işlemlerini tek ekrandan yönetin.</p></div><button className="button-dark" onClick={()=>void refreshOrders()}>Yenile</button></div>
  {error&&<p className="notice error-notice mb-5">{error}</p>}
  <div className="flex gap-2 overflow-x-auto pb-3 mb-3">{statuses.map(s=><button key={s||"all"} onClick={()=>setStatus(s)} className={"whitespace-nowrap rounded border px-4 py-2 text-sm "+(status===s?"bg-slate-900 text-white":"bg-white")}>{s||"Tümü"}{s&&<span className="ml-2 text-xs opacity-70">{counts[s]||0}</span>}</button>)}</div>
  <div className="form-panel mb-4 flex flex-wrap gap-3 items-center"><input aria-label="Sipariş ara" className="rounded border p-3 min-w-[280px] flex-1" placeholder="Sipariş no, müşteri, telefon, e-posta, şehir ara…" value={search} onChange={e=>setSearch(e.target.value)}/><span className="text-sm text-slate-500">{rows.length} kayıt</span></div>
  {!loaded?<p className="catalog-message">Siparişler yükleniyor…</p>:!rows.length?<p className="catalog-message">Sipariş bulunamadı.</p>:<div className="overflow-x-auto rounded-xl border bg-white">
   <table className="w-full min-w-[1180px] text-sm"><thead><tr className="bg-slate-50 text-left"><th className="p-3">ID</th><th className="p-3">Ref No</th><th className="p-3">Adı Soyadı</th><th className="p-3">Sipariş Durumu</th><th className="p-3">Ödeme Türü</th><th className="p-3">Ödeme Durumu</th><th className="p-3">Sipariş Tarihi</th><th className="p-3 text-right">Toplam</th><th className="p-3">Telefon</th><th className="p-3">Şehir</th><th className="p-3">İşlem</th></tr></thead>
   <tbody>{rows.map(o=><tr key={o.id+o.status+o.paymentStatus} className="border-t hover:bg-slate-50/70"><td className="p-3 text-xs text-slate-500">{o.id.slice(-8).toUpperCase()}</td><td className="p-3"><Link href={"/admin/siparisler/"+o.id} className="font-bold underline">{o.orderNumber}</Link></td><td className="p-3"><b>{o.customer.fullName}</b><div className="text-xs text-slate-500">{o.customer.email}</div></td><td className="p-3"><span className="rounded bg-slate-100 px-2 py-1 font-medium">{o.status}</span></td><td className="p-3">{o.paymentMethod==="sipay"?"Kredi / Banka Kartı":"Havale / EFT"}</td><td className="p-3">{o.paymentStatus==="paid"?"Tahsil edildi":o.paymentStatus==="refunded"?"İade edildi":"Ödeme bekleniyor"}</td><td className="p-3">{new Date(o.createdAt).toLocaleString("tr-TR")}</td><td className="p-3 text-right font-bold whitespace-nowrap">{money(o.total)}</td><td className="p-3">{o.customer.phone}</td><td className="p-3">{o.delivery.city}</td><td className="p-3"><Link href={"/admin/siparisler/"+o.id} className="button-dark">Detay</Link></td></tr>)}</tbody>
   </table>
  </div>}
  {hasMore&&<button className="button-dark mt-5" disabled={loadingMore} onClick={()=>void loadMoreOrders()}>{loadingMore?"Yükleniyor…":"Önceki siparişleri yükle"}</button>}
 </div></main>;
}
