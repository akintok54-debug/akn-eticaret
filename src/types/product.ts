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
  additionalImages?: string[];
  showcases?: string[];
  showcaseOrder?: Record<string, number>;
  shippingStatus?: string;
  shippingWeight?: number;
  extraDetail?: string;
  seoTitle?: string;
  seoDescription?: string;

  active: boolean;
};
