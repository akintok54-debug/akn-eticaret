"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import type { Product } from "@/types/product";

type ProductContextType = {
  products: Product[];
  loaded: boolean;
  addProduct: (product: Product) => void;
  addManyProducts: (incoming: Product[]) => {
    added: number;
    updated: number;
  };
  updateProduct: (
    id: string,
    changes: Partial<Product>
  ) => void;
  updateManyProducts: (
    ids: string[],
    updater: (product: Product) => Product
  ) => void;
  deleteProduct: (id: string) => void;
  toggleProduct: (id: string) => void;
  changeStock: (id: string, amount: number) => void;
  refreshProducts: () => Promise<void>;
};

const ProductContext =
  createContext<ProductContextType | undefined>(undefined);

function normalizeProduct(product: any): Product {
  return {
    id: String(product.id),
    sku: product.sku ?? "",
    barcode: product.barcode ?? "",
    name: product.name ?? "",
    brand: product.brand ?? "",
    category: product.category ?? "",
    description: product.description ?? "",
    purchasePrice: Number(product.purchasePrice ?? 0),
    retailPrice: Number(product.retailPrice ?? 0),
    dealerPrice: Number(product.dealerPrice ?? 0),
    vatRate: Number(product.vatRate ?? 20),
    stock: Number(product.stock ?? 0),
    criticalStock: Number(product.criticalStock ?? 0),
    image: product.image ?? null,
    active: Boolean(product.active),
  };
}

function apiProduct(product: Product) {
  return {
    sku: product.sku,
    barcode: product.barcode?.trim()
      ? product.barcode.trim()
      : null,
    name: product.name,
    brand: product.brand,
    category: product.category,
    description: product.description ?? "",
    purchasePrice: Number(product.purchasePrice),
    retailPrice: Number(product.retailPrice),
    dealerPrice: Number(product.dealerPrice),
    vatRate: Number(product.vatRate),
    stock: Number(product.stock),
    criticalStock: Number(product.criticalStock),
    image: product.image?.trim()
      ? product.image.trim()
      : null,
    active: Boolean(product.active),
  };
}

