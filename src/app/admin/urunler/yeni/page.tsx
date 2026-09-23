"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent, type ReactNode } from "react";
import { useProducts } from "@/context/ProductContext";
import { useCatalog } from "@/context/CatalogContext";

export default function NewProductPage() {
  const router = useRouter();
  const { addProduct } = useProducts();
  const { categories, brands } = useCatalog();

  const [active, setActive] = useState(true);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = new FormData(event.currentTarget);

    const saved = await addProduct({
      id: crypto.randomUUID(),
      sku: String(form.get("sku") || "").trim(),
      barcode: String(form.get("barcode") || "").trim(),
      name: String(form.get("name") || "").trim(),
      brand: String(form.get("brand") || "").trim(),
      category: String(form.get("category") || "").trim(),
      description: String(form.get("description") || "").trim(),
      purchasePrice: Number(form.get("purchasePrice") || 0),
      retailPrice: Number(form.get("retailPrice") || 0),
      dealerPrice: Number(form.get("dealerPrice") || 0),
      vatRate: Number(form.get("vatRate") || 0),
      stock: Number(form.get("stock") || 0),
      criticalStock: Number(form.get("criticalStock") || 0),
      image: String(form.get("image") || "").trim() || null,
      active,
    });

    if (saved) router.push("/admin/urunler");
  }

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      <header className="bg-slate-950 text-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-5">
          <div className="font-black">AKN YÖNETİM</div>

          <Link
            href="/admin/urunler"
            className="rounded-xl border border-slate-700 px-4 py-2 font-bold"
          >
            İptal
          </Link>
        </div>
      </header>

      <form
        onSubmit={handleSubmit}
        className="mx-auto max-w-5xl space-y-6 px-4 py-8"
      >
        <div>
          <div className="text-sm font-black text-red-600">
            YENİ ÜRÜN
          </div>

          <h1 className="text-3xl font-black">
            Ürün Oluştur
          </h1>
        </div>

        <Section title="Temel Bilgiler">
          <Field name="name" label="Ürün Adı" />

          <Field name="sku" label="Stok Kodu" />

          <Field name="barcode" label="Barkod" />

          <SelectField
            name="brand"
            label="Marka"
            values={brands}
          />

          <SelectField
            name="category"
            label="Kategori"
            values={categories}
          />

          <label className="md:col-span-2">
            <span className="mb-2 block text-sm font-bold">
              Açıklama
            </span>

            <textarea
              name="description"
              rows={4}
              className="w-full rounded-xl border px-4 py-3"
            />
          </label>
        </Section>

        <Section title="Fiyatlandırma">
          <NumberField
            name="purchasePrice"
            label="Alış Fiyatı"
          />

          <NumberField
            name="retailPrice"
            label="Perakende Fiyatı"
          />

          <NumberField
            name="dealerPrice"
            label="Bayi Fiyatı"
          />

          <NumberField
            name="vatRate"
            label="KDV %"
            defaultValue={20}
          />
        </Section>

        <Section title="Stok">
          <NumberField
            name="stock"
            label="Mevcut Stok"
          />

          <NumberField
            name="criticalStock"
            label="Kritik Stok"
          />
        </Section>

        <Section title="Ürün Görseli">
          <label className="md:col-span-2">
            <span className="mb-2 block text-sm font-bold">
              Görsel URL
            </span>

            <input
              name="image"
              type="url"
              placeholder="https://..."
              className="w-full rounded-xl border px-4 py-3"
            />

            <span className="mt-2 block text-xs text-slate-500">
              Şimdilik görsel bağlantısı kullanılıyor. Gerçek dosya yükleme sistemi sunucu depolamasıyla bağlanacak.
            </span>
          </label>
        </Section>

        <section className="rounded-2xl border bg-white p-6">
          <label className="flex items-center justify-between">
            <div>
              <div className="font-black">
                Ürün Aktif
              </div>

              <div className="text-sm text-slate-500">
                Pasif ürün mağazada gösterilmez.
              </div>
            </div>

            <input
              type="checkbox"
              checked={active}
              onChange={(event) =>
                setActive(event.target.checked)
              }
              className="h-5 w-5"
            />
          </label>
        </section>

        <button
          type="submit"
          className="w-full rounded-xl bg-red-600 py-4 text-lg font-black text-white"
        >
          Ürünü Kaydet
        </button>
      </form>
    </main>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border bg-white p-6">
      <h2 className="mb-5 text-xl font-black">
        {title}
      </h2>

      <div className="grid gap-4 md:grid-cols-2">
        {children}
      </div>
    </section>
  );
}

function Field({
  name,
  label,
}: {
  name: string;
  label: string;
}) {
  return (
    <label>
      <span className="mb-2 block text-sm font-bold">
        {label}
      </span>

      <input
        required
        name={name}
        className="w-full rounded-xl border px-4 py-3"
      />
    </label>
  );
}

function SelectField({
  name,
  label,
  values,
}: {
  name: string;
  label: string;
  values: string[];
}) {
  return (
    <label>
      <span className="mb-2 block text-sm font-bold">
        {label}
      </span>

      <select
        required
        name={name}
        defaultValue=""
        className="w-full rounded-xl border bg-white px-4 py-3"
      >
        <option value="" disabled>
          Seçiniz
        </option>

        {values.map((value) => (
          <option key={value} value={value}>
            {value}
          </option>
        ))}
      </select>
    </label>
  );
}

function NumberField({
  name,
  label,
  defaultValue = 0,
}: {
  name: string;
  label: string;
  defaultValue?: number;
}) {
  return (
    <label>
      <span className="mb-2 block text-sm font-bold">
        {label}
      </span>

      <input
        required
        type="number"
        min="0"
        step="0.01"
        name={name}
        defaultValue={defaultValue}
        className="w-full rounded-xl border px-4 py-3"
      />
    </label>
  );
}
