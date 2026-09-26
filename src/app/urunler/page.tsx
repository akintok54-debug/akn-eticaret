"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import StoreHeader from "@/components/layout/StoreHeader";
import StoreFooter from "@/components/layout/StoreFooter";
import StoreProductCard from "@/components/product/StoreProductCard";
import { useProducts } from "@/context/ProductContext";
import { store } from "@/lib/store";
import {useStoreDesign} from "@/context/StoreDesignContext";

function Catalog() {
    const {productsPerPage}=useStoreDesign();
    const [page,setPage]=useState(1);
    const params = useSearchParams();
    const { products, loaded, error, refreshProducts } = useProducts();

    const urlQuery = params.get("q") ?? "";
    const urlCategory = params.get("category") ?? "";
    const urlBrand = params.get("brand") ?? "";

    const [query, setQuery] = useState(urlQuery);
    const [category, setCategory] = useState(urlCategory);
    const [brand, setBrand] = useState(urlBrand);
    const [sort, setSort] = useState("default");
    const [inStock, setInStock] = useState(false);

    const active = products.filter((p) => p.active);

    const categories = useMemo(() => {
        const productCategories = active.map((p) => p.category);

        return Array.from(
            new Set([
                ...store.categories,
                ...productCategories,
                ...(category ? [category] : []),
            ])
        ).sort((a, b) => a.localeCompare(b, "tr"));
    }, [active, category]);

    const brands = Array.from(
        new Set(active.map((p) => p.brand))
    ).sort((a, b) => a.localeCompare(b, "tr"));

    const q = query.trim().toLocaleLowerCase("tr-TR");

    const filtered = active
        .filter((p) => {
            const matchesQuery =
                !q ||
                [p.name, p.sku, p.barcode, p.brand].some((value) =>
                    (value || "")
                        .toLocaleLowerCase("tr-TR")
                        .includes(q)
                );

            // Ana kategori seçilirse alt kategorileri de getir.
            // Örnek:
            // Motor & Mekanik
            // Motor & Mekanik > Yakıt Sistemi
            // Motor & Mekanik > Soğutma & Devirdaim
            const matchesCategory =
                !category ||
                p.category === category ||
                p.category.startsWith(`${category} >`);

            const matchesBrand =
                !brand || p.brand === brand;

            const matchesStock =
                !inStock || p.stock > 0;

            return (
                matchesQuery &&
                matchesCategory &&
                matchesBrand &&
                matchesStock
            );
        })
        .sort((a, b) =>
            sort === "asc"
                ? a.retailPrice - b.retailPrice
                : sort === "desc"
                    ? b.retailPrice - a.retailPrice
                    : sort === "name"
                        ? a.name.localeCompare(b.name, "tr")
                        : 0
        );

    const pageCount=Math.max(1,Math.ceil(filtered.length/productsPerPage));
    const currentPage=Math.min(page,pageCount);
    return (
        <>
            <StoreHeader />

            <main className="store-container">
                <div className="page-heading">
                    <p>
                        <Link href="/">Ana sayfa</Link> / Ürünler
                    </p>

                    <span className="overline">
                        AKN MOTOSİKLET KATALOĞU
                    </span>

                    <h1>{category || "Tüm ürünler"}</h1>
                </div>

                <div className="catalog-layout">
                    <aside className="catalog-filters">
                        <label>
                            Ürün ara
                            <input
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Ürün, marka, stok kodu"
                            />
                        </label>

                        <label>
                            Kategori
                            <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                            >
                                <option value="">Tüm kategoriler</option>

                                {categories.map((c) => (
                                    <option key={c} value={c}>
                                        {c}
                                    </option>
                                ))}
                            </select>
                        </label>

                        <label>
                            Marka
                            <select
                                value={brand}
                                onChange={(e) => setBrand(e.target.value)}
                            >
                                <option value="">Tüm markalar</option>

                                {brands.map((b) => (
                                    <option key={b} value={b}>
                                        {b}
                                    </option>
                                ))}
                            </select>
                        </label>

                        <label
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 9,
                            }}
                        >
                            <input
                                style={{ width: 16, margin: 0 }}
                                type="checkbox"
                                checked={inStock}
                                onChange={(e) =>
                                    setInStock(e.target.checked)
                                }
                            />
                            Yalnızca stoktakiler
                        </label>

                        <button
                            className="text-xs underline"
                            onClick={() => {
                                setQuery("");
                                setCategory("");
                                setBrand("");
                                setInStock(false);
                            }}
                        >
                            Filtreleri temizle
                        </button>
                    </aside>

                    <section>
                        <div className="catalog-toolbar">
                            <span>
                                {loaded
                                    ? `${filtered.length} ürün bulundu`
                                    : "Ürünler yükleniyor…"}
                            </span>

                            <select
                                aria-label="Ürün sıralaması"
                                value={sort}
                                onChange={(e) => setSort(e.target.value)}
                            >
                                <option value="default">
                                    Önerilen sıralama
                                </option>
                                <option value="asc">
                                    Fiyat: düşükten yükseğe
                                </option>
                                <option value="desc">
                                    Fiyat: yüksekten düşüğe
                                </option>
                                <option value="name">
                                    Ürün adı: A–Z
                                </option>
                            </select>
                        </div>

                        {error ? (
                            <div role="alert" className="catalog-message">
                                {error}
                                <button onClick={() => void refreshProducts()}>
                                    Tekrar dene
                                </button>
                            </div>
                        ) : !loaded ? (
                            <div role="status" className="catalog-message">
                                Katalog hazırlanıyor…
                            </div>
                        ) : filtered.length ? (
                            <div className="product-grid">
                                {filtered.slice((currentPage-1)*productsPerPage,currentPage*productsPerPage).map((p) => (
                                    <StoreProductCard
                                        key={p.id}
                                        product={p}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="catalog-message">
                                Aramanıza uygun ürün bulunamadı. Filtreleri
                                değiştirerek tekrar deneyin.
                            </div>
                        )}
                        {loaded&&!error&&filtered.length>0&&<nav className="catalog-pagination" aria-label="Ürün sayfaları"><button disabled={currentPage===1} onClick={()=>setPage(currentPage-1)}>← Önceki</button><span>Sayfa {currentPage} / {pageCount}</span><button disabled={currentPage===pageCount} onClick={()=>setPage(currentPage+1)}>Sonraki →</button></nav>}
                    </section>
                </div>
            </main>

            <StoreFooter />
        </>
    );
}

function CatalogRoute() {
    const params = useSearchParams();
    return <Catalog key={params.toString()} />;
}

export default function ProductsPage() {
    return (
        <Suspense
            fallback={
                <div className="catalog-message">
                    Katalog yükleniyor…
                </div>
            }
        >
            <CatalogRoute />
        </Suspense>
    );
}