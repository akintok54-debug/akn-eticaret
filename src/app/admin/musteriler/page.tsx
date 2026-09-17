"use client";

import Link from "next/link";
import { useCustomers } from "@/context/CustomerContext";

export default function AdminCustomersPage() {
  const { customers } =
    useCustomers();

  const retail =
    customers.filter(
      (customer) =>
        customer.type === "retail"
    );

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      <header className="bg-slate-950 text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5">
          <div className="font-black">
            AKN YÖNETİM
          </div>

          <Link
            href="/admin"
            className="rounded-xl border border-slate-700 px-4 py-2 font-bold"
          >
            Yönetim Paneli
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8">
        <h1 className="text-3xl font-black">
          Müşteriler
        </h1>

        <div className="mt-2 text-sm text-slate-500">
          {retail.length} perakende müşteri
        </div>

        <div className="mt-6 overflow-x-auto rounded-2xl border bg-white">
          <table className="w-full min-w-[800px] text-left text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="p-4">
                  Müşteri
                </th>

                <th className="p-4">
                  Telefon
                </th>

                <th className="p-4">
                  E-posta
                </th>

                <th className="p-4">
                  Şehir
                </th>

                <th className="p-4">
                  ERP
                </th>
              </tr>
            </thead>

            <tbody>
              {retail.map(
                (customer) => (
                  <tr
                    key={customer.id}
                    className="border-t"
                  >
                    <td className="p-4 font-black">
                      {
                        customer.fullName
                      }
                    </td>

                    <td className="p-4">
                      {
                        customer.phone
                      }
                    </td>

                    <td className="p-4">
                      {
                        customer.email
                      }
                    </td>

                    <td className="p-4">
                      {customer.city} /{" "}
                      {
                        customer.district
                      }
                    </td>

                    <td className="p-4">
                      {customer.erpCustomerId ??
                        "Bağlı değil"}
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}