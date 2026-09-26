"use client";
import {useEffect,useState} from "react";

type Order={id:string;orderNumber:string;createdAt:string;customer:{fullName:string;phone:string};delivery:{city:string;district:string;address:string};shippingCompany?:string;trackingNumber?:string;items:Array<{id?:string;name:string;sku?:string;barcode?:string|null;quantity:number}>};

export default function ShippingItemsPrint({params}:{params:Promise<{id:string}>}){
 const [id,setId]=useState(""),[order,setOrder]=useState<Order|null>(null),[error,setError]=useState("");
 useEffect(()=>{params.then(x=>setId(x.id));},[params]);
 useEffect(()=>{if(!id)return;fetch("/api/orders/"+id,{cache:"no-store"}).then(async r=>{const d=await r.json();if(!r.ok)throw Error(d.message||"Sipariş alınamadı.");return d.order;}).then(setOrder).catch(e=>setError(e.message));},[id]);
 if(error)return <main className="p-6">{error}</main>;
 if(!order)return <main className="p-6">Kargo çıktısı hazırlanıyor…</main>;
 return <main className="mx-auto max-w-4xl bg-white p-8 text-black print:p-0">
  <div className="print:hidden mb-5 flex justify-end"><button className="button-dark" onClick={()=>window.print()}>Yazdır / PDF Kaydet</button></div>
  <header className="border-b-2 border-black pb-5 flex justify-between"><div><div className="text-3xl font-black">AKN MOTOSİKLET</div><p className="text-sm mt-2">{order.orderNumber}</p></div><div className="text-right"><h1 className="text-xl font-black">KARGO + ÜRÜN LİSTESİ</h1><p className="text-sm mt-2">{new Date(order.createdAt).toLocaleString("tr-TR")}</p></div></header>
  <section className="grid md:grid-cols-2 gap-6 py-5"><div><p className="text-xs font-bold">ALICI</p><h2 className="text-xl font-black mt-1">{order.customer.fullName}</h2><p className="mt-2">{order.delivery.address}<br/>{order.delivery.district} / {order.delivery.city}</p><p className="mt-2 font-bold">{order.customer.phone}</p></div><div><p><b>Kargo:</b> {order.shippingCompany||"Belirlenmedi"}</p><p><b>Takip:</b> {order.trackingNumber||"—"}</p></div></section>
  <table className="w-full border-collapse text-sm"><thead><tr><th className="border p-2 text-left">Stok Kodu</th><th className="border p-2 text-left">Ürün</th><th className="border p-2 text-left">Barkod</th><th className="border p-2 text-right">Adet</th></tr></thead><tbody>{order.items.map((i,n)=><tr key={i.id||n}><td className="border p-2">{i.sku||"—"}</td><td className="border p-2">{i.name}</td><td className="border p-2">{i.barcode||"—"}</td><td className="border p-2 text-right font-bold">{i.quantity}</td></tr>)}</tbody></table>
 </main>;
}
