"use client";

import Link from "next/link";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import {
  useState,
  type FormEvent,
  type ReactNode,
} from "react";

import { useProducts } from "@/context/ProductContext";
import { useCatalog } from "@/context/CatalogContext";

export default function EditProductPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const {
    products,
    loaded,
    updateProduct,
  } = useProducts();

  const { categories, brands } = useCatalog();

  const product = products.find(
    (item) => item.id === params.id
  );

  const [activeOverride, setActive] = useState<boolean | null>(null);
  const active = activeOverride ?? product?.active ?? true;

  if (!loaded) {
    return (
      <main className="min-h-screen bg-slate-100 p-8">
        <div className="mx-auto max-w-xl rounded-2xl border bg-white p-8 text-center font-bold">
          Ürün yükleniyor...
        </div>
      </main>
    );
  }

  if (!product) {
    return (
      <main className="min-h-screen bg-slate-100 p-8">
        <div className="mx-auto max-w-xl rounded-2xl border bg-white p-8 text-center">
          <h1 className="text-2xl font-black">
            Ürün bulunamadı
          </h1>

          <Link
            href="/admin/urunler"
            className="mt-5 inline-block rounded-xl bg-slate-900 px-5 py-3 font-bold text-white"
          >
            Ürünlere Dön
          </Link>
        </div>
      </main>
    );
  }

  const currentProduct = product;

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const form = new FormData(event.currentTarget);

    const saved = await updateProduct(currentProduct.id, {
      name: String(form.get("name") || "").trim(),
      sku: String(form.get("sku") || "").trim(),
      barcode: String(form.get("barcode") || "").trim(),
      brand: String(form.get("brand") || "").trim(),
      category: String(form.get("category") || "").trim(),
      description: String(
        form.get("description") || ""
      ).trim(),
      purchasePrice: Number(
        form.get("purchasePrice") || 0
      ),
      retailPrice: Number(
        form.get("retailPrice") || 0
      ),
      dealerPrice: Number(
        form.get("dealerPrice") || 0
      ),
      vatRate: Number(
        form.get("vatRate") || 0
      ),
      stock: Number(
        form.get("stock") || 0
      ),
      criticalStock: Number(
        form.get("criticalStock") || 0
      ),
      image:
        String(form.get("image") || "").trim() ||
        null,
      showcases: form.getAll("showcases").map(String),
      shippingStatus: String(form.get("shippingStatus") || "Sistem"),
      shippingWeight: Number(form.get("shippingWeight") || 0),
      extraDetail: String(form.get("extraDetail") || ""),
      seoTitle: String(form.get("seoTitle") || ""),
      seoDescription: String(form.get("seoDescription") || ""),
      active,
    });

    if (saved) router.push("/admin/urunler");
  }

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      <header className="bg-slate-950 text-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-5">
          <div className="font-black">
            AKN YÖNETİM
          </div>

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
            ÜRÜN DÜZENLE
          </div>

          <h1 className="text-3xl font-black">
            {currentProduct.name}
          </h1>
        </div>

        <Section title="Temel Bilgiler">
          <Field
            name="name"
            label="Ürün Adı"
            value={currentProduct.name}
          />

          <Field
            name="sku"
            label="Stok Kodu"
            value={currentProduct.sku}
          />

          <Field
            name="barcode"
            label="Barkod"
            value={currentProduct.barcode}
          />

          <SelectField
            name="brand"
            label="Marka"
            values={brands}
            value={currentProduct.brand}
          />

          <SelectField
            name="category"
            label="Kategori"
            values={categories}
            value={currentProduct.category}
          />

          <label className="md:col-span-2">
            <span className="mb-2 block text-sm font-bold">
              Açıklama
            </span>

            <textarea
              name="description"
              defaultValue={currentProduct.description}
              rows={4}
              className="w-full rounded-xl border px-4 py-3"
            />
          </label>
        </Section>

        <Section title="Fiyatlandırma">
          <NumberField
            name="purchasePrice"
            label="Alış Fiyatı"
            value={currentProduct.purchasePrice}
          />

          <NumberField
            name="retailPrice"
            label="Perakende Fiyatı"
            value={currentProduct.retailPrice}
          />

          <NumberField
            name="dealerPrice"
            label="Bayi Fiyatı"
            value={currentProduct.dealerPrice}
          />

          <NumberField
            name="vatRate"
            label="KDV %"
            value={currentProduct.vatRate}
          />
        </Section>

        <Section title="Stok">
          <NumberField
            name="stock"
            label="Mevcut Stok"
            value={currentProduct.stock}
          />

          <NumberField
            name="criticalStock"
            label="Kritik Stok"
            value={currentProduct.criticalStock}
          />
        </Section>

        <Section title="Ürün Görseli">
          <label className="md:col-span-2">
            <span className="mb-2 block text-sm font-bold">
              Görsel URL
            </span>

            <input
              type="url"
              name="image"
              defaultValue={currentProduct.image ?? ""}
              placeholder="https://..."
              className="w-full rounded-xl border px-4 py-3"
            />

            {currentProduct.image && (
              <Image width={160} height={160} unoptimized
                src={currentProduct.image}
                alt={currentProduct.name}
                className="mt-4 h-40 w-40 rounded-xl border object-contain"
              />
            )}
          </label>
        </Section>

        <Section title="Vitrin Düzeni">
          <div className="md:col-span-2 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {["Anasayfa","Popüler","Kategori","Marka","Yeni","Sponsor","İndirimli"].map((v)=><label key={v} className="flex items-center gap-2 rounded-xl border p-3"><input type="checkbox" name="showcases" value={v} defaultChecked={(currentProduct.showcases||[]).includes(v)}/>{v}</label>)}
          </div>
        </Section>

        <Section title="Kargo">
          <label><span className="mb-2 block text-sm font-bold">Özel Kargo Durumu</span><select name="shippingStatus" defaultValue={currentProduct.shippingStatus||"Sistem"} className="w-full rounded-xl border px-4 py-3"><option>Sistem</option><option>Ücretsiz Kargo</option><option>Sabit Kargo</option><option>Kargo Yok</option></select></label>
          <NumberField name="shippingWeight" label="Kargo Ağırlığı / Desi" value={currentProduct.shippingWeight||0}/>
        </Section>

        <Section title="Ekstra Detay">
          <label className="md:col-span-2"><textarea name="extraDetail" defaultValue={currentProduct.extraDetail||""} rows={5} className="w-full rounded-xl border px-4 py-3" placeholder="Ürüne ait ek bilgiler"/></label>
        </Section>

        <Section title="SEO Bilgileri">
          <Field name="seoTitle" label="SEO Başlığı" value={currentProduct.seoTitle||""}/>
          <label><span className="mb-2 block text-sm font-bold">SEO Açıklaması</span><textarea name="seoDescription" defaultValue={currentProduct.seoDescription||""} rows={3} className="w-full rounded-xl border px-4 py-3"/></label>
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
          Değişiklikleri Kaydet
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
  value,
}: {
  name: string;
  label: string;
  value: string;
}) {
  return (
    <label>
      <span className="mb-2 block text-sm font-bold">
        {label}
      </span>

      <input
        required
        name={name}
        defaultValue={value}
        className="w-full rounded-xl border px-4 py-3"
      />
    </label>
  );
}

function SelectField({
  name,
  label,
  values,
  value,
}: {
  name: string;
  label: string;
  values: string[];
  value: string;
}) {
  const options = values.includes(value)
    ? values
    : [value, ...values];

  return (
    <label>
      <span className="mb-2 block text-sm font-bold">
        {label}
      </span>

      <select
        required
        name={name}
        defaultValue={value}
        className="w-full rounded-xl border bg-white px-4 py-3"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function NumberField({
  name,
  label,
  value,
}: {
  name: string;
  label: string;
  value: number;
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
        defaultValue={value}
        className="w-full rounded-xl border px-4 py-3"
      />
    </label>
  );
}
