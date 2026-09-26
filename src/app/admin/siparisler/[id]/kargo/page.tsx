"use client";
import {useEffect,useState} from "react";

type Order={id:string;orderNumber:string;createdAt:string;customer:{fullName:string;phone:string;email:string};delivery:{city:string;district:string;address:string};shippingCompany?:string;trackingNumber?:string;paymentMethod:string;items:Array<{id?:string;name:string;sku?:string;quantity:number}>};

export default function ShippingPrint({params}:{params:Promise<{id:string}>}){
 const [id,setId]=useState(""),[order,setOrder]=useState<Order|null>(null),[error,setError]=useState("");
 useEffect(()=>{params.then(x=>setId(x.id));},[params]);
 useEffect(()=>{if(!id)return;fetch("/api/orders/"+id,{cache:"no-store"}).then(async r=>{const d=await r.json();if(!r.ok)throw Error(d.message||"Sipariş alınamadı.");return d.order;}).then(setOrder).catch(e=>setError(e.message));},[id]);
 if(error)return <main className="p-6">{error}</main>;
 if(!order)return <main className="p-6">Kargo çıktısı hazırlanıyor…</main>;
 return <main className="mx-auto max-w-3xl bg-white p-8 text-black print:p-0">
  <div className="print:hidden mb-5 flex justify-end"><button className="button-dark" onClick={()=>window.print()}>Yazdır / PDF Kaydet</button></div>
  <header className="border-b-2 border-black pb-5 flex justify-between gap-6"><div><div className="text-3xl font-black">AKN MOTOSİKLET</div><p className="text-xs mt-2">Gönderici</p></div><div className="text-right"><h1 className="text-2xl font-black">KARGO BİLGİSİ</h1><p className="text-sm mt-2">{order.orderNumber}</p></div></header>
  <section className="mt-6 border-2 border-black p-6"><p className="text-xs font-bold">ALICI</p><h2 className="text-2xl font-black mt-2">{order.customer.fullName}</h2><p className="mt-3 text-lg leading-7">{order.delivery.address}<br/>{order.delivery.district} / {order.delivery.city}</p><p className="mt-4 text-lg font-bold">{order.customer.phone}</p></section>
  <section className="grid grid-cols-2 gap-4 border-x-2 border-b-2 border-black p-5 text-sm"><div><b>Kargo firması</b><br/>{order.shippingCompany||"Belirlenmedi"}</div><div><b>Takip numarası</b><br/>{order.trackingNumber||"—"}</div><div><b>Ödeme</b><br/>{order.paymentMethod==="sipay"?"Kart / Sipay":"Havale / EFT"}</div><div><b>Sipariş tarihi</b><br/>{new Date(order.createdAt).toLocaleString("tr-TR")}</div></section>
 </main>;
}