export function ProductProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loaded, setLoaded] = useState(false);

  async function refreshProducts() {
    try {
      const response = await fetch("/api/products", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ?? "Ürünler alınamadı."
        );
      }

      setProducts(
        data.products.map(normalizeProduct)
      );
    } catch (error) {
      console.error(
        "Ürün veritabanı okunamadı:",
        error
      );
    } finally {
      setLoaded(true);
    }
  }

  useEffect(() => {
    void refreshProducts();
  }, []);

  function addProduct(product: Product) {
    setProducts((current) => [
      product,
      ...current,
    ]);

    void (async () => {
      try {
        const response = await fetch("/api/products", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(apiProduct(product)),
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(
            data.message ?? "Ürün eklenemedi."
          );
        }

        await refreshProducts();
      } catch (error) {
        console.error("Ürün ekleme hatası:", error);
        await refreshProducts();
      }
    })();
  }

  function addManyProducts(incoming: Product[]) {
    let added = 0;
    let updated = 0;

    const currentProducts = [...products];

    for (const incomingProduct of incoming) {
      const existing = currentProducts.find(
        (product) =>
          (incomingProduct.barcode &&
            product.barcode ===
              incomingProduct.barcode) ||
          (incomingProduct.sku &&
            product.sku === incomingProduct.sku)
      );

      if (existing) {
        updated++;
      } else {
        added++;
      }
    }

    void (async () => {
      try {
        for (const incomingProduct of incoming) {
          const existing = products.find(
            (product) =>
              (incomingProduct.barcode &&
                product.barcode ===
                  incomingProduct.barcode) ||
              (incomingProduct.sku &&
                product.sku ===
                  incomingProduct.sku)
          );

          if (existing) {
            await fetch(
              `/api/products/${existing.id}`,
              {
                method: "PATCH",
                headers: {
                  "Content-Type":
                    "application/json",
                },
                body: JSON.stringify(
                  apiProduct(incomingProduct)
                ),
              }
            );
          } else {
            await fetch("/api/products", {
              method: "POST",
              headers: {
                "Content-Type":
                  "application/json",
              },
              body: JSON.stringify(
                apiProduct(incomingProduct)
              ),
            });
          }
        }

        await refreshProducts();
      } catch (error) {
        console.error(
          "Toplu ürün aktarım hatası:",
          error
        );

        await refreshProducts();
      }
    })();

    return { added, updated };
  }

  function updateProduct(
    id: string,
    changes: Partial<Product>
  ) {
    setProducts((current) =>
      current.map((product) =>
        product.id === id
          ? { ...product, ...changes }
          : product
      )
    );

    void (async () => {
      try {
        const response = await fetch(
          `/api/products/${id}`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(changes),
          }
        );

        if (!response.ok) {
          throw new Error(
            "Ürün güncellenemedi."
          );
        }

        await refreshProducts();
      } catch (error) {
        console.error(
          "Ürün güncelleme hatası:",
          error
        );

        await refreshProducts();
      }
    })();
  }

  function updateManyProducts(
    ids: string[],
    updater: (product: Product) => Product
  ) {
    const selected = new Set(ids);

    const updates = products
      .filter((product) =>
        selected.has(product.id)
      )
      .map((product) => updater(product));

    setProducts((current) =>
      current.map((product) => {
        const updated = updates.find(
          (item) => item.id === product.id
        );

        return updated ?? product;
      })
    );

    void (async () => {
      try {
        for (const product of updates) {
          await fetch(
            `/api/products/${product.id}`,
            {
              method: "PATCH",
              headers: {
                "Content-Type":
                  "application/json",
              },
              body: JSON.stringify(
                apiProduct(product)
              ),
            }
          );
        }

        await refreshProducts();
      } catch (error) {
        console.error(
          "Toplu güncelleme hatası:",
          error
        );

        await refreshProducts();
      }
    })();
  }

  function deleteProduct(id: string) {
    setProducts((current) =>
      current.filter(
        (product) => product.id !== id
      )
    );

    void (async () => {
      try {
        const response = await fetch(
          `/api/products/${id}`,
          {
            method: "DELETE",
          }
        );

        if (!response.ok) {
          throw new Error(
            "Ürün silinemedi."
          );
        }
      } catch (error) {
        console.error(
          "Ürün silme hatası:",
          error
        );

        await refreshProducts();
      }
    })();
  }

  function toggleProduct(id: string) {
    const product = products.find(
      (item) => item.id === id
    );

    if (!product) return;

    updateProduct(id, {
      active: !product.active,
    });
  }

  function changeStock(
    id: string,
    amount: number
  ) {
    setProducts((current) =>
      current.map((product) =>
        product.id === id
          ? {
              ...product,
              stock: Math.max(
                0,
                product.stock + amount
              ),
            }
          : product
      )
    );

    void (async () => {
      try {
        const response = await fetch(
          `/api/products/${id}/stock`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              amount,
            }),
          }
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(
            data.message ??
              "Stok değiştirilemedi."
          );
        }

        await refreshProducts();
      } catch (error) {
        console.error(
          "Stok güncelleme hatası:",
          error
        );

        await refreshProducts();
      }
    })();
  }

  return (
    <ProductContext.Provider
      value={{
        products,
        loaded,
        addProduct,
        addManyProducts,
        updateProduct,
        updateManyProducts,
        deleteProduct,
        toggleProduct,
        changeStock,
        refreshProducts,
      }}
    >
      {children}
    </ProductContext.Provider>
  );
}

export function useProducts() {
  const context = useContext(ProductContext);

  if (!context) {
    throw new Error(
      "useProducts must be used inside ProductProvider"
    );
  }

  return context;
}