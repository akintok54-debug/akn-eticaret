import Link from "next/link";

export default function AdminPage() {
  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      <header className="border-b bg-slate-950 text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5">
          <div>
            <div className="text-xl font-black">
              AKN YÖNETİM
            </div>
            <div className="text-xs text-slate-400">
              E-Ticaret Yönetim Paneli
            </div>
          </div>

          <Link
            href="/"
            className="rounded-xl bg-white px-4 py-2 text-sm font-bold text-slate-900"
          >
            Mağazaya Git
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8">
        <h1 className="text-3xl font-black">
          Yönetim Paneli
        </h1>

        <p className="mt-2 text-slate-500">
          AKN Motosiklet e-ticaret yönetimi
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Link
            href="/admin/urunler"
            className="rounded-2xl border bg-white p-6 shadow-sm transition hover:-translate-y-1"
          >
            <div className="text-3xl">📦</div>
            <div className="mt-4 text-lg font-black">
              Ürünler
            </div>
            <div className="mt-1 text-sm text-slate-500">
              Ürün, fiyat ve stok yönetimi
            </div>
          </Link>

          <div className="rounded-2xl border bg-white p-6 opacity-70">
            <div className="text-3xl">🛒</div>
            <div className="mt-4 text-lg font-black">
              Siparişler
            </div>
            <div className="mt-1 text-sm text-slate-500">
              Sonraki aşamada aktif olacak
            </div>
          </div>

          <div className="rounded-2xl border bg-white p-6 opacity-70">
            <div className="text-3xl">👥</div>
            <div className="mt-4 text-lg font-black">
              Müşteriler
            </div>
            <div className="mt-1 text-sm text-slate-500">
              Sonraki aşamada aktif olacak
            </div>
          </div>

          <div className="rounded-2xl border bg-white p-6 opacity-70">
            <div className="text-3xl">🏢</div>
            <div className="mt-4 text-lg font-black">
              Bayiler
            </div>
            <div className="mt-1 text-sm text-slate-500">
              B2B bayi yönetimi
            </div>
          </div>
        </div>

        <div className="mt-8 rounded-2xl border bg-white p-6">
          <h2 className="text-xl font-black">
            Sistem Durumu
          </h2>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Status title="Mağaza" value="Aktif" />
            <Status title="Sepet" value="Aktif" />
            <Status title="Sipariş Akışı" value="Aktif" />
            <Status title="ERP Bağlantısı" value="Henüz Bağlı Değil" />
          </div>
        </div>
      </div>
    </main>
  );
}

function Status({
  title,
  value,
}: {
  title: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-slate-50 p-4">
      <div className="text-xs font-bold text-slate-500">
        {title}
      </div>
      <div className="mt-1 font-black">{value}</div>
    </div>
  );
}
