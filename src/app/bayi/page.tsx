"use client";

import Link from "next/link";
import {
  type FormEvent,
} from "react";

import { useCustomers } from "@/context/CustomerContext";

export default function DealerPage() {
  const {
    currentCustomer,
    applyDealer,
    isApprovedDealer,
  } = useCustomers();

  function submit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const form =
      new FormData(
        event.currentTarget
      );

    applyDealer({
      id:
        currentCustomer?.id ??
        crypto.randomUUID(),

      erpCustomerId:
        currentCustomer?.erpCustomerId ??
        null,

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

      type: "dealer",
      dealerStatus: "pending",

      companyName: String(
        form.get("companyName") || ""
      ).trim(),

      taxOffice: String(
        form.get("taxOffice") || ""
      ).trim(),

      taxNumber: String(
        form.get("taxNumber") || ""
      ).trim(),

      createdAt:
        currentCustomer?.createdAt ??
        new Date().toISOString(),
    });
  }

  if (isApprovedDealer) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-16">
        <div className="mx-auto max-w-xl rounded-3xl border bg-white p-10 text-center">
          <h1 className="text-3xl font-black">
            Bayi Hesabınız Aktif
          </h1>

          <p className="mt-3 text-slate-500">
            Mağazada bayi fiyatlarını kullanabilirsiniz.
          </p>

          <Link
            href="/urunler"
            className="mt-6 inline-block rounded-xl bg-red-600 px-6 py-3 font-black text-white"
          >
            Bayi Fiyatlarını Gör
          </Link>
        </div>
      </main>
    );
  }

  if (
    currentCustomer?.dealerStatus ===
    "pending"
  ) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-16">
        <div className="mx-auto max-w-xl rounded-3xl border bg-white p-10 text-center">
          <h1 className="text-3xl font-black">
            Bayi Başvurunuz Alındı
          </h1>

          <p className="mt-3 text-slate-500">
            Yönetici onayından sonra hesabınız bayi fiyatlarını kullanabilecek.
          </p>

          <Link
            href="/hesabim"
            className="mt-6 inline-block rounded-xl bg-slate-950 px-6 py-3 font-black text-white"
          >
            Hesabıma Dön
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-10 text-slate-900">
      <form
        onSubmit={submit}
        className="mx-auto max-w-2xl rounded-3xl border bg-white p-6"
      >
        <Link
          href="/"
          className="font-black"
        >
          AKN MOTOSİKLET
        </Link>

        <div className="mt-6 text-sm font-black text-red-600">
          B2B
        </div>

        <h1 className="text-3xl font-black">
          Bayi Başvurusu
        </h1>

        <p className="mt-2 text-slate-500">
          Başvurunuz yönetici onayından sonra bayi hesabına dönüşür.
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <Field
            name="fullName"
            label="Yetkili Ad Soyad"
            value={
              currentCustomer?.fullName
            }
          />

          <Field
            name="phone"
            label="Telefon"
            type="tel"
            value={
              currentCustomer?.phone
            }
          />

          <Field
            name="email"
            label="E-posta"
            type="email"
            value={
              currentCustomer?.email
            }
          />

          <Field
            name="companyName"
            label="Firma Ünvanı"
            value={
              currentCustomer?.companyName
            }
          />

          <Field
            name="taxOffice"
            label="Vergi Dairesi"
            value={
              currentCustomer?.taxOffice
            }
          />

          <Field
            name="taxNumber"
            label="Vergi Numarası"
            value={
              currentCustomer?.taxNumber
            }
          />

          <Field
            name="city"
            label="İl"
            value={
              currentCustomer?.city
            }
          />

          <Field
            name="district"
            label="İlçe"
            value={
              currentCustomer?.district
            }
          />

          <label className="md:col-span-2">
            <span className="mb-2 block text-sm font-bold">
              Adres
            </span>

            <textarea
              required
              name="address"
              defaultValue={
                currentCustomer?.address ??
                ""
              }
              rows={3}
              className="w-full rounded-xl border px-4 py-3"
            />
          </label>
        </div>

        <button
          type="submit"
          className="mt-6 w-full rounded-xl bg-red-600 py-4 text-lg font-black text-white"
        >
          Bayi Başvurusu Gönder
        </button>
      </form>
    </main>
  );
}

function Field({
  name,
  label,
  type = "text",
  value = "",
}: {
  name: string;
  label: string;
  type?: string;
  value?: string;
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
        defaultValue={value}
        className="w-full rounded-xl border px-4 py-3"
      />
    </label>
  );
}