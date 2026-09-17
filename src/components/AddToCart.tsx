"use client";

import { useState } from "react";
import { useCart } from "@/context/CartContext";

type AddToCartProps = {
  product: {
    id: string;
    name: string;
    price: number;
    image: string | null;
    stock: number;
  };
};

export default function AddToCart({ product }: AddToCartProps) {
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  function handleAddToCart() {
    const safeQuantity = Math.max(
      1,
      Math.min(quantity, product.stock)
    );

    addItem(
      {
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
      },
      safeQuantity
    );

    setAdded(true);

    setTimeout(() => {
      setAdded(false);
    }, 2000);
  }

  return (
    <div className="mt-7">
      <div className="flex gap-3">
        <input
          type="number"
          min="1"
          max={product.stock}
          value={quantity}
          onChange={(event) =>
            setQuantity(
              Math.max(
                1,
                Math.min(
                  Number(event.target.value) || 1,
                  product.stock
                )
              )
            )
          }
          className="w-24 rounded-xl border px-4 text-center font-bold"
        />

        <button
          type="button"
          onClick={handleAddToCart}
          disabled={product.stock <= 0}
          className="flex-1 rounded-xl bg-red-600 px-6 py-4 font-black text-white disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {product.stock > 0 ? "Sepete Ekle" : "Stokta Yok"}
        </button>
      </div>

      {added && (
        <div className="mt-3 rounded-xl bg-green-100 p-3 text-center text-sm font-bold text-green-800">
          Ürün sepete eklendi.
        </div>
      )}
    </div>
  );
}
