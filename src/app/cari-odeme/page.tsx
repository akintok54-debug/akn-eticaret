"use client";
import {useEffect,useState,type FormEvent} from "react";
import Link from "next/link";
import StoreHeader from "@/components/layout/StoreHeader";
import StoreFooter from "@/components/layout/StoreFooter";
import {useCustomers} from "@/context/CustomerContext";

type Payment={id:string;amount:number;status:string;erpSyncedAt:string|null;createdAt:string};
type Account={musteri?:{bakiye?:number};hareketler?:Array<{_id:string;tip:string;tutar:number;aciklama:string;tarih:string}>};
const tl=(n:number)=>new Intl.NumberFormat("tr-TR",{style:"currency",currency:"TRY"}).format(n||0);
export default function CariOdeme(){
 const {currentCustomer:c,loaded}=useCustomers(),[payments,setPayments]=useState<Payment[]>([]),[account,setAccount]=useState<Account|null>(null),[busy,setBusy]=useState(false),[msg,setMsg]=useState("");
 async function load(){const r=await fetch("/api/account-payments",{cache:"no-store"});if(r.ok){const d=await r.json();setPayments(d.payments||[]);setAccount(d.account||null);}}
 useEffect(()=>{if(c)void load();},[c]);
 async function pay(e:FormEvent<HTMLFormElement>){e.preventDefault();setBusy(true);setMsg("");const amount=Number(new FormData(e.currentTarget).get("amount"));try{const r=await fetch("/api/account-payments",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({amount})});const d=await r.json();if(!r.ok)throw new Error(d.message);window.location.href=d.link;}catch(x){setMsg(x instanceof Error?x.message:"Ödeme başlatılamadı.");setBusy(false);}}
 const balance=Number(account?.musteri?.bakiye||0);
 return <><StoreHeader/><main className="store-container"><div className="page-heading"><span className="overline">BAYİ CARİ HESABI</span><h1>Cari Ödeme</h1></div>{!loaded?<p>Yükleniyor…</p>:!c?<p>Ödeme yapmak için <Link className="underline" href="/hesabim">giriş yapın</Link>.</p>:c.type!=="dealer"||c.dealerStatus!=="approved"?<p className="notice">Bu bölüm onaylı bayi hesaplarına açıktır.</p>:<div className="grid gap-6 mb-12 lg:grid-cols-2"><section className="form-panel"><h2>Cari bakiyeniz</h2><p className="text-3xl font-bold my-4">{tl(balance)}</p><p className="text-sm">{balance>0?"Borç bakiyesi":balance<0?"Alacak bakiyesi":"Hesap kapalı"}</p><form onSubmit={pay} className="form-grid mt-6"><label>Ödenecek tutar<input name="amount" type="number" min="1" max="1000000" step="0.01" required/></label><button disabled={busy} className="button-red">{busy?"Sipay açılıyor…":"Kartla Ödeme Yap"}</button></form>{msg&&<p className="notice mt-4">{msg}</p>}<p className="text-xs text-slate-500 mt-4">Kart işlemi Sipay tarafından başarılı olarak doğrulandıktan sonra tahsilat cari hesabınıza otomatik işlenir.</p></section><section className="form-panel"><h2>Kart ödeme geçmişi</h2>{payments.length===0?<p className="mt-4 text-sm">Henüz kart tahsilatı yok.</p>:payments.map(p=><div key={p.id} className="border-b py-3 flex justify-between gap-3"><div><b>{tl(p.amount)}</b><p className="text-xs text-slate-500">{new Date(p.createdAt).toLocaleString("tr-TR")}</p></div><span className="text-sm">{p.status==="paid"?(p.erpSyncedAt?"Cari hesaba işlendi":"Ödendi · cari aktarımı bekliyor"):p.status==="failed"?"Başarısız":"Bekliyor"}</span></div>)}</section></div>}</main><StoreFooter/></>;
}
