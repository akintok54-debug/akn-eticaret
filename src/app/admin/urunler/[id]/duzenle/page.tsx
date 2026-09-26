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
    addProduct,
    deleteProduct,
  } = useProducts();

  const { categories, brands } = useCatalog();

  const product = products.find(
    (item) => item.id === params.id
  );

  const [activeOverride, setActive] = useState<boolean | null>(null);
  const [extraImagesOverride, setExtraImages] = useState<string[] | null>(null);
  const active = activeOverride ?? product?.active ?? true;
  const extraImages = extraImagesOverride ?? product?.additionalImages ?? [];

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
      additionalImages: form.getAll("additionalImages").map(String).map((value) => value.trim()).filter(Boolean),
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

  async function handleCopy() {
    const copySku = `${currentProduct.sku}-KOPYA-${Date.now().toString().slice(-6)}`;
    const saved = await addProduct({
      id: crypto.randomUUID(),
      sku: copySku,
      barcode: "",
      name: `${currentProduct.name} - Kopya`,
      brand: currentProduct.brand,
      category: currentProduct.category,
      description: currentProduct.description,
      purchasePrice: currentProduct.purchasePrice,
      retailPrice: currentProduct.retailPrice,
      dealerPrice: currentProduct.dealerPrice,
      vatRate: currentProduct.vatRate,
      stock: 0,
      criticalStock: currentProduct.criticalStock,
      image: currentProduct.image,
      additionalImages: currentProduct.additionalImages || [],
      showcases: [],
      showcaseOrder: {},
      shippingStatus: currentProduct.shippingStatus || "Sistem",
      shippingWeight: currentProduct.shippingWeight || 0,
      extraDetail: currentProduct.extraDetail || "",
      seoTitle: currentProduct.seoTitle || "",
      seoDescription: currentProduct.seoDescription || "",
      active: false,
    });

    if (saved) {
      alert("Ürün kopyalandı. Kopya ürün güvenlik için pasif oluşturuldu.");
      router.push("/admin/urunler");
    }
  }

  async function handleDelete() {
    if (!window.confirm(`${currentProduct.name} pasife alınsın mı? Sipariş geçmişi korunacak.`)) return;
    const saved = await deleteProduct(currentProduct.id);
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

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50"
            >
              Ürünü Kopyala
            </button>
            <Link
              href={`/urun/${currentProduct.id}`}
              target="_blank"
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50"
            >
              Sitede Görüntüle
            </Link>
            <span className={`rounded-xl px-4 py-2 text-sm font-bold ${active ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"}`}>
              {active ? "Aktif" : "Pasif"}
            </span>
          </div>
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

            <div className="mt-4 flex flex-wrap gap-3">
              {currentProduct.image && (
                <Image width={128} height={128} unoptimized
                  src={currentProduct.image}
                  alt={currentProduct.name}
                  className="h-32 w-32 rounded-xl border bg-white object-contain"
                />
              )}
              {extraImages.filter(Boolean).map((src, index) => (
                <div key={`${src}-${index}`} className="relative">
                  <Image width={128} height={128} unoptimized
                    src={src}
                    alt={`${currentProduct.name} ${index + 2}`}
                    className="h-32 w-32 rounded-xl border bg-white object-contain"
                  />
                  <button
                    type="button"
                    onClick={() => setExtraImages(extraImages.filter((_, itemIndex) => itemIndex !== index))}
                    className="absolute -right-2 -top-2 h-7 w-7 rounded-full bg-red-600 text-sm font-black text-white shadow"
                    title="Görseli kaldır"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-4 space-y-2">
              {extraImages.map((src, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="url"
                    name="additionalImages"
                    value={src}
                    onChange={(event) => setExtraImages(extraImages.map((item, itemIndex) => itemIndex === index ? event.target.value : item))}
                    placeholder="Ek görsel URL"
                    className="min-w-0 flex-1 rounded-xl border px-4 py-3"
                  />
                  <button type="button" onClick={() => setExtraImages(extraImages.filter((_, itemIndex) => itemIndex !== index))} className="rounded-xl border border-red-200 px-3 font-bold text-red-600">
                    Sil
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setExtraImages([...extraImages, ""])}
                className="rounded-xl border border-dashed border-indigo-300 bg-indigo-50 px-4 py-3 text-sm font-bold text-indigo-700"
              >
                + Resim Ekle
              </button>
            </div>
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

        <div className="sticky bottom-4 z-20 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-xl backdrop-blur sm:flex-row">
          <button
            type="submit"
            className="flex-1 rounded-xl bg-red-600 py-4 text-lg font-black text-white hover:bg-red-700"
          >
            Değişiklikleri Kaydet
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="rounded-xl border border-red-200 bg-white px-6 py-4 font-black text-red-600 hover:bg-red-50"
          >
            Ürünü Pasife Al
          </button>
        </div>
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
