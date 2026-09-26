"use client";
import { useEffect, useMemo, useState } from "react";
import { money } from "@/lib/store";

type Item={id?:string;name:string;productName?:string;sku?:string;barcode?:string|null;price:number;unitPrice?:number;quantity:number;lineTotal?:number;vatRate?:number};
type Order={id:string;orderNumber:string;createdAt:string;customer:{fullName:string;phone:string;email:string};delivery:{city:string;district:string;address:string};invoice:{type:string;companyName:string;taxOffice:string;taxNumber:string};subtotal?:number;shippingTotal?:number;discountTotal?:number;total:number;items:Item[]};
type Firm={name:string;legalName:string;website:string;phone:string;email:string;city:string;district:string;address:string;taxOffice:string;taxNumber:string};

export default function InvoicePrint({params}:{params:Promise<{id:string}>}){
 const [id,setId]=useState(""); const [order,setOrder]=useState<Order|null>(null); const [firm,setFirm]=useState<Firm|null>(null); const [error,setError]=useState("");
 useEffect(()=>{params.then(x=>setId(x.id));},[params]);
 useEffect(()=>{if(!id)return;fetch("/api/orders/"+id,{cache:"no-store"}).then(async r=>{const d=await r.json();if(!r.ok)throw Error(d.message||"Sipariş alınamadı.");return d.order;}).then(setOrder).catch(e=>setError(e.message));},[id]);
 useEffect(()=>{fetch("/api/admin-panel-settings",{cache:"no-store"}).then(async r=>{const d=await r.json();if(!r.ok)throw Error();return d.settings?.firm;}).then(setFirm).catch(()=>null);},[]);
 const vat=useMemo(()=>order?order.items.reduce((sum,i)=>{const gross=i.lineTotal??((i.price??i.unitPrice??0)*i.quantity);const rate=Number(i.vatRate??20);return sum+(rate>0?gross*rate/(100+rate):0)},0):0,[order]);
 if(error)return <main className="p-6">{error}</main>; if(!order)return <main className="p-6">Fatura hazırlanıyor…</main>;
 const buyer=order.invoice.type==="corporate"?(order.invoice.companyName||order.customer.fullName):order.customer.fullName;
 return <main className="invoice-print mx-auto bg-white p-8 text-black">
  <div className="print:hidden mb-5 flex justify-end"><button className="button-dark" onClick={()=>window.print()}>Yazdır / PDF Kaydet</button></div>
  <header className="flex justify-between gap-8 border-b-2 border-black pb-6">
   <div><div className="text-4xl font-black tracking-tight">AKN</div><div className="font-bold">MOTOSİKLET</div><p className="text-xs mt-3 max-w-sm">{firm?.legalName||firm?.name||"AKIN MOTOSİKLET"}<br/>{firm?.address||"Serdivan / Sakarya"}<br/>{firm?.taxOffice||"Vergi Dairesi"} · VKN {firm?.taxNumber||"—"}<br/>{firm?.website||"www.aknmotosiklet.com"} · {firm?.phone||""}</p></div>
   <div className="text-right"><h1 className="text-2xl font-black">SATIŞ FATURASI</h1><p className="text-sm mt-3">Belge No: {order.orderNumber}</p><p className="text-sm">Tarih: {new Date(order.createdAt).toLocaleDateString("tr-TR")}</p><p className="text-xs mt-3 border border-black inline-block px-2 py-1">E-FATURA / E-ARŞİV ENTEGRASYONU ÖNCESİ ÇIKTI</p></div>
  </header>
  <section className="grid grid-cols-2 gap-8 py-6 border-b">
   <div><h2 className="font-bold mb-2">SATICI</h2><p>{firm?.legalName||firm?.name||"AKIN MOTOSİKLET"}</p><p className="text-sm">{firm?.address||"Serdivan / Sakarya"}<br/>{firm?.taxOffice||""} {firm?.taxNumber?("· VKN "+firm.taxNumber):""}</p></div>
   <div><h2 className="font-bold mb-2">ALICI</h2><p>{buyer}</p><p className="text-sm">{order.delivery.address}<br/>{order.delivery.district} / {order.delivery.city}</p><p className="text-sm">{order.customer.phone} · {order.customer.email}</p>{order.invoice.type==="corporate"&&<p className="text-sm mt-2">Vergi Dairesi: {order.invoice.taxOffice}<br/>VKN/TCKN: {order.invoice.taxNumber}</p>}</div>
  </section>
  <table className="w-full text-sm mt-6 border-collapse"><thead><tr><th className="border p-2 text-left">#</th><th className="border p-2 text-left">Mal / Hizmet</th><th className="border p-2">Miktar</th><th className="border p-2">KDV</th><th className="border p-2 text-right">Birim Fiyat</th><th className="border p-2 text-right">Tutar</th></tr></thead><tbody>{order.items.map((i,n)=>{const price=i.price??i.unitPrice??0;return <tr key={i.id||n}><td className="border p-2">{n+1}</td><td className="border p-2">{i.name||i.productName}<div className="text-xs">{i.sku||""}{i.barcode?(" · "+i.barcode):""}</div></td><td className="border p-2 text-center">{i.quantity}</td><td className="border p-2 text-center">%{Number(i.vatRate??20)}</td><td className="border p-2 text-right">{money(price)}</td><td className="border p-2 text-right">{money(i.lineTotal??price*i.quantity)}</td></tr>})}</tbody></table>
  <div className="ml-auto mt-6 w-full max-w-sm text-sm space-y-2"><div className="flex justify-between"><span>Mal/Hizmet Toplamı</span><b>{money(order.subtotal??order.total)}</b></div><div className="flex justify-between"><span>İndirim</span><b>-{money(order.discountTotal??0)}</b></div><div className="flex justify-between"><span>Kargo</span><b>{money(order.shippingTotal??0)}</b></div><div className="flex justify-between"><span>Hesaplanan KDV (bilgi)</span><b>{money(vat)}</b></div><div className="flex justify-between border-t-2 border-black pt-3 text-lg"><span>Ödenecek Tutar</span><b>{money(order.total)}</b></div></div>
  <footer className="mt-12 pt-5 border-t text-xs text-slate-600">Bu çıktı sipariş/fatura önizlemesidir. Resmî e-Fatura/e-Arşiv belgesi, entegratör üzerinden oluşturulan belge numarası ve mali mühür/e-imza süreçleri tamamlandığında geçerlilik kazanır.</footer>
 </main>
}
