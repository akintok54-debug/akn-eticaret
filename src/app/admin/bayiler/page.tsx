"use client";

import Link from "next/link";

import {
  useCustomers,
  type DealerStatus,
} from "@/context/CustomerContext";

export default function AdminDealersPage() {
  const {
    customers,
    updateDealerStatus,
  } = useCustomers();

  const dealers =
    customers.filter(
      (customer) =>
        customer.type === "dealer"
    );

  function statusText(
    status: DealerStatus
  ) {
    if (status === "approved")
      return "Onaylı";

    if (status === "pending")
      return "Bekliyor";

    if (status === "passive")
      return "Pasif";

    return "Yok";
  }

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
          Bayiler / B2B
        </h1>

        <div className="mt-2 text-sm text-slate-500">
          {dealers.length} bayi hesabı
        </div>

        <div className="mt-6 space-y-4">
          {dealers.map(
            (dealer) => (
              <article
                key={dealer.id}
                className="rounded-2xl border bg-white p-5"
              >
                <div className="grid gap-5 lg:grid-cols-[1fr_220px]">
                  <div>
                    <div className="text-xl font-black">
                      {
                        dealer.companyName
                      }
                    </div>

                    <div className="mt-1 text-sm font-bold">
                      {
                        dealer.fullName
                      }
                    </div>

                    <div className="mt-3 text-sm text-slate-500">
                      {dealer.phone}
                      <br />
                      {dealer.email}
                      <br />
                      {dealer.city} /{" "}
                      {dealer.district}
                    </div>

                    <div className="mt-3 text-sm">
                      VD:{" "}
                      {
                        dealer.taxOffice
                      }
                      {" • "}
                      VN:{" "}
                      {
                        dealer.taxNumber
                      }
                    </div>
                  </div>

                  <aside className="rounded-xl bg-slate-50 p-4">
                    <div className="text-xs font-bold text-slate-400">
                      BAYİ DURUMU
                    </div>

                    <div className="mt-1 font-black">
                      {statusText(
                        dealer.dealerStatus
                      )}
                    </div>

                    <select
                      value={
                        dealer.dealerStatus
                      }
                      onChange={(event) =>
                        updateDealerStatus(
                          dealer.id,
                          event.target
                            .value as DealerStatus
                        )
                      }
                      className="mt-4 w-full rounded-xl border bg-white px-3 py-3 font-bold"
                    >
                      <option value="pending">
                        Bekliyor
                      </option>

                      <option value="approved">
                        Onaylı
                      </option>

                      <option value="passive">
                        Pasif
                      </option>
                    </select>

                    <div className="mt-4 text-xs text-slate-500">
                      Onaylı bayi mağazada bayi fiyatını görür.
                    </div>
                  </aside>
                </div>
              </article>
            )
          )}

          {dealers.length === 0 && (
            <div className="rounded-2xl border bg-white p-10 text-center text-slate-500">
              Henüz bayi başvurusu yok.
            </div>
          )}
        </div>
      </div>
    </main>
  );
}