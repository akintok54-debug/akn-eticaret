"use client";

import Link from "next/link";
import {
  useState,
  type FormEvent,
} from "react";

import { useCustomers } from "@/context/CustomerContext";
import { useOrders } from "@/context/OrderContext";

export default function AccountPage() {
  const {
    currentCustomer,
    registerRetail,
    loginByPhone,
    logout,
  } = useCustomers();

  const { orders } =
    useOrders();

  const [mode, setMode] =
    useState<"login" | "register">(
      "login"
    );

  function login(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const form =
      new FormData(
        event.currentTarget
      );

    const phone = String(
      form.get("phone") || ""
    ).trim();

    if (!loginByPhone(phone)) {
      alert(
        "Bu telefon numarasıyla kayıtlı müşteri bulunamadı."
      );
    }
  }

  function register(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const form =
      new FormData(
        event.currentTarget
      );

    registerRetail({
      id: crypto.randomUUID(),
      erpCustomerId: null,

      fullName: String(
        form.get("fullName") || ""
      ).trim(),

      phone: String(
        form.get("phone") || ""
      ).trim(),

      email: String(
        form.get("email") || ""
      ).trim(),

      city: String(
        form.get("city") || ""
      ).trim(),

      district: String(
        form.get("district") || ""
      ).trim(),

      address: String(
        form.get("address") || ""
      ).trim(),

      type: "retail",
      dealerStatus: "none",

      companyName: "",
      taxOffice: "",
      taxNumber: "",

      createdAt:
        new Date().toISOString(),
    });
  }

  if (currentCustomer) {
    const customerOrders =
      orders.filter(
        (order) =>
          order.customer.phone ===
          currentCustomer.phone
      );

    return (
      <main className="min-h-screen bg-slate-50 text-slate-900">
        <header className="border-b bg-white">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5">
            <Link
              href="/"
              className="text-xl font-black"
            >
              AKN MOTOSİKLET
            </Link>

            <button
              type="button"
              onClick={logout}
              className="rounded-xl border px-4 py-2 font-bold"
            >
              Çıkış Yap
            </button>
          </div>
        </header>

        <div className="mx-auto max-w-6xl px-4 py-8">
          <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
            <aside className="h-fit rounded-2xl border bg-white p-6">
              <div className="text-xs font-black text-red-600">
                HESABIM
              </div>

              <h1 className="mt-2 text-2xl font-black">
                {
                  currentCustomer.fullName
                }
              </h1>

              <div className="mt-4 space-y-2 text-sm">
                <div>
                  {
                    currentCustomer.phone
                  }
                </div>

                <div>
                  {
                    currentCustomer.email
                  }
                </div>

                <div>
                  {
                    currentCustomer.city
                  }{" "}
                  /{" "}
                  {
                    currentCustomer.district
                  }
                </div>
              </div>

              <div className="mt-5 rounded-xl bg-slate-100 p-4">
                <div className="text-xs font-bold text-slate-500">
                  HESAP TÜRÜ
                </div>

                <div className="mt-1 font-black">
                  {currentCustomer.type ===
                  "dealer"
                    ? "Bayi / B2B"
                    : "Perakende Müşteri"}
                </div>

                {currentCustomer.type ===
                  "dealer" && (
                  <div className="mt-1 text-sm">
                    Durum:{" "}
                    {
                      currentCustomer.dealerStatus
                    }
                  </div>
                )}
              </div>

              {currentCustomer.type !==
                "dealer" && (
                <Link
                  href="/bayi"
                  className="mt-4 block rounded-xl bg-slate-950 py-3 text-center font-black text-white"
                >
                  Bayi Başvurusu
                </Link>
              )}
            </aside>

            <section>
              <h2 className="text-2xl font-black">
                Siparişlerim
              </h2>

              {customerOrders.length ===
              0 ? (
                <div className="mt-4 rounded-2xl border bg-white p-8 text-center text-slate-500">
                  Bu hesaba ait sipariş bulunmuyor.
                </div>
              ) : (
                <div className="mt-4 space-y-3">
                  {customerOrders.map(
                    (order) => (
                      <div
                        key={order.id}
                        className="rounded-2xl border bg-white p-5"
                      >
                        <div className="flex justify-between gap-4">
                          <div>
                            <div className="font-black">
                              {
                                order.orderNumber
                              }
                            </div>

                            <div className="mt-1 text-sm text-slate-500">
                              {
                                order.status
                              }
                            </div>
                          </div>

                          <strong>
                            ₺
                            {order.total.toLocaleString(
                              "tr-TR",
                              {
                                minimumFractionDigits:
                                  2,
                              }
                            )}
                          </strong>
                        </div>
                      </div>
                    )
                  )}
                </div>
              )}
            </section>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-10 text-slate-900">
      <div className="mx-auto max-w-xl">
        <Link
          href="/"
          className="text-xl font-black"
        >
          AKN MOTOSİKLET
        </Link>

        <div className="mt-6 rounded-3xl border bg-white p-6">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() =>
                setMode("login")
              }
              className={`flex-1 rounded-xl py-3 font-black ${
                mode === "login"
                  ? "bg-slate-950 text-white"
                  : "border"
              }`}
            >
              Giriş
            </button>

            <button
              type="button"
              onClick={() =>
                setMode("register")
              }
              className={`flex-1 rounded-xl py-3 font-black ${
                mode === "register"
                  ? "bg-slate-950 text-white"
                  : "border"
              }`}
            >
              Kayıt Ol
            </button>
          </div>

          {mode === "login" ? (
            <form
              onSubmit={login}
              className="mt-6"
            >
              <h1 className="text-2xl font-black">
                Müşteri Girişi
              </h1>

              <p className="mt-2 text-sm text-slate-500">
                Geliştirme sürümünde kayıtlı telefon numarasıyla giriş yapılır.
              </p>

              <Field
                name="phone"
                label="Telefon"
                type="tel"
              />

              <button
                type="submit"
                className="mt-5 w-full rounded-xl bg-red-600 py-4 font-black text-white"
              >
                Giriş Yap
              </button>
            </form>
          ) : (
            <form
              onSubmit={register}
              className="mt-6"
            >
              <h1 className="text-2xl font-black">
                Yeni Müşteri
              </h1>

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

              <label className="mt-4 block">
                <span className="mb-2 block text-sm font-bold">
                  Adres
                </span>

                <textarea
                  required
                  name="address"
                  rows={3}
                  className="w-full rounded-xl border px-4 py-3"
                />
              </label>

              <button
                type="submit"
                className="mt-5 w-full rounded-xl bg-red-600 py-4 font-black text-white"
              >
                Hesap Oluştur
              </button>
            </form>
          )}

          <Link
            href="/bayi"
            className="mt-4 block text-center text-sm font-black text-red-600"
          >
            Bayi / B2B Başvurusu
          </Link>
        </div>
      </div>
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
    <label className="mt-4 block">
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