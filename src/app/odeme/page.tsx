"use client";

import Link from "next/link";
import {
  useState,
  type FormEvent,
} from "react";

import { useCart } from "@/context/CartContext";
import { useOrders } from "@/context/OrderContext";
import { useProducts } from "@/context/ProductContext";

export default function CheckoutPage() {
  const {
    items,
    itemCount,
    total,
    clearCart,
  } = useCart();

  const { addOrder } = useOrders();
  const { products, changeStock } =
    useProducts();

  const [invoiceType, setInvoiceType] =
    useState<"individual" | "corporate">(
      "individual"
    );

  const [completedOrder, setCompletedOrder] =
    useState("");

  function submit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!items.length) {
      alert("Sepetiniz boş.");
      return;
    }

    for (const item of items) {
      const product = products.find(
        (product) =>
          product.id === item.id
      );

      if (!product || !product.active) {
        alert(
          `${item.name} artık satışta değil.`
        );
        return;
      }

      if (product.stock < item.quantity) {
        alert(
          `${item.name} için yeterli stok yok. Mevcut stok: ${product.stock}`
        );
        return;
      }
    }

    const form =
      new FormData(event.currentTarget);

    const orderNumber =
      "AKN-" +
      Date.now()
        .toString()
        .slice(-10);

    const order = {
      id: crypto.randomUUID(),
      orderNumber,
      createdAt:
        new Date().toISOString(),

      customer: {
        fullName: String(
          form.get("fullName") || ""
        ),
        phone: String(
          form.get("phone") || ""
        ),
        email: String(
          form.get("email") || ""
        ),
      },

      delivery: {
        city: String(
          form.get("city") || ""
        ),
        district: String(
          form.get("district") || ""
        ),
        address: String(
          form.get("address") || ""
        ),
      },

      invoice: {
        type: invoiceType,
        companyName: String(
          form.get("companyName") || ""
        ),
        taxOffice: String(
          form.get("taxOffice") || ""
        ),
        taxNumber: String(
          form.get("taxNumber") || ""
        ),
      },

      shippingMethod: String(
        form.get("shippingMethod") ||
          "standard"
      ),

      paymentMethod: String(
        form.get("paymentMethod") ||
          "transfer"
      ),

      items: items.map((item) => ({
        productId: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        image: item.image,
      })),

      total,
      status: "Yeni" as const,
    };

    addOrder(order);

    items.forEach((item) => {
      changeStock(
        item.id,
        -item.quantity
      );
    });

    clearCart();

    setCompletedOrder(orderNumber);
  }

  if (completedOrder) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-16">
        <div className="mx-auto max-w-xl rounded-3xl border bg-white p-10 text-center">
          <div className="text-6xl">
            ✓
          </div>

          <h1 className="mt-5 text-3xl font-black">
            Siparişiniz Alındı
          </h1>

          <p className="mt-3 text-slate-500">
            Sipariş numaranız
          </p>

          <div className="mt-2 text-2xl font-black text-red-600">
            {completedOrder}
          </div>

          <div className="mt-7 grid gap-3">
            <Link
              href="/siparisler"
              className="rounded-xl bg-slate-950 py-3 font-black text-white"
            >
              Siparişlerimi Gör
            </Link>

            <Link
              href="/urunler"
              className="rounded-xl border py-3 font-black"
            >
              Alışverişe Devam Et
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (!items.length) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-16">
        <div className="mx-auto max-w-xl rounded-2xl border bg-white p-10 text-center">
          <h1 className="text-3xl font-black">
            Sepetiniz boş
          </h1>

          <Link
            href="/urunler"
            className="mt-6 inline-block rounded-xl bg-red-600 px-6 py-3 font-black text-white"
          >
            Ürünlere Git
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5">
          <Link
            href="/"
            className="text-xl font-black"
          >
            AKN MOTOSİKLET
          </Link>

          <Link
            href="/sepet"
            className="rounded-xl border px-4 py-2 font-bold"
          >
            Sepete Dön
          </Link>
        </div>
      </header>

      <form
        onSubmit={submit}
        className="mx-auto grid max-w-7xl gap-6 px-4 py-8 lg:grid-cols-[1fr_380px]"
      >
        <div className="space-y-5">
          <section className="rounded-2xl border bg-white p-6">
            <h1 className="text-2xl font-black">
              Teslimat Bilgileri
            </h1>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <Field
                name="fullName"
                label="Ad Soyad"
              />

              <Field
                name="phone"
                label="Telefon"
                type="tel"
              />

              <Field
                name="email"
                label="E-posta"
                type="email"
              />

              <Field
                name="city"
                label="İl"
              />

              <Field
                name="district"
                label="İlçe"
              />

              <label className="md:col-span-2">
                <span className="mb-2 block text-sm font-bold">
                  Açık Adres
                </span>

                <textarea
                  required
                  name="address"
                  rows={4}
                  className="w-full rounded-xl border px-4 py-3"
                />
              </label>
            </div>
          </section>

          <section className="rounded-2xl border bg-white p-6">
            <h2 className="text-xl font-black">
              Fatura
            </h2>

            <div className="mt-4 flex gap-3">
              <button
                type="button"
                onClick={() =>
                  setInvoiceType(
                    "individual"
                  )
                }
                className={`rounded-xl px-4 py-3 font-bold ${
                  invoiceType ===
                  "individual"
                    ? "bg-slate-950 text-white"
                    : "border"
                }`}
              >
                Bireysel
              </button>

              <button
                type="button"
                onClick={() =>
                  setInvoiceType(
                    "corporate"
                  )
                }
                className={`rounded-xl px-4 py-3 font-bold ${
                  invoiceType ===
                  "corporate"
                    ? "bg-slate-950 text-white"
                    : "border"
                }`}
              >
                Kurumsal
              </button>
            </div>

            {invoiceType ===
              "corporate" && (
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <Field
                  name="companyName"
                  label="Firma Ünvanı"
                />

                <Field
                  name="taxOffice"
                  label="Vergi Dairesi"
                />

                <Field
                  name="taxNumber"
                  label="Vergi Numarası"
                />
              </div>
            )}
          </section>

          <section className="rounded-2xl border bg-white p-6">
            <h2 className="text-xl font-black">
              Kargo
            </h2>

            <label className="mt-4 flex cursor-pointer gap-3 rounded-xl border p-4">
              <input
                type="radio"
                name="shippingMethod"
                value="standard"
                defaultChecked
              />

              <div>
                <div className="font-black">
                  Standart Kargo
                </div>

                <div className="text-sm text-slate-500">
                  Anlaşmalı kargo ile gönderim
                </div>
              </div>
            </label>
          </section>

          <section className="rounded-2xl border bg-white p-6">
            <h2 className="text-xl font-black">
              Ödeme
            </h2>

            <div className="mt-4 space-y-3">
              <label className="flex cursor-pointer gap-3 rounded-xl border p-4">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="card"
                  defaultChecked
                />

                <div>
                  <div className="font-black">
                    Kredi / Banka Kartı
                  </div>

                  <div className="text-sm text-slate-500">
                    Ödeme kuruluşu daha sonra bağlanacak
                  </div>
                </div>
              </label>

              <label className="flex cursor-pointer gap-3 rounded-xl border p-4">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="transfer"
                />

                <div>
                  <div className="font-black">
                    Havale / EFT
                  </div>

                  <div className="text-sm text-slate-500">
                    Banka hesabına ödeme
                  </div>
                </div>
              </label>
            </div>
          </section>
        </div>

        <aside className="h-fit rounded-2xl border bg-white p-6 lg:sticky lg:top-5">
          <h2 className="text-xl font-black">
            Sipariş Özeti
          </h2>

          <div className="mt-5 space-y-4">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex justify-between gap-4 border-b pb-3 text-sm"
              >
                <div>
                  <div className="font-bold">
                    {item.name}
                  </div>

                  <div className="text-slate-500">
                    {item.quantity} adet
                  </div>
                </div>

                <strong>
                  ₺
                  {(
                    item.price *
                    item.quantity
                  ).toLocaleString(
                    "tr-TR",
                    {
                      minimumFractionDigits:
                        2,
                      maximumFractionDigits:
                        2,
                    }
                  )}
                </strong>
              </div>
            ))}
          </div>

          <div className="mt-5 flex justify-between">
            <span>
              Ürün Adedi
            </span>

            <strong>
              {itemCount}
            </strong>
          </div>

          <div className="mt-4 flex items-end justify-between border-t pt-5">
            <span className="font-bold">
              Toplam
            </span>

            <strong className="text-2xl">
              ₺
              {total.toLocaleString(
                "tr-TR",
                {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                }
              )}
            </strong>
          </div>

          <button
            type="submit"
            className="mt-6 w-full rounded-xl bg-red-600 py-4 text-lg font-black text-white"
          >
            Siparişi Onayla
          </button>
        </aside>
      </form>
    </main>
  );
}

function Field({
  name,
  label,
  type = "text",
}: {
  name: string;
  label: string;
  type?: string;
}) {
  return (
    <label>
      <span className="mb-2 block text-sm font-bold">
        {label}
      </span>

      <input
        required
        name={name}
        type={type}
        className="w-full rounded-xl border px-4 py-3"
      />
    </label>
  );
}