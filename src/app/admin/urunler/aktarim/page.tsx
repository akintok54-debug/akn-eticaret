"use client";

import Link from "next/link";
import {
  useRef,
  useState,
  type ChangeEvent,
} from "react";

import { useProducts } from "@/context/ProductContext";
import type { Product } from "@/types/product";

const HEADERS = [
  "stok_kodu",
  "barkod",
  "urun_adi",
  "marka",
  "kategori",
  "aciklama",
  "alis_fiyati",
  "perakende_fiyati",
  "bayi_fiyati",
  "kdv",
  "stok",
  "kritik_stok",
  "gorsel",
  "aktif",
];

function csvCell(value: unknown) {
  const text = String(value ?? "");

  if (
    text.includes(";") ||
    text.includes('"') ||
    text.includes("\n")
  ) {
    return `"${text.replace(/"/g, '""')}"`;
  }

  return text;
}

function parseLine(line: string) {
  const cells: string[] = [];
  let current = "";
  let quoted = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (
        quoted &&
        line[i + 1] === '"'
      ) {
        current += '"';
        i++;
      } else {
        quoted = !quoted;
      }
    } else if (
      char === ";" &&
      !quoted
    ) {
      cells.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  cells.push(current);

  return cells.map((value) => value.trim());
}

function numberValue(value: string) {
  const normalized = value
    .trim()
    .replace(/\s/g, "")
    .replace(",", ".");

  const number = Number(normalized);

  return Number.isFinite(number)
    ? number
    : 0;
}

function booleanValue(value: string) {
  const normalized =
    value.trim().toLocaleLowerCase("tr-TR");

  return ![
    "0",
    "false",
    "hayir",
    "hayır",
    "pasif",
  ].includes(normalized);
}

export default function ProductTransferPage() {
  const {
    products,
    addManyProducts,
  } = useProducts();

  const inputRef =
    useRef<HTMLInputElement>(null);

  const [preview, setPreview] =
    useState<Product[]>([]);

  const [fileName, setFileName] =
    useState("");

  function exportCsv() {
    const rows = products.map((product) => [
      product.sku,
      product.barcode,
      product.name,
      product.brand,
      product.category,
      product.description,
      product.purchasePrice,
      product.retailPrice,
      product.dealerPrice,
      product.vatRate,
      product.stock,
      product.criticalStock,
      product.image ?? "",
      product.active ? "1" : "0",
    ]);

    const csv =
      "\uFEFF" +
      [
        HEADERS.join(";"),
        ...rows.map((row) =>
          row.map(csvCell).join(";")
        ),
      ].join("\r\n");

    const blob = new Blob(
      [csv],
      {
        type: "text/csv;charset=utf-8;",
      }
    );

    const url =
      URL.createObjectURL(blob);

    const anchor =
      document.createElement("a");

    anchor.href = url;
    anchor.download =
      "akn-urunler.csv";

    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();

    URL.revokeObjectURL(url);
  }

  function downloadTemplate() {
    const example = [
      "AKN-001",
      "8690000000001",
      "Örnek Ürün",
      "Örnek Marka",
      "Motor Parçaları",
      "Ürün açıklaması",
      "100",
      "150",
      "130",
      "20",
      "10",
      "3",
      "",
      "1",
    ];

    const csv =
      "\uFEFF" +
      HEADERS.join(";") +
      "\r\n" +
      example.map(csvCell).join(";");

    const blob = new Blob(
      [csv],
      {
        type: "text/csv;charset=utf-8;",
      }
    );

    const url =
      URL.createObjectURL(blob);

    const anchor =
      document.createElement("a");

    anchor.href = url;
    anchor.download =
      "akn-urun-sablonu.csv";

    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();

    URL.revokeObjectURL(url);
  }

  function selectFile(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file =
      event.target.files?.[0];

    if (!file) return;

    setFileName(file.name);

    const reader =
      new FileReader();

    reader.onload = () => {
      const content =
        String(reader.result || "")
          .replace(/^\uFEFF/, "");

      const lines = content
        .split(/\r?\n/)
        .filter((line) => line.trim());

      if (lines.length < 2) {
        alert(
          "Dosyada ürün satırı bulunamadı."
        );
        return;
      }

      const headers =
        parseLine(lines[0]);

      const indexes =
        Object.fromEntries(
          headers.map((header, index) => [
            header
              .trim()
              .toLocaleLowerCase("tr-TR"),
            index,
          ])
        );

      const required = [
        "stok_kodu",
        "barkod",
        "urun_adi",
      ];

      const missing =
        required.filter(
          (header) =>
            indexes[header] === undefined
        );

      if (missing.length) {
        alert(
          "Eksik kolon: " +
          missing.join(", ")
        );

        return;
      }

      function value(
        row: string[],
        key: string
      ) {
        const index = indexes[key];

        return index === undefined
          ? ""
          : row[index] ?? "";
      }

      const parsed: Product[] = [];

      lines
        .slice(1)
        .forEach((line) => {
          const row =
            parseLine(line);

          const sku =
            value(row, "stok_kodu");

          const barcode =
            value(row, "barkod");

          const name =
            value(row, "urun_adi");

          if (!sku && !barcode && !name) {
            return;
          }

          parsed.push({
            id: crypto.randomUUID(),
            sku,
            barcode,
            name,
            brand:
              value(row, "marka") ||
              "Markasız",
            category:
              value(row, "kategori") ||
              "Genel",
            description:
              value(row, "aciklama"),
            purchasePrice:
              numberValue(
                value(row, "alis_fiyati")
              ),
            retailPrice:
              numberValue(
                value(
                  row,
                  "perakende_fiyati"
                )
              ),
            dealerPrice:
              numberValue(
                value(
                  row,
                  "bayi_fiyati"
                )
              ),
            vatRate:
              numberValue(
                value(row, "kdv")
              ),
            stock:
              numberValue(
                value(row, "stok")
              ),
            criticalStock:
              numberValue(
                value(
                  row,
                  "kritik_stok"
                )
              ),
            image:
              value(row, "gorsel") ||
              null,
            active:
              booleanValue(
                value(row, "aktif") ||
                "1"
              ),
          });
        });

      setPreview(parsed);
    };

    reader.readAsText(file, "UTF-8");
  }

  async function importProducts() {
    if (!preview.length) return;

    if (
      !window.confirm(
        `${preview.length} ürün içe aktarılsın mı? Aynı barkod veya stok koduna sahip ürünler güncellenecek.`
      )
    ) {
      return;
    }

    const result =
      await addManyProducts(preview);

    alert(
      `İşlem tamamlandı.\nYeni: ${result.added}\nGüncellenen: ${result.updated}\nBaşarısız: ${result.failed}`
    );

    setPreview([]);
    setFileName("");

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      <header className="bg-slate-950 text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5">
          <div className="font-black">
            AKN YÖNETİM
          </div>

          <Link
            href="/admin/urunler"
            className="rounded-xl border border-slate-700 px-4 py-2 font-bold"
          >
            Ürünlere Dön
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="text-sm font-black text-red-600">
          ÜRÜN AKTARIMI
        </div>

        <h1 className="text-3xl font-black">
          Excel / CSV Ürün Aktarımı
        </h1>

        <p className="mt-2 text-slate-500">
          Excel dosyanızı CSV UTF-8 biçiminde kaydederek toplu ürün aktarabilirsiniz.
        </p>

        <div className="mt-7 grid gap-5 md:grid-cols-2">
          <section className="rounded-2xl border bg-white p-6">
            <h2 className="text-xl font-black">
              Dışa Aktar
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Sistemdeki {products.length} ürünü CSV olarak alın.
            </p>

            <button
              type="button"
              onClick={exportCsv}
              className="mt-5 w-full rounded-xl bg-slate-900 py-3 font-black text-white"
            >
              Ürünleri CSV İndir
            </button>

            <button
              type="button"
              onClick={downloadTemplate}
              className="mt-3 w-full rounded-xl border py-3 font-black"
            >
              Boş Şablonu İndir
            </button>
          </section>

          <section className="rounded-2xl border bg-white p-6">
            <h2 className="text-xl font-black">
              İçe Aktar
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Önce CSV dosyanızı seçin. Kayıt yapılmadan önce ürünleri göstereceğiz.
            </p>

            <input
              ref={inputRef}
              type="file"
              accept=".csv,text/csv"
              onChange={selectFile}
              className="mt-5 block w-full rounded-xl border p-3"
            />

            {fileName && (
              <div className="mt-3 text-sm font-bold">
                Dosya: {fileName}
              </div>
            )}
          </section>
        </div>

        {preview.length > 0 && (
          <section className="mt-6 rounded-2xl border bg-white p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-black">
                  Aktarım Önizleme
                </h2>

                <p className="text-sm text-slate-500">
                  {preview.length} ürün bulundu.
                </p>
              </div>

              <button
                type="button"
                onClick={importProducts}
                className="rounded-xl bg-red-600 px-6 py-3 font-black text-white"
              >
                Ürünleri İçe Aktar
              </button>
            </div>

            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[850px] text-left text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="p-3">
                      Ürün
                    </th>
                    <th className="p-3">
                      Barkod
                    </th>
                    <th className="p-3">
                      Marka
                    </th>
                    <th className="p-3">
                      Kategori
                    </th>
                    <th className="p-3">
                      Perakende
                    </th>
                    <th className="p-3">
                      Bayi
                    </th>
                    <th className="p-3">
                      Stok
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {preview
                    .slice(0, 50)
                    .map((product) => (
                      <tr
                        key={product.id}
                        className="border-t"
                      >
                        <td className="p-3">
                          <strong>
                            {product.name}
                          </strong>
                          <div className="text-xs text-slate-500">
                            {product.sku}
                          </div>
                        </td>

                        <td className="p-3">
                          {product.barcode}
                        </td>

                        <td className="p-3">
                          {product.brand}
                        </td>

                        <td className="p-3">
                          {product.category}
                        </td>

                        <td className="p-3">
                          {product.retailPrice}
                        </td>

                        <td className="p-3">
                          {product.dealerPrice}
                        </td>

                        <td className="p-3">
                          {product.stock}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            {preview.length > 50 && (
              <div className="mt-3 text-sm text-slate-500">
                İlk 50 ürün gösteriliyor. Toplam: {preview.length}
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  );
}
