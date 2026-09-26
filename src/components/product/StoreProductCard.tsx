"use client";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useCart } from "@/context/CartContext";
import { money } from "@/lib/store";
import {useStoreDesign} from "@/context/StoreDesignContext";
import type { Product } from "@/types/product";
export default function StoreProductCard({ product }: { product: Product }) {
 const design=useStoreDesign();
 const { addItem, items } = useCart();
 const [added, setAdded] = useState(false);
 const remaining = product.stock - (items.find(i=>i.id===product.id)?.quantity ?? 0);
 return <article className="product-card"><Link href={`/urun/${product.id}`} className="product-picture" aria-label={product.name}><span className="product-tag">{product.category}</span>{product.image ? <Image src={product.image} alt={product.name} fill unoptimized sizes="(max-width: 640px) 50vw, 25vw" style={{objectFit:"contain",padding:28}}/> : <div className="part-placeholder"><svg width="90" height="90" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="50" cy="50" r="31"/><circle cx="50" cy="50" r="17"/><circle cx="50" cy="50" r="5"/>{[0,60,120,180,240,300].map(a=><path key={a} d="M47 11h6v11h-6z" transform={`rotate(${a} 50 50)`}/>)}</svg><span>AKN</span><small>Ürün görseli hazırlanıyor</small></div>}</Link><div className="product-info"><span className="product-brand">{product.brand}</span><Link href={`/urun/${product.id}`}><h3>{product.name}</h3></Link>{design.productCode&&<span className="product-sku">Stok kodu: {product.sku}</span>}{design.stockStatus&&<div className="product-stock">{product.stock>0 ? "● Stokta" : "○ Stokta yok"}</div>}{design.showPrices&&<div className="product-price">{money(product.retailPrice)}<small>KDV dahil</small></div>}{design.quickBuy&&<button disabled={remaining<=0} onClick={()=>{addItem({id:product.id,name:product.name,price:product.retailPrice,image:product.image});setAdded(true);}} className="product-add">{remaining<=0 ? "Stok sınırına ulaşıldı" : added ? "✓ Tekrar ekle" : "Sepete ekle"}<span aria-hidden="true">＋</span></button>}<span className="sr-only" role="status">{added ? `${product.name} sepete eklendi` : ""}</span></div></article>;
}

