export type Product = {
  id: string;
  sku: string;
  barcode: string;
  name: string;
  brand: string;
  category: string;
  description: string;

  purchasePrice: number;
  retailPrice: number;
  dealerPrice: number;

  vatRate: number;

  stock: number;
  criticalStock: number;

  image: string | null;

  active: boolean;
};
