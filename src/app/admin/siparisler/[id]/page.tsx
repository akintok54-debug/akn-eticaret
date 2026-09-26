"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { money } from "@/lib/store";

type Item={id?:string;name:string;productName?:string;sku?:string;price:number;unitPrice?:number;quantity:number;lineTotal?:number};
type Order={id:string;orderNumber:string;createdAt:string;status:string;paymentStatus?:string;paymentMethod:string;customer:{fullName:string;phone:string;email:string};delivery:{city:string;district:string;address:string};invoice:{type:string;companyName:string;taxOffice:string;taxNumber:string};shippingCompany?:string;trackingNumber?:string;subtotal?:number;shippingTotal?:number;discountTotal?:number;total:number;items:Item[]};

export default function OrderDetail({params}:{params:Promise<{id:string}>}){
 const [id,setId]=useState("");
 const [order,setOrder]=useState<Order|null>(null);
 const [error,setError]=useState("");
 useEffect(()=>{params.then(x=>setId(x.id));},[params]);
 useEffect(()=>{if(!id)return;fetch("/api/orders/"+id,{cache:"no-store"}).then(async r=>{const d=await r.json();if(!r.ok)throw Error(d.message||"Sipariş alınamadı.");return d.order;}).then(setOrder).catch(e=>setError(e.message));},[id]);
 if(error)return <main className="p-6"><p className="notice error-notice">{error}</p></main>;
 if(!order)return <main className="p-6">Sipariş yükleniyor…</main>;
 const paid=order.paymentStatus==="paid";
 return <main className="p-4 md:p-7 print:p-0">
  <div className="max-w-6xl mx-auto">
   <div className="print:hidden flex flex-wrap items-center justify-between gap-3 mb-6">
    <div><Link href="/admin/siparisler" className="text-sm underline">← Siparişlere dön</Link><h1 className="text-3xl font-black mt-3">Sipariş Detayı</h1></div>
    <div className="flex flex-wrap gap-2">
     <button onClick={()=>window.print()} className="button-dark">Sipariş Detayını Yazdır</button>
     <Link href={"/admin/siparisler/"+order.id+"/fatura"} className="button-dark">Fatura Çıktısı</Link>
    </div>
   </div>
   <section className="bg-white border rounded-xl overflow-hidden print:border-0">
    <div className="p-5 md:p-7 border-b flex flex-wrap justify-between gap-4">
     <div><div className="text-xs text-slate-500">SİPARİŞ NO</div><h2 className="text-2xl font-black mt-1">{order.orderNumber}</h2><p className="text-sm text-slate-500 mt-2">{new Date(order.createdAt).toLocaleString("tr-TR")}</p></div>
     <div className="text-right"><div className="text-xs text-slate-500">TOPLAM</div><strong className="text-2xl">{money(order.total)}</strong><p className="text-sm mt-2">{paid?"Tahsil edildi":"Ödeme bekleniyor"}</p></div>
    </div>
    <div className="grid md:grid-cols-2 gap-0">
     <section className="p-5 md:p-7 border-b md:border-b-0 md:border-r"><h3 className="font-bold mb-4">Müşteri & Teslimat</h3><p><b>{order.customer.fullName}</b></p><p>{order.customer.phone}</p><p>{order.customer.email}</p><p className="mt-4">{order.delivery.address}<br/>{order.delivery.district} / {order.delivery.city}</p></section>
     <section className="p-5 md:p-7"><h3 className="font-bold mb-4">Ödeme & Kargo</h3><p>Ödeme: <b>{order.paymentMethod==="sipay"?"Kredi/Banka Kartı (Sipay)":"Havale / EFT"}</b></p><p>Durum: <b>{order.status}</b></p><p>Kargo: {order.shippingCompany||"Henüz seçilmedi"}</p><p>Takip No: {order.trackingNumber||"—"}</p></section>
    </div>
    <div className="overflow-x-auto border-t">
     <table className="w-full text-sm"><thead><tr className="bg-slate-50 text-left"><th className="p-3">Stok Kodu</th><th className="p-3">Ürün</th><th className="p-3 text-right">Adet</th><th className="p-3 text-right">Birim</th><th className="p-3 text-right">Tutar</th></tr></thead><tbody>{order.items.map((i,n)=>{const price=i.price??i.unitPrice??0;return <tr key={i.id||n} className="border-t"><td className="p-3">{i.sku||"—"}</td><td className="p-3 font-medium">{i.name||i.productName}</td><td className="p-3 text-right">{i.quantity}</td><td className="p-3 text-right">{money(price)}</td><td className="p-3 text-right">{money(i.lineTotal??price*i.quantity)}</td></tr>})}</tbody></table>
    </div>
    <div className="p-5 md:p-7 border-t ml-auto max-w-md text-sm space-y-2">
     <div className="flex justify-between"><span>Ara toplam</span><b>{money(order.subtotal??order.total)}</b></div>
     <div className="flex justify-between"><span>İndirim</span><b>-{money(order.discountTotal??0)}</b></div>
     <div className="flex justify-between"><span>Kargo</span><b>{money(order.shippingTotal??0)}</b></div>
     <div className="flex justify-between text-lg border-t pt-3"><span>Genel toplam</span><b>{money(order.total)}</b></div>
    </div>
   </section>
  </div>
 </main>
}
