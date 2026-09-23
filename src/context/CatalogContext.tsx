"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { useProducts } from "@/context/ProductContext";

type CatalogContextType = {
  categories: string[];
  brands: string[];
  addCategory: (name: string) => boolean;
  renameCategory: (oldName: string, newName: string) => boolean;
  deleteCategory: (name: string) => boolean;
  addBrand: (name: string) => boolean;
  renameBrand: (oldName: string, newName: string) => boolean;
  deleteBrand: (name: string) => boolean;
};

const CatalogContext = createContext<CatalogContextType | undefined>(
  undefined
);

function clean(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function unique(values: string[]) {
  return Array.from(
    new Map(
      values
        .map(clean)
        .filter(Boolean)
        .map((value) => [value.toLocaleLowerCase("tr-TR"), value])
    ).values()
  ).sort((a, b) => a.localeCompare(b, "tr"));
}

export function CatalogProvider({
  children,
}: {
  children: ReactNode;
}) {
  const { products, updateManyProducts } = useProducts();

  const productCategories = useMemo(
    () => unique(products.map((product) => product.category)),
    [products]
  );

  const productBrands = useMemo(
    () => unique(products.map((product) => product.brand)),
    [products]
  );

  const [categories, setCategories] = useState<string[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let savedCategories: string[] = [];
    let savedBrands: string[] = [];

    try {
      const rawCategories = localStorage.getItem("akn-categories");
      const rawBrands = localStorage.getItem("akn-brands");

      if (rawCategories) savedCategories = JSON.parse(rawCategories);
      if (rawBrands) savedBrands = JSON.parse(rawBrands);
    } catch {
      localStorage.removeItem("akn-categories");
      localStorage.removeItem("akn-brands");
    }

    // Hydrate locally saved catalog drafts; persisted products are merged below.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCategories(unique(savedCategories));
    setBrands(unique(savedBrands));
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) {
      localStorage.setItem("akn-categories", JSON.stringify(categories));
    }
  }, [categories, loaded]);

  useEffect(() => {
    if (loaded) {
      localStorage.setItem("akn-brands", JSON.stringify(brands));
    }
  }, [brands, loaded]);

  function exists(list: string[], name: string) {
    const target = clean(name).toLocaleLowerCase("tr-TR");

    return list.some(
      (item) => item.toLocaleLowerCase("tr-TR") === target
    );
  }

  function addCategory(name: string) {
    const value = clean(name);

    if (!value || exists(categories, value)) return false;

    setCategories((current) => unique([...current, value]));
    return true;
  }

  function renameCategory(oldName: string, newName: string) {
    const value = clean(newName);

    if (!value) return false;

    if (
      oldName.toLocaleLowerCase("tr-TR") !==
        value.toLocaleLowerCase("tr-TR") &&
      exists(categories, value)
    ) {
      return false;
    }

    setCategories((current) =>
      unique(
        current.map((item) => (item === oldName ? value : item))
      )
    );

    const ids = products
      .filter((product) => product.category === oldName)
      .map((product) => product.id);

    updateManyProducts(ids, (product) => ({
      ...product,
      category: value,
    }));

    return true;
  }

  function deleteCategory(name: string) {
    const inUse = products.some(
      (product) => product.category === name
    );

    if (inUse) return false;

    setCategories((current) =>
      current.filter((item) => item !== name)
    );

    return true;
  }

  function addBrand(name: string) {
    const value = clean(name);

    if (!value || exists(brands, value)) return false;

    setBrands((current) => unique([...current, value]));
    return true;
  }

  function renameBrand(oldName: string, newName: string) {
    const value = clean(newName);

    if (!value) return false;

    if (
      oldName.toLocaleLowerCase("tr-TR") !==
        value.toLocaleLowerCase("tr-TR") &&
      exists(brands, value)
    ) {
      return false;
    }

    setBrands((current) =>
      unique(
        current.map((item) => (item === oldName ? value : item))
      )
    );

    const ids = products
      .filter((product) => product.brand === oldName)
      .map((product) => product.id);

    updateManyProducts(ids, (product) => ({
      ...product,
      brand: value,
    }));

    return true;
  }

  function deleteBrand(name: string) {
    const inUse = products.some(
      (product) => product.brand === name
    );

    if (inUse) return false;

    setBrands((current) =>
      current.filter((item) => item !== name)
    );

    return true;
  }

  return (
    <CatalogContext.Provider
      value={{
        categories: unique([...categories, ...productCategories]),
        brands: unique([...brands, ...productBrands]),
        addCategory,
        renameCategory,
        deleteCategory,
        addBrand,
        renameBrand,
        deleteBrand,
      }}
    >
      {children}
    </CatalogContext.Provider>
  );
}

export function useCatalog() {
  const context = useContext(CatalogContext);

  if (!context) {
    throw new Error(
      "useCatalog must be used inside CatalogProvider"
    );
  }

  return context;
}
