"use client";
import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import StoreHeader from "@/components/layout/StoreHeader";
import StoreFooter from "@/components/layout/StoreFooter";

export default function ResetTokenPage() {
  const { token } = useParams<{ token: string }>();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy || done) return;
    if(password !== confirmPassword){setMessage("Şifreler eşleşmiyor.");return;}
    setBusy(true); setMessage("");
    try {
      const r = await fetch("/api/password-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password, action: "reset" }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.message || "Şifre sıfırlanamadı.");
      setMessage("Şifreniz güncellendi. Giriş yapabilirsiniz.");
      setPassword("");setConfirmPassword("");setDone(true);
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
        <div className="page-heading"><h1>Yeni şifre belirle</h1></div>
        <div className="form-panel max-w-md mx-auto mb-12">
          <p className="mb-4 text-sm">Bağlantı geçerli ise aşağıdan yeni şifrenizi girin (en az 10 karakter).</p>
          {message && <p role="status" className="notice mb-4">{message}</p>}
          {!done && <form onSubmit={submit} className="form-grid">
            <label>Yeni şifre<input type="password" required minLength={10} maxLength={128} value={password} onChange={e=>setPassword(e.target.value)} autoComplete="new-password" /></label>
            <label>Yeni şifre tekrar<input type="password" required minLength={10} maxLength={128} value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} autoComplete="new-password" /></label><button type="submit" disabled={busy} className="button-dark">Şifreyi güncelle</button>
          </form>}{done && <Link href="/hesabim" className="button-dark">Giriş yap</Link>}
          <p className="mt-4 text-sm"><Link href="/sifre-sifirla" className="underline">Yeni bağlantı iste</Link></p>
        </div>
      </main>
      <StoreFooter />
    </>
  );
}
