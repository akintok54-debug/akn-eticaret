"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export type CustomerType =
  | "retail"
  | "dealer";

export type DealerStatus =
  | "none"
  | "pending"
  | "approved"
  | "passive";

export type Customer = {
  id: string;
  erpCustomerId: string | null;

  fullName: string;
  phone: string;
  email: string;

  city: string;
  district: string;
  address: string;

  type: CustomerType;
  dealerStatus: DealerStatus;

  companyName: string;
  taxOffice: string;
  taxNumber: string;

  createdAt: string;
};

type CustomerContextType = {
  customers: Customer[];
  currentCustomer: Customer | null;

  registerRetail: (
    customer: Customer
  ) => void;

  applyDealer: (
    customer: Customer
  ) => void;

  loginByPhone: (
    phone: string
  ) => boolean;

  logout: () => void;

  updateDealerStatus: (
    id: string,
    status: DealerStatus
  ) => void;

  isApprovedDealer: boolean;
};

const CustomerContext =
  createContext<CustomerContextType | undefined>(
    undefined
  );

export function CustomerProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [customers, setCustomers] =
    useState<Customer[]>([]);

  const [
    currentCustomerId,
    setCurrentCustomerId,
  ] = useState<string | null>(null);

  const [loaded, setLoaded] =
    useState(false);

  useEffect(() => {
    try {
      const savedCustomers =
        localStorage.getItem(
          "akn-customers"
        );

      const savedSession =
        localStorage.getItem(
          "akn-customer-session"
        );

      if (savedCustomers) {
        setCustomers(
          JSON.parse(savedCustomers)
        );
      }

      if (savedSession) {
        setCurrentCustomerId(
          savedSession
        );
      }
    } catch {
      localStorage.removeItem(
        "akn-customers"
      );

      localStorage.removeItem(
        "akn-customer-session"
      );
    }

    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;

    localStorage.setItem(
      "akn-customers",
      JSON.stringify(customers)
    );
  }, [customers, loaded]);

  useEffect(() => {
    if (!loaded) return;

    if (currentCustomerId) {
      localStorage.setItem(
        "akn-customer-session",
        currentCustomerId
      );
    } else {
      localStorage.removeItem(
        "akn-customer-session"
      );
    }
  }, [
    currentCustomerId,
    loaded,
  ]);

  const currentCustomer =
    customers.find(
      (customer) =>
        customer.id ===
        currentCustomerId
    ) ?? null;

  const isApprovedDealer =
    currentCustomer?.type ===
      "dealer" &&
    currentCustomer.dealerStatus ===
      "approved";

  function saveCustomer(
    customer: Customer
  ) {
    setCustomers((current) => {
      const existing =
        current.findIndex(
          (item) =>
            item.phone ===
            customer.phone
        );

      if (existing >= 0) {
        const next = [...current];

        next[existing] = {
          ...next[existing],
          ...customer,
          id: next[existing].id,
        };

        return next;
      }

      return [
        customer,
        ...current,
      ];
    });
  }

  function registerRetail(
    customer: Customer
  ) {
    saveCustomer(customer);
    setCurrentCustomerId(
      customer.id
    );
  }

  function applyDealer(
    customer: Customer
  ) {
    saveCustomer(customer);
    setCurrentCustomerId(
      customer.id
    );
  }

  function loginByPhone(
    phone: string
  ) {
    const normalized =
      phone.trim();

    const customer =
      customers.find(
        (item) =>
          item.phone === normalized
      );

    if (!customer) {
      return false;
    }

    setCurrentCustomerId(
      customer.id
    );

    return true;
  }

  function logout() {
    setCurrentCustomerId(null);
  }

  function updateDealerStatus(
    id: string,
    status: DealerStatus
  ) {
    setCustomers((current) =>
      current.map((customer) =>
        customer.id === id
          ? {
              ...customer,
              type:
                status ===
                  "approved" ||
                status ===
                  "pending" ||
                status ===
                  "passive"
                  ? "dealer"
                  : customer.type,
              dealerStatus: status,
            }
          : customer
      )
    );
  }

  return (
    <CustomerContext.Provider
      value={{
        customers,
        currentCustomer,
        registerRetail,
        applyDealer,
        loginByPhone,
        logout,
        updateDealerStatus,
        isApprovedDealer,
      }}
    >
      {children}
    </CustomerContext.Provider>
  );
}

export function useCustomers() {
  const context =
    useContext(CustomerContext);

  if (!context) {
    throw new Error(
      "useCustomers must be used inside CustomerProvider"
    );
  }

  return context;
}