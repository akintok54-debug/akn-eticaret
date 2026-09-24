"use client";
import { useState } from "react";
import Link from "next/link";
import StoreHeader from "@/components/layout/StoreHeader";
import StoreFooter from "@/components/layout/StoreFooter";

export default function ResetRequestPage() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true); setMessage("");
    try {
      const r = await fetch("/api/password-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, action: "request" }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.message || "İstek gönderilemedi.");
      setMessage(d.message);
      setEmail("");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Bir hata oluştu.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <StoreHeader />
      <main className="store-container">
        <div className="page-heading"><h1>Şifremi unuttum</h1></div>
        <div className="form-panel max-w-md mx-auto mb-12">
          <p className="mb-4 text-sm">Hesabınıza kayıtlı e-posta adresini girin. Aktif bir hesabınız varsa 15 dakika geçerli bağlantı gönderilecektir.</p>
          {message && <p role="status" className="notice mb-4">{message}</p>}
          <form onSubmit={submit} className="form-grid">
            <label>E-posta<input type="email" required value={email} onChange={e=>setEmail(e.target.value)} maxLength={200} /></label>
            <button type="submit" disabled={busy} className="button-dark">Bağlantı gönder</button>
          </form>
          <p className="mt-4 text-sm"><Link href="/hesabim" className="underline">Giriş ekranına dön</Link></p>
        </div>
      </main>
      <StoreFooter />
    </>
  );
}
