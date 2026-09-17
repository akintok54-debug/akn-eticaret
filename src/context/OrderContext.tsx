"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export type OrderStatus =
  | "Yeni"
  | "Hazırlanıyor"
  | "Kargoda"
  | "Tamamlandı"
  | "İptal";

export type OrderItem = {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image: string | null;
};

export type Order = {
  id: string;
  orderNumber: string;
  createdAt: string;

  customer: {
    fullName: string;
    phone: string;
    email: string;
  };

  delivery: {
    city: string;
    district: string;
    address: string;
  };

  invoice: {
    type: "individual" | "corporate";
    companyName: string;
    taxOffice: string;
    taxNumber: string;
  };

  shippingMethod: string;
  paymentMethod: string;

  items: OrderItem[];

  total: number;

  status: OrderStatus;
};

type OrderContextType = {
  orders: Order[];
  addOrder: (order: Order) => void;
  updateStatus: (
    id: string,
    status: OrderStatus
  ) => void;
};

const OrderContext =
  createContext<OrderContextType | undefined>(
    undefined
  );

export function OrderProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [orders, setOrders] =
    useState<Order[]>([]);

  const [loaded, setLoaded] =
    useState(false);

  useEffect(() => {
    try {
      const saved =
        localStorage.getItem("akn-orders");

      if (saved) {
        setOrders(JSON.parse(saved));
      }
    } catch {
      localStorage.removeItem("akn-orders");
    }

    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) {
      localStorage.setItem(
        "akn-orders",
        JSON.stringify(orders)
      );
    }
  }, [orders, loaded]);

  function addOrder(order: Order) {
    setOrders((current) => [
      order,
      ...current,
    ]);
  }

  function updateStatus(
    id: string,
    status: OrderStatus
  ) {
    setOrders((current) =>
      current.map((order) =>
        order.id === id
          ? { ...order, status }
          : order
      )
    );
  }

  return (
    <OrderContext.Provider
      value={{
        orders,
        addOrder,
        updateStatus,
      }}
    >
      {children}
    </OrderContext.Provider>
  );
}

export function useOrders() {
  const context = useContext(OrderContext);

  if (!context) {
    throw new Error(
      "useOrders must be used inside OrderProvider"
    );
  }

  return context;
}