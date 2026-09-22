"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export type CartItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string | null;
};

type CartContextType = {
  items: CartItem[];
  itemCount: number;
  total: number;
  addItem: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const savedCart = localStorage.getItem("akn-cart");

      if (savedCart) {
        const parsed: unknown = JSON.parse(savedCart);
        if (Array.isArray(parsed)) {
          // Restore an external browser snapshot only after hydration.
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setItems(parsed.filter((item): item is CartItem => item && typeof item.id === "string" && typeof item.name === "string" && Number.isFinite(item.price) && item.price >= 0 && Number.isInteger(item.quantity) && item.quantity > 0 && item.quantity <= 999));
        }
      }
    } catch {
      localStorage.removeItem("akn-cart");
    }

    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) {
      try { localStorage.setItem("akn-cart", JSON.stringify(items)); } catch { /* Shopping still works when browser storage is unavailable. */ }
    }
  }, [items, loaded]);


  useEffect(() => {
    if (!loaded) return;

    try {
      let sessionId = localStorage.getItem("akn-cart-session");

      if (!sessionId) {
        sessionId = crypto.randomUUID();
        localStorage.setItem("akn-cart-session", sessionId);
      }

      const timer = window.setTimeout(() => {
        void fetch("/api/cart-tracking", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            sessionId,
            items,
          }),
        }).catch(() => {
          // Sepet takibi başarısız olsa bile alışveriş devam eder.
        });
      }, 500);

      return () => window.clearTimeout(timer);
    } catch {
      return;
    }
  }, [items, loaded]);
  function addItem(
    item: Omit<CartItem, "quantity">,
    quantity: number = 1
  ) {
    if (!Number.isFinite(quantity) || quantity < 1 || !Number.isFinite(item.price) || item.price < 0) return;
    quantity = Math.min(999, Math.floor(quantity));
    setItems((currentItems) => {
      const existingItem = currentItems.find(
        (cartItem) => cartItem.id === item.id
      );

      if (existingItem) {
        return currentItems.map((cartItem) =>
          cartItem.id === item.id
            ? {
                ...cartItem,
                quantity: Math.min(999, cartItem.quantity + quantity),
              }
            : cartItem
        );
      }

      return [
        ...currentItems,
        {
          ...item,
          quantity,
        },
      ];
    });
  }

  function removeItem(id: string) {
    setItems((currentItems) =>
      currentItems.filter((item) => item.id !== id)
    );
  }

  function updateQuantity(id: string, quantity: number) {
    if (!Number.isFinite(quantity)) return;
    quantity = Math.min(999, Math.floor(quantity));
    if (quantity <= 0) {
      removeItem(id);
      return;
    }

    setItems((currentItems) =>
      currentItems.map((item) =>
        item.id === id ? { ...item, quantity } : item
      )
    );
  }

  function clearCart() {
    setItems([]);
  }

  const itemCount = items.reduce(
    (totalCount, item) => totalCount + item.quantity,
    0
  );

  const total = items.reduce(
    (totalPrice, item) => totalPrice + item.price * item.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{
        items,
        itemCount,
        total,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart must be used inside CartProvider");
  }

  return context;
}

