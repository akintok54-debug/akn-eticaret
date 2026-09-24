"use client";

import { useEffect, useMemo, useState } from "react";

type CartItem = {
  id: string;
  productId: string;
  productName: string;
  image?: string | null;
  price: number;
  quantity: number;
};

type Cart = {
  id: string;
  sessionId: string;
  customerName: string | null;
  customerPhone: string | null;
  customerEmail: string | null;
  status: string;
  completedAt: string | null;
  customer: { fullName: string; phone: string; email: string | null } | null;
  reminders: Array<{ id: string; channel: string; status: string; recipient: string | null; message: string | null; createdAt: string; sentAt: string | null; error: string | null }>;
  checkoutStarted: boolean;
  itemCount: number;
  total: number;
  lastActivityAt: string;
  createdAt: string;
  items: CartItem[];
};

type Mode =
  | "active"
  | "abandoned"
  | "checkout"
  | "reminder"
  | "risk";

const money = (value: number) =>
  new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
  }).format(value || 0);

export default function CartAdmin({
  mode,
  title,
}: {
  mode: Mode;
  title: string;
}) {
  const [carts, setCarts] = useState<Cart[]>([]);
  const [now, setNow] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedCart, setSelectedCart] = useState<Cart | null>(null);

  async function load() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/cart-tracking", {
        cache: "no-store",
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Sepetler alınamadı.");
      setCarts(data.carts || []);
      setNow(Date.now());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sepetler alınamadı.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/cart-tracking", { cache: "no-store", signal: controller.signal })
      .then(async response => { const data = await response.json(); if (!response.ok) throw new Error(data.message || "Kayıtlar alınamadı."); return data; })
      .then(data => { if (!controller.signal.aborted) { setCarts(data.carts || []); setNow(Date.now()); } })
      .catch(error => { if (!controller.signal.aborted) setError(error instanceof Error ? error.message : "Kayıtlar alınamadı."); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, []);

  const rows = useMemo(() => {


    let result = carts.filter((cart) => cart.itemCount > 0 && !cart.completedAt && cart.status !== "Tamamlandı");

    if (mode === "active") {
      result = result.filter(
        (cart) =>
          now - new Date(cart.lastActivityAt).getTime() <
          30 * 60 * 1000
      );
    }

    if (mode === "abandoned") {
      result = result.filter(
        (cart) =>
          !cart.checkoutStarted &&
          now - new Date(cart.lastActivityAt).getTime() >=
          30 * 60 * 1000
      );
    }

    if (mode === "checkout") {
      result = result.filter(
        (cart) =>
          cart.checkoutStarted &&
          now - new Date(cart.lastActivityAt).getTime() >=
          30 * 60 * 1000
      );
    }

    if (mode === "reminder") {
      result = result.filter(
        (cart) =>
          now - new Date(cart.lastActivityAt).getTime() >=
          60 * 60 * 1000
      );
    }

    if (mode === "risk") {
      result = result.filter(
        (cart) =>
          cart.total >= 5000 ||
          cart.itemCount >= 5 ||
          now - new Date(cart.lastActivityAt).getTime() >=
          24 * 60 * 60 * 1000
      );
    }

    const q = search.trim().toLocaleLowerCase("tr-TR");

    if (!q) return result;

    return result.filter((cart) =>
      [
        cart.customerName,
        cart.customer?.fullName,
        cart.customer?.phone,
        cart.customer?.email,
        cart.customerPhone,
        cart.customerEmail,
        cart.sessionId,
      ].some((value) =>
        (value || "").toLocaleLowerCase("tr-TR").includes(q)
      )
    );
  }, [carts, mode, search, now]);

  return (
    <>
      <main className="p-4 md:p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">{title}</h1>

          <p className="mt-1 text-sm text-slate-500">
            AKN E-Ticaret canlı sepet takip sistemi
          </p>
        </div>

        {error && <p role="alert" className="mb-4 rounded-xl bg-red-50 p-4 text-red-700">{error}</p>}
        <section className="rounded-xl border bg-white">
          <div className="flex flex-col gap-3 border-b p-4 md:flex-row md:items-center md:justify-between">
            <div className="font-semibold">
              {rows.length} kayıt
            </div>

            <div className="flex gap-2">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Müşteri, telefon veya e-posta ara"
                className="w-full rounded-lg border px-3 py-2 text-sm md:w-80"
              />

              <button
                onClick={() => void load()}
                className="rounded-lg border px-4 py-2 text-sm font-medium"
              >
                Yenile
              </button>
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-500">
              Yükleniyor...
            </div>
          ) : rows.length === 0 ? (
            <div className="p-12 text-center">
              <div className="font-semibold">Henüz kayıt yok</div>

              <div className="mt-2 text-sm text-slate-500">
                Müşteri sepet hareketleri burada görünecek.
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-slate-50 text-left">
                    <th className="p-3">Müşteri</th>
                    <th className="p-3">Sepet</th>
                    <th className="p-3">Tutar</th>
                    <th className="p-3">Checkout</th>
                    <th className="p-3">Son Hareket</th>
                    <th className="p-3">İşlem</th>
                  </tr>
                </thead>

                <tbody>
                  {rows.map((cart) => (
                    <tr
                      key={cart.id}
                      className="border-b hover:bg-slate-50"
                    >
                      <td className="p-3">
                        <div className="font-medium">
                          {cart.customerName || cart.customer?.fullName || "Misafir sepeti"}
                        </div>

                        <div className="text-xs text-slate-500">
                          {cart.customerPhone ||
                            cart.customerEmail ||
                            cart.customer?.phone || cart.customer?.email || "Misafir sepeti – iletişim bilgisi henüz alınmadı"}
                        </div>
                      </td>

                      <td className="p-3">
                        {cart.itemCount} ürün
                      </td>

                      <td className="p-3 font-semibold">
                        {money(cart.total)}
                      </td>

                      <td className="p-3">
                        {cart.checkoutStarted
                          ? "Başladı"
                          : "Başlamadı"}
                      </td>

                      <td className="p-3">
                        {new Date(
                          cart.lastActivityAt
                        ).toLocaleString("tr-TR")}
                      </td>

                      <td className="p-3">
                        <button
                          onClick={() => setSelectedCart(cart)}
                          className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-700"
                        >
                          Sepeti Gör
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>

      {selectedCart && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setSelectedCart(null)}
        >
          <div
            role="dialog" aria-modal="true" aria-label="Sepet Detayı" className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 flex items-center justify-between border-b bg-white p-5">
              <div>
                <h2 className="text-xl font-bold">Sepet Detayı</h2>
                <p className="mt-1 text-xs text-slate-500">
                  Oturum: {selectedCart.sessionId}
                </p>
              </div>

              <button
                onClick={() => setSelectedCart(null)}
                className="flex h-9 w-9 items-center justify-center rounded-full border text-xl hover:bg-slate-100"
              >
                ×
              </button>
            </div>

            <div className="grid gap-3 border-b p-5 md:grid-cols-4">
              <div className="rounded-xl bg-slate-50 p-3">
                <div className="text-xs text-slate-500">Müşteri</div>
                <div className="mt-1 font-semibold">
                  {selectedCart.customerName || selectedCart.customer?.fullName || "Misafir sepeti – iletişim bilgisi henüz alınmadı"}
                </div>
              </div>

              <div className="rounded-xl bg-slate-50 p-3">
                <div className="text-xs text-slate-500">Telefon</div>
                <div className="mt-1 font-semibold">
                  {selectedCart.customerPhone || selectedCart.customer?.phone || "-"}
                </div>
              </div>

              <div className="rounded-xl bg-slate-50 p-3">
                <div className="text-xs text-slate-500">Checkout</div>
                <div className="mt-1 font-semibold">
                  {selectedCart.checkoutStarted
                    ? "Başladı"
                    : "Başlamadı"}
                </div>
              </div>

              <div className="rounded-xl bg-slate-50 p-3">
                <div className="text-xs text-slate-500">Sepet Toplamı</div>
                <div className="mt-1 font-bold">
                  {money(selectedCart.total)}
                </div>
              </div>
            </div>

            <div className="p-5">
              <p className="mb-4 break-words text-sm">E-posta: {selectedCart.customerEmail || selectedCart.customer?.email || "—"} · Durum: {selectedCart.status}</p>
              <h3 className="mb-4 font-bold">
                Sepetteki Ürünler ({selectedCart.itemCount})
              </h3>

              <div className="space-y-3">
                {selectedCart.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-col gap-4 rounded-xl border p-4 sm:flex-row sm:items-center"
                  >
                    <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-100">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.productName}
                          className="h-full w-full object-contain"
                        />
                      ) : (
                        <span className="text-sm font-bold text-slate-400">
                          AKN
                        </span>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <a
                        href={`/urun/${item.productId}`}
                        target="_blank"
                        rel="noreferrer"
                        className="font-semibold hover:underline"
                      >
                        {item.productName}
                      </a>

                      <div className="mt-1 text-sm text-slate-500">
                        Birim fiyat: {money(item.price)}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6 sm:text-right">
                      <div>
                        <div className="text-xs text-slate-500">
                          Adet
                        </div>
                        <div className="font-semibold">
                          {item.quantity}
                        </div>
                      </div>

                      <div>
                        <div className="text-xs text-slate-500">
                          Toplam
                        </div>
                        <div className="font-bold">
                          {money(item.price * item.quantity)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <section className="mt-6 rounded-xl border p-4">
  <h3 className="font-bold">Hatırlatma Geçmişi</h3>
  <p className="mt-2 text-xs text-slate-500">Bu alan hatırlatma kaydı tutar; otomatik SMS veya e-posta göndermez. Haricen gönderdiğiniz hatırlatmaları burada işaretleyin.</p>
  <div className="mt-3 space-y-2">{selectedCart.reminders?.length ? selectedCart.reminders.map(reminder => <article key={reminder.id} className="rounded-lg bg-slate-50 p-3 text-sm">
    <p>{new Date(reminder.createdAt).toLocaleString("tr-TR")} · {({ email: "E-posta", sms: "SMS", phone: "Telefon", whatsapp: "WhatsApp" } as Record<string,string>)[reminder.channel] || reminder.channel} · {({ pending: "Bekliyor", sent: "Gönderildi", failed: "Başarısız" } as Record<string,string>)[reminder.status] || reminder.status}</p>
    <p className="break-words">{reminder.recipient}</p><p className="whitespace-pre-wrap break-words">{reminder.message}</p>{reminder.error && <p className="text-red-700">{reminder.error}</p>}
  </article>) : <p className="text-sm text-slate-500">Henüz hatırlatma kaydı yok.</p>}</div>
  <form key={selectedCart.id} onSubmit={async event => {
    event.preventDefault(); if (saving) return;
    const form = event.currentTarget; const values = new FormData(form);
    setSaving(true); setError("");
    try {
      const response = await fetch("/api/cart-tracking", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: selectedCart.id, ...Object.fromEntries(values) }) });
      const data = await response.json(); if (!response.ok) throw new Error(data.message);
      setSelectedCart(data.cart); setCarts(current => current.map(cart => cart.id === data.cart.id ? data.cart : cart)); form.reset();
    } catch (e) { setError(e instanceof Error ? e.message : "Hatırlatma kaydedilemedi."); }
    finally { setSaving(false); }
  }} className="mt-4 grid gap-3 sm:grid-cols-2">
    <label className="text-sm">Kanal<select name="channel" className="mt-1 w-full rounded-lg border p-3"><option value="email">E-posta</option><option value="sms">SMS</option><option value="phone">Telefon</option><option value="whatsapp">WhatsApp</option></select></label>
    <label className="text-sm">Durum<select name="status" className="mt-1 w-full rounded-lg border p-3"><option value="pending">Bekliyor</option><option value="sent">Haricen Gönderildi</option><option value="failed">Başarısız</option></select></label>
    <label className="text-sm sm:col-span-2">Alıcı<input required name="recipient" maxLength={200} defaultValue={selectedCart.customerEmail || selectedCart.customerPhone || selectedCart.customer?.email || selectedCart.customer?.phone || ""} className="mt-1 w-full rounded-lg border p-3" /></label>
    <label className="text-sm sm:col-span-2">Mesaj / Görüşme Notu<textarea required name="message" maxLength={2000} className="mt-1 w-full rounded-lg border p-3" /></label>
    <label className="text-sm sm:col-span-2">Hata Açıklaması (varsa)<input name="error" maxLength={1000} className="mt-1 w-full rounded-lg border p-3" /></label>
    <button disabled={saving} className="rounded-xl bg-slate-950 px-4 py-3 font-bold text-white">{saving ? "Kaydediliyor…" : "Hatırlatma Kaydı Ekle"}</button>
    {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
  </form>
</section>
<div className="mt-5 grid gap-3 text-sm md:grid-cols-2">
                <div className="rounded-xl border p-3">
                  <span className="text-slate-500">
                    Sepet oluşturuldu:
                  </span>{" "}
                  <strong>
                    {new Date(
                      selectedCart.createdAt
                    ).toLocaleString("tr-TR")}
                  </strong>
                </div>

                <div className="rounded-xl border p-3">
                  <span className="text-slate-500">
                    Son hareket:
                  </span>{" "}
                  <strong>
                    {new Date(
                      selectedCart.lastActivityAt
                    ).toLocaleString("tr-TR")}
                  </strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}