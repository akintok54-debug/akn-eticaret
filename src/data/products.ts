import type { Product } from "@/types/product";

export const products: Product[] = [
  {
    id: "1",
    sku: "AKN-YAG-001",
    barcode: "8690000000011",
    name: "Motosiklet Motor Yağı 10W-40",
    brand: "Motul",
    category: "Yağ & Bakım",
    description: "4 zamanlı motosikletler için motor yağı.",
    purchasePrice: 300,
    retailPrice: 450,
    dealerPrice: 390,
    vatRate: 20,
    stock: 24,
    criticalStock: 5,
    image: null,
    active: true,
  },
  {
    id: "2",
    sku: "AKN-FRN-001",
    barcode: "8690000000028",
    name: "Ön Fren Balatası",
    brand: "Brembo",
    category: "Fren",
    description: "Motosiklet ön fren balatası.",
    purchasePrice: 210,
    retailPrice: 325,
    dealerPrice: 285,
    vatRate: 20,
    stock: 12,
    criticalStock: 4,
    image: null,
    active: true,
  },
  {
    id: "3",
    sku: "AKN-ZNC-001",
    barcode: "8690000000035",
    name: "Zincir Dişli Seti",
    brand: "DID",
    category: "Zincir & Dişli",
    description: "Motosiklet zincir ve dişli seti.",
    purchasePrice: 850,
    retailPrice: 1250,
    dealerPrice: 1100,
    vatRate: 20,
    stock: 8,
    criticalStock: 3,
    image: null,
    active: true,
  },
  {
    id: "4",
    sku: "AKN-BUJ-001",
    barcode: "8690000000042",
    name: "NGK Buji",
    brand: "NGK",
    category: "Motor Parçaları",
    description: "Motosiklet ateşleme bujisi.",
    purchasePrice: 110,
    retailPrice: 185,
    dealerPrice: 155,
    vatRate: 20,
    stock: 46,
    criticalStock: 10,
    image: null,
    active: true,
  },
];

export function getProductById(id: string) {
  return products.find((product) => product.id === id);
}

export function getProductByBarcode(barcode: string) {
  return products.find((product) => product.barcode === barcode);
}
