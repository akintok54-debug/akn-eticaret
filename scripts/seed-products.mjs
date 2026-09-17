const API = "http://localhost:3000/api/products";

const products = [
  {
    sku: "MOTUL-10W40",
    barcode: "8690000000001",
    name: "Motul Motosiklet Motor Yağı 10W-40",
    brand: "Motul",
    category: "Motor Yağları",
    description: "Motosiklet motor yağı 10W-40.",
    purchasePrice: 350,
    retailPrice: 450,
    dealerPrice: 390,
    vatRate: 20,
    stock: 24,
    criticalStock: 5,
    image: null,
    active: true
  },
  {
    sku: "BREMBO-BALATA",
    barcode: "8690000000002",
    name: "Brembo Ön Fren Balatası",
    brand: "Brembo",
    category: "Fren",
    description: "Motosiklet ön fren balatası.",
    purchasePrice: 240,
    retailPrice: 325,
    dealerPrice: 285,
    vatRate: 20,
    stock: 12,
    criticalStock: 4,
    image: null,
    active: true
  },
  {
    sku: "DID-ZINCIR-SET",
    barcode: "8690000000003",
    name: "DID Zincir Dişli Seti",
    brand: "DID",
    category: "Zincir ve Dişli",
    description: "Motosiklet zincir ve dişli seti.",
    purchasePrice: 950,
    retailPrice: 1250,
    dealerPrice: 1100,
    vatRate: 20,
    stock: 8,
    criticalStock: 3,
    image: null,
    active: true
  },
  {
    sku: "NGK-BUJI",
    barcode: "8690000000004",
    name: "NGK Buji",
    brand: "NGK",
    category: "Ateşleme",
    description: "NGK motosiklet bujisi.",
    purchasePrice: 120,
    retailPrice: 185,
    dealerPrice: 155,
    vatRate: 20,
    stock: 46,
    criticalStock: 10,
    image: null,
    active: true
  }
];

async function main() {
  const currentResponse = await fetch(API);
  const currentData = await currentResponse.json();

  if (!currentResponse.ok || !currentData.success) {
    throw new Error("Mevcut ürünler API'den alınamadı.");
  }

  const existingSkus = new Set(
    currentData.products.map((product) => product.sku)
  );

  let added = 0;
  let skipped = 0;

  for (const product of products) {
    if (existingSkus.has(product.sku)) {
      console.log("ATLANDI:", product.sku, "- zaten mevcut");
      skipped++;
      continue;
    }

    const response = await fetch(API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(product)
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      console.error("HATA:", product.sku, result);
      continue;
    }

    console.log("EKLENDI:", result.product.sku, "-", result.product.name);
    added++;
  }

  const finalResponse = await fetch(API);
  const finalData = await finalResponse.json();

  console.log("");
  console.log("AKTARIM TAMAMLANDI");
  console.log("Eklenen:", added);
  console.log("Atlanan:", skipped);
  console.log("Veritabanındaki toplam ürün:", finalData.count);
}

main().catch((error) => {
  console.error("");
  console.error("AKTARIM HATASI:");
  console.error(error);
  process.exitCode = 1;
});