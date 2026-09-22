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
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCart, setSelectedCart] = useState<Cart | null>(null);

  async function load() {
    setLoading(true);

    try {
      const response = await fetch("/api/cart-tracking", {
        cache: "no-store",
      });

      const data = await response.json();
      setCarts(data.carts || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const rows = useMemo(() => {
    const now = Date.now();

    let result = carts.filter((cart) => cart.itemCount > 0);

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
        cart.customerPhone,
        cart.customerEmail,
        cart.sessionId,
      ].some((value) =>
        (value || "").toLocaleLowerCase("tr-TR").includes(q)
      )
    );
  }, [carts, mode, search]);

  return (
    <>
      <main className="p-4 md:p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">{title}</h1>

          <p className="mt-1 text-sm text-slate-500">
            AKN E-Ticaret canlı sepet takip sistemi
          </p>
        </div>

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
                          {cart.customerName || "Misafir müşteri"}
                        </div>

                        <div className="text-xs text-slate-500">
                          {cart.customerPhone ||
                            cart.customerEmail ||
                            cart.sessionId.slice(0, 12)}
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
            className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white shadow-2xl"
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
                  {selectedCart.customerName || "Misafir müşteri"}
                </div>
              </div>

              <div className="rounded-xl bg-slate-50 p-3">
                <div className="text-xs text-slate-500">Telefon</div>
                <div className="mt-1 font-semibold">
                  {selectedCart.customerPhone || "-"}
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