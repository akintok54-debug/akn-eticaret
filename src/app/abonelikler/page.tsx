"use client";
import {useEffect,useState} from "react";
import Link from "next/link";
import StoreHeader from "@/components/layout/StoreHeader";
import StoreFooter from "@/components/layout/StoreFooter";

type Sub={id:string;status:string;frequency:string;intervalCount:number;remainingRuns:number|null;nextRunAt:string;paymentMethod:string;items:Array<{id:string;productName:string;quantity:number;unitPrice:number}>};
const label:Record<string,string>={active:"Aktif",paused:"Durduruldu",cancelled:"İptal",completed:"Tamamlandı"};

export default function CustomerSubscriptions(){
 const [rows,setRows]=useState<Sub[]>([]),[busy,setBusy]=useState(""),[message,setMessage]=useState("");
 async function load(){const r=await fetch("/api/subscriptions",{cache:"no-store"});const d=await r.json();if(!r.ok)throw new Error(d.message||"Abonelikler alınamadı.");setRows(d.subscriptions||[]);}
 useEffect(()=>{void load().catch(e=>setMessage(e.message));},[]);
 async function change(id:string,action:"pause"|"resume"|"cancel"){setBusy(id);setMessage("");try{const r=await fetch("/api/subscriptions",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({id,action})});const d=await r.json();if(!r.ok)throw new Error(d.message);await load();}catch(e){setMessage(e instanceof Error?e.message:"İşlem tamamlanamadı.");}finally{setBusy("");}}
 return <><StoreHeader/><main className="store-container"><div className="page-heading"><p><Link href="/hesabim">Hesabım</Link> / Aboneliklerim</p><h1>Aboneliklerim</h1></div>{message&&<p className="notice mb-5">{message}</p>}
  {!rows.length?<section className="catalog-message mb-12">Henüz aktif aboneliğiniz yok.<Link href="/urunler" className="block underline mt-3">Ürünlere göz atın</Link></section>:<div className="grid gap-5 mb-12">
   {rows.map(s=><article key={s.id} className="form-panel"><div className="flex flex-wrap justify-between gap-4"><div><h2>Abonelik #{s.id.slice(-8).toUpperCase()}</h2><p className="text-sm text-slate-500 mt-2">{label[s.status]||s.status} · Her {s.intervalCount} {s.frequency==="weekly"?"hafta":"ay"} · {s.paymentMethod==="sipay"?"Kart / Sipay":"Havale / EFT"}</p></div><div className="text-right"><p className="text-xs text-slate-500">Sonraki sipariş</p><b>{new Date(s.nextRunAt).toLocaleString("tr-TR")}</b></div></div>
    <div className="border-t mt-4 pt-4">{s.items.map(i=><p key={i.id} className="text-sm py-1">{i.productName} × {i.quantity}</p>)}</div>
    <div className="flex flex-wrap gap-2 mt-4">{s.status==="active"&&<button disabled={busy===s.id} className="button-dark" onClick={()=>void change(s.id,"pause")}>Durdur</button>}{s.status==="paused"&&<button disabled={busy===s.id} className="button-dark" onClick={()=>void change(s.id,"resume")}>Yeniden başlat</button>}{!["cancelled","completed"].includes(s.status)&&<button disabled={busy===s.id} className="border rounded px-4 py-2" onClick={()=>void change(s.id,"cancel")}>Aboneliği iptal et</button>}</div>
   </article>)}
  </div>}
 </main><StoreFooter/></>;
}
