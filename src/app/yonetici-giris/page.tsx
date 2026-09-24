"use client";
import {useState,type FormEvent} from "react";
import Link from "next/link";
export default function AdminLogin(){
 const [busy,setBusy]=useState(false),[message,setMessage]=useState("");
 async function submit(event:FormEvent<HTMLFormElement>){
  event.preventDefault();if(busy)return;setBusy(true);setMessage("");
  try{
   const response=await fetch("/api/admin-session",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(Object.fromEntries(new FormData(event.currentTarget)))});
   const data=await response.json();if(!response.ok)throw new Error(data.message);
   window.location.replace("/admin");
  }catch(error){setMessage(error instanceof Error?error.message:"Giriş yapılamadı.");setBusy(false);}
 }
 return <main className="store-container py-12"><section className="form-panel max-w-lg mx-auto"><span className="overline">AKN MOTOSİKLET</span><h1 className="text-2xl font-bold my-5">Yönetici girişi</h1><p className="text-sm mb-6">Mağaza yönetimi için yönetici kullanıcı adınızı ve şifrenizi girin.</p><form onSubmit={submit}><fieldset disabled={busy} className="grid gap-4"><label className="grid gap-2">Kullanıcı adı<input className="rounded border p-3" name="user" autoComplete="username" required maxLength={200}/></label><label className="grid gap-2">Şifre<input className="rounded border p-3" name="password" type="password" autoComplete="current-password" required maxLength={512}/></label>{message&&<p role="alert" className="notice error-notice">{message}</p>}<button className="button-dark">{busy?"Giriş yapılıyor…":"Yönetim paneline gir"}</button></fieldset></form><Link href="/hesabim" className="block underline text-sm mt-6">Müşteri / bayi girişi</Link><Link href="/" className="block underline text-sm mt-3">Mağazaya dön</Link></section></main>;
}
