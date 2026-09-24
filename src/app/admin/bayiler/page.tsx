"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

type Application = {
  id: string; fullName: string; phone: string; email: string | null; companyName: string;
  taxOffice: string | null; taxNumber: string | null; city: string | null; district: string | null;
  address: string | null; note: string | null; status: string; reviewNote: string | null;
  createdAt: string; updatedAt: string; reviewedAt: string | null;
  customer: { fullName: string; active: boolean; dealerStatus: string } | null;
};
const labels: Record<string, string> = { pending: "Bekliyor", approved: "Onaylandı", rejected: "Reddedildi" };
export default function AdminDealersPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [selected, setSelected] = useState<Application | null>(null);
  const [note, setNote] = useState("");
  async function load() {
    try {
      const response = await fetch("/api/dealer-applications", { cache: "no-store" });
      const data = await response.json(); if (!response.ok) throw new Error(data.message);
      setApplications(data.applications);
    } catch (e) { setError(e instanceof Error ? e.message : "Başvurular alınamadı."); }
    finally { setLoading(false); }
  }
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/dealer-applications", { cache: "no-store", signal: controller.signal })
      .then(async response => { const data = await response.json(); if (!response.ok) throw new Error(data.message || "Kayıtlar alınamadı."); return data; })
      .then(data => { if (!controller.signal.aborted) { setApplications(data.applications); } })
      .catch(error => { if (!controller.signal.aborted) setError(error instanceof Error ? error.message : "Kayıtlar alınamadı."); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, []);
  async function review(next: string) {
    if (!selected || busy) return;
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/dealer-applications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: selected.id, status: next, reviewNote: note }) });
      const data = await response.json(); if (!response.ok) throw new Error(data.message);
      setSelected({ ...selected, ...data.application }); await load();
    } catch (e) { setError(e instanceof Error ? e.message : "Başvuru güncellenemedi."); }
    finally { setBusy(false); }
  }
  const rows = applications.filter(a => (!status || a.status === status) && [a.fullName, a.companyName, a.phone, a.email].some(v => (v ?? "").toLocaleLowerCase("tr-TR").includes(search.trim().toLocaleLowerCase("tr-TR"))));
  return <main className="mx-auto max-w-7xl p-4 sm:p-6">
    <div className="flex flex-wrap justify-between gap-3"><h1 className="text-3xl font-black">Bayi Başvuruları</h1><Link href="/admin/musteriler" className="rounded-xl border bg-white px-4 py-3">Müşteri ve Bayi Hesapları</Link></div>
    {error && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-4 text-red-700">{error}</p>}
    <div className="mt-6 grid gap-3 sm:grid-cols-2"><label className="text-sm">Başvuru Ara<input className="mt-1 w-full rounded-xl border bg-white p-3" value={search} onChange={e => setSearch(e.target.value)} placeholder="Ad, firma, telefon, e-posta" /></label><label className="text-sm">Durum<select className="mt-1 w-full rounded-xl border bg-white p-3" value={status} onChange={e => setStatus(e.target.value)}><option value="">Tümü</option>{Object.entries(labels).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label></div>
    {selected && <section className="mt-6 rounded-2xl border bg-white p-5">
      <div className="flex flex-wrap justify-between gap-3"><h2 className="text-xl font-bold">Başvuru Detayı · {labels[selected.status]}</h2><button onClick={() => setSelected(null)} disabled={busy} className="underline">Kapat</button></div>
      <dl className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{[
        ["Ad Soyad", selected.fullName], ["Ünvan", selected.companyName], ["Telefon", selected.phone], ["E-posta", selected.email], ["Vergi Dairesi", selected.taxOffice], ["Vergi No", selected.taxNumber], ["İl / İlçe", [selected.city, selected.district].filter(Boolean).join(" / ")], ["Adres", selected.address], ["Başvuru Notu", selected.note], ["Başvuru Tarihi", new Date(selected.createdAt).toLocaleString("tr-TR")], ["Güncelleme", new Date(selected.updatedAt).toLocaleString("tr-TR")], ["İnceleme", selected.reviewedAt ? new Date(selected.reviewedAt).toLocaleString("tr-TR") : "Bekliyor"],
      ].map(([label, value]) => <div key={label}><dt className="text-xs font-bold text-slate-500">{label}</dt><dd className="mt-1 whitespace-pre-wrap break-words">{value || "—"}</dd></div>)}</dl>
      {selected.customer && <p className="mt-4 text-sm">Bağlı müşteri: {selected.customer.fullName}{!selected.customer.active ? " (Pasif — onaylamak hesabı otomatik etkinleştirmez)" : ""}</p>}
      <label className="mt-5 block text-sm font-bold">Yönetici Notu<textarea maxLength={1000} rows={3} className="mt-1 w-full rounded-xl border p-3" value={note} onChange={e => setNote(e.target.value)} /></label>
      <div className="mt-4 flex flex-wrap gap-3">{[["approved", "Onayla"], ["rejected", "Reddet"], ["pending", "Beklemeye Al"]].map(([value, label]) => <button key={value} disabled={busy} onClick={() => void review(value)} className="rounded-xl bg-slate-950 px-5 py-3 font-bold text-white disabled:opacity-50">{label}</button>)}</div>
    </section>}
    {loading ? <p className="p-10 text-center">Başvurular yükleniyor…</p> : !rows.length ? <p className="mt-6 rounded-xl border bg-white p-10 text-center">Başvuru bulunamadı.</p> : <div className="mt-6 grid gap-4 xl:grid-cols-2">{rows.map(a => <article key={a.id} className="min-w-0 rounded-2xl border bg-white p-5"><div className="flex flex-wrap justify-between gap-2"><h2 className="break-words font-bold">{a.companyName}</h2><span className="rounded-full bg-slate-100 px-3 py-1 text-xs">{labels[a.status]}</span></div><p className="mt-2">{a.fullName}</p><p className="mt-2 break-words text-sm text-slate-500">{a.phone} · {a.email}</p><p className="mt-2 text-xs">{new Date(a.createdAt).toLocaleString("tr-TR")}</p><button onClick={() => { setSelected(a); setNote(a.reviewNote ?? ""); }} className="mt-4 rounded-xl border px-4 py-3 font-bold">Detay / İncele</button></article>)}</div>}
  </main>;
}
