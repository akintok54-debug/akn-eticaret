"use client";

import { useEffect, useState, type FormEvent } from "react";

type Group = { id: string; name: string; type: string; active: boolean; discountRate: number };
type Customer = {
  id: string; fullName: string; companyName: string | null; phone: string; email: string | null;
  city: string; district: string; address: string; taxOffice: string | null; taxNumber: string | null;
  type: string; active: boolean; groupId: string | null; discountRate: number;
  createdAt: string; updatedAt: string; group: Group | null; _count: { orders: number };
};
const blank = { fullName: "", companyName: "", phone: "", email: "", city: "", district: "", address: "", taxOffice: "", taxNumber: "", type: "retail", active: true, groupId: "", discountRate: 0 };
const fields = [["fullName", "Ad Soyad"], ["companyName", "Ünvan"], ["phone", "Telefon"], ["email", "E-posta"], ["city", "İl"], ["district", "İlçe"], ["taxOffice", "Vergi Dairesi"], ["taxNumber", "Vergi No"]] as const;
const input = "mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-3";
const date = (value: string) => new Date(value).toLocaleString("tr-TR");

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [type, setType] = useState("");
  const [active, setActive] = useState("");
  const [groupFilter, setGroupFilter] = useState("");
  const [selected, setSelected] = useState<Customer | null>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(blank);

  async function load() {
    try {
      const responses = await Promise.all([fetch("/api/customers", { cache: "no-store" }), fetch("/api/customer-groups", { cache: "no-store" })]);
      const [data, groupData] = await Promise.all(responses.map(r => r.json()));
      if (!responses[0].ok) throw new Error(data.message);
      if (!responses[1].ok) throw new Error(groupData.message);
      setCustomers(data.customers); setGroups(groupData.groups);
    } catch (e) { setError(e instanceof Error ? e.message : "Kayıtlar alınamadı."); }
    finally { setLoading(false); }
  }
  useEffect(() => {
    const controller = new AbortController();
    Promise.all(["/api/customers", "/api/customer-groups"].map(url => fetch(url, { cache: "no-store", signal: controller.signal }).then(async response => {
      const data = await response.json(); if (!response.ok) throw new Error(data.message); return data;
    }))).then(([data, groupData]) => { if (!controller.signal.aborted) { setCustomers(data.customers); setGroups(groupData.groups); } })
      .catch(error => { if (!controller.signal.aborted) setError(error instanceof Error ? error.message : "Kayıtlar alınamadı."); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, []);

  function edit(customer: Customer | null) {
    setSelected(customer);
    setForm(customer ? { ...blank, ...Object.fromEntries(Object.entries(customer).map(([k, v]) => [k, v ?? ""])) } as typeof blank : { ...blank });
    setEditing(true); setError(""); setNotice("");
  }
  async function save(event: FormEvent) {
    event.preventDefault(); if (busy) return;
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/customers", { method: selected ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, id: selected?.id }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      setEditing(false); setSelected(null); setNotice("Müşteri bilgileri kaydedildi."); await load();
    } catch (e) { setError(e instanceof Error ? e.message : "Kaydedilemedi."); }
    finally { setBusy(false); }
  }
  async function toggle(customer: Customer) {
    if (busy) return; setBusy(true); setError("");
    try {
      const response = await fetch("/api/customers", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: customer.id, active: !customer.active }) });
      const data = await response.json(); if (!response.ok) throw new Error(data.message);
      if (selected?.id === customer.id) setSelected({ ...customer, active: !customer.active });
      await load(); setNotice("Müşteri durumu güncellendi. Sipariş geçmişi korundu.");
    } catch (e) { setError(e instanceof Error ? e.message : "Güncellenemedi."); }
    finally { setBusy(false); }
  }
  async function provision(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!selected || busy) return;
    const password=String(new FormData(event.currentTarget).get("loginPassword")??"");
    setBusy(true);setError("");
    try{
      const response=await fetch("/api/account",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"provision",customerId:selected.id,password})});
      const data=await response.json();if(!response.ok)throw new Error(data.message);
      setNotice("Giriş şifresi kaydedildi. Şifreyi müşteriye güvenli kanaldan iletin; müşteri hesabından değiştirebilir.");
    }catch(e){setError(e instanceof Error?e.message:"Şifre kaydedilemedi.");}finally{setBusy(false);}
  }
  const q = search.toLocaleLowerCase("tr-TR").trim();
  const rows = customers.filter(c => (!type || c.type === type) && (!active || String(c.active) === active) && (!groupFilter || c.groupId === groupFilter) && [c.fullName, c.companyName, c.phone, c.email, c.taxNumber].some(v => (v ?? "").toLocaleLowerCase("tr-TR").includes(q)));

  return <main className="mx-auto max-w-7xl p-4 text-slate-900 sm:p-6">
    <div className="flex flex-wrap items-center justify-between gap-4"><div><h1 className="text-3xl font-black">Müşteriler</h1><p className="mt-2 text-sm text-slate-500">Perakende ve bayi kayıtları · {rows.length} müşteri</p></div><button onClick={() => edit(null)} className="rounded-xl bg-slate-950 px-5 py-3 font-bold text-white">Yeni Müşteri Ekle</button></div>
    {error && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-4 text-red-700">{error}</p>}
    {notice && <p role="status" className="mt-4 rounded-xl bg-emerald-50 p-4 text-emerald-800">{notice}</p>}
    {selected && !editing && <form onSubmit={provision} className="mt-6 rounded-xl border bg-white p-5"><h2 className="font-bold">Müşteri giriş hesabı</h2><p className="text-sm my-3">Kimliği doğrulanan müşteriye giriş şifresi atayın. Mevcut oturumlar kapatılır.</p><label className="block text-sm">Yeni giriş şifresi<input className={input} name="loginPassword" type="password" autoComplete="new-password" required minLength={10} maxLength={128}/></label><button disabled={busy} className="button-dark mt-3">Giriş şifresi ata / yenile</button></form>}
    {editing ? <form onSubmit={save} className="mt-6 rounded-2xl border bg-white p-5">
      <h2 className="text-xl font-bold">{selected ? "Bilgileri Düzenle" : "Yeni Müşteri"}</h2>
      <fieldset disabled={busy} className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {fields.map(([key, label]) => <label key={key} className="text-sm font-semibold">{label}<input className={input} value={form[key]} required={key === "fullName" || key === "phone"} type={key === "email" ? "email" : key === "phone" ? "tel" : "text"} maxLength={200} onChange={e => setForm({ ...form, [key]: e.target.value })} /></label>)}
        <label className="text-sm font-semibold">Müşteri Tipi<select className={input} value={form.type} onChange={e => setForm({ ...form, type: e.target.value, groupId: "" })}><option value="retail">Perakende</option><option value="dealer">Bayi</option></select></label>
        <label className="text-sm font-semibold">Üye / Bayi Grubu<select className={input} value={form.groupId} onChange={e => setForm({ ...form, groupId: e.target.value })}><option value="">Grupsuz</option>{groups.filter(g => g.type === form.type && (g.active || g.id === form.groupId)).map(g => <option key={g.id} value={g.id}>{g.name} · %{g.discountRate}{!g.active ? " (Pasif)" : ""}</option>)}</select></label>
        <label className="text-sm font-semibold">Müşteri İskontosu %<input className={input} type="number" min="0" max="100" step="0.01" required value={form.discountRate} onChange={e => setForm({ ...form, discountRate: Number(e.target.value) })} /></label>
        <label className="text-sm font-semibold">Durum<select className={input} value={String(form.active)} onChange={e => setForm({ ...form, active: e.target.value === "true" })}><option value="true">Aktif</option><option value="false">Pasif</option></select></label>
        <label className="text-sm font-semibold sm:col-span-2">Adres<textarea className={input} maxLength={1000} rows={3} value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} /></label>
      </fieldset>
      <div className="mt-5 flex flex-wrap gap-3"><button disabled={busy} className="rounded-xl bg-slate-950 px-5 py-3 font-bold text-white">{busy ? "Kaydediliyor…" : "Kaydet"}</button><button type="button" disabled={busy} onClick={() => setEditing(false)} className="rounded-xl border px-5 py-3">Vazgeç</button></div>
    </form> : selected && <section className="mt-6 rounded-2xl border bg-white p-5">
      <div className="flex flex-wrap justify-between gap-3"><h2 className="text-xl font-bold">Müşteri Bilgileri</h2><button onClick={() => setSelected(null)} className="underline">Detayı Kapat</button></div>
      <dl className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {([...fields.map(([key, label]) => [label, selected[key] || "—"]), ["Adres", selected.address || "—"], ["Tip / Durum", (selected.type === "dealer" ? "Bayi" : "Perakende") + " / " + (selected.active ? "Aktif" : "Pasif")], ["Grup", selected.group?.name ?? "Grupsuz"], ["Müşteri / Grup İskontosu", "%" + selected.discountRate + " / %" + (selected.group?.discountRate ?? 0)], ["Oluşturma", date(selected.createdAt)], ["Güncelleme", date(selected.updatedAt)], ["Sipariş Sayısı", String(selected._count.orders)]]).map(([label, value]) => <div key={label}><dt className="text-xs font-bold text-slate-500">{label}</dt><dd className="mt-1 whitespace-pre-wrap break-words">{value}</dd></div>)}
      </dl><button onClick={() => edit(selected)} className="mt-5 rounded-xl border px-4 py-3 font-bold">Bilgileri Düzenle</button>
    </section>}
    <section className="mt-6 rounded-2xl border bg-white p-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <label className="text-sm">Müşteri Ara<input className={input} value={search} onChange={e => setSearch(e.target.value)} placeholder="Ad, ünvan, telefon, e-posta" /></label>
        <label className="text-sm">Tip<select className={input} value={type} onChange={e => setType(e.target.value)}><option value="">Tümü</option><option value="retail">Perakende</option><option value="dealer">Bayi</option></select></label>
        <label className="text-sm">Durum<select className={input} value={active} onChange={e => setActive(e.target.value)}><option value="">Tümü</option><option value="true">Aktif</option><option value="false">Pasif</option></select></label>
        <label className="text-sm">Grup<select className={input} value={groupFilter} onChange={e => setGroupFilter(e.target.value)}><option value="">Tümü</option>{groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}</select></label>
      </div>
      {loading ? <p className="p-8 text-center">Müşteriler yükleniyor…</p> : !rows.length ? <p className="p-8 text-center">Bu filtrelere uygun müşteri bulunamadı.</p> : <div className="mt-5 grid gap-4 xl:grid-cols-2">{rows.map(c => <article key={c.id} className="min-w-0 rounded-xl border p-4"><h2 className="break-words font-bold">{c.fullName}</h2><p className="text-sm">{c.companyName}</p><p className="mt-2 break-words text-sm text-slate-600">{c.phone} · {c.email || "E-posta yok"}</p><p className="mt-2 text-sm">{c.type === "dealer" ? "Bayi" : "Perakende"} · {c.active ? "Aktif" : "Pasif"} · {c.group?.name ?? "Grupsuz"} · İskonto %{c.discountRate}</p><div className="mt-4 flex flex-wrap gap-2"><button className="rounded-lg border px-3 py-2" onClick={() => { setSelected(c); setEditing(false); }}>Detay</button><button className="rounded-lg border px-3 py-2" onClick={() => edit(c)}>Düzenle</button><button disabled={busy} className="rounded-lg border px-3 py-2" onClick={() => void toggle(c)}>{c.active ? "Pasife Al" : "Aktif Et"}</button></div></article>)}</div>}
    </section>
  </main>;
}
