import Link from "next/link";

const categories = [
  { name: "Motor Parçaları", icon: "⚙️" },
  { name: "Elektrik", icon: "⚡" },
  { name: "Fren", icon: "◉" },
  { name: "Zincir & Dişli", icon: "⛓" },
  { name: "Yağ & Bakım", icon: "🛠️" },
  { name: "Aksesuar", icon: "🏍️" },
];

const products = [
  {
    name: "Motosiklet Motor Yağı",
    category: "Yağ & Bakım",
    price: "450,00 TL",
    stock: "Stokta",
  },
  {
    name: "Ön Fren Balatası",
    category: "Fren",
    price: "325,00 TL",
    stock: "Stokta",
  },
  {
    name: "Zincir Dişli Seti",
    category: "Zincir & Dişli",
    price: "1.250,00 TL",
    stock: "Stokta",
  },
  {
    name: "NGK Buji",
    category: "Motor Parçaları",
    price: "185,00 TL",
    stock: "Stokta",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="bg-slate-950 px-4 py-2 text-center text-sm text-white">
        Türkiye'nin motosiklet yedek parça mağazası
      </div>

      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-4 px-4 py-5">
          <Link href="/" className="mr-4">
            <div className="text-2xl font-black tracking-tight">
              AKN <span className="text-red-600">MOTOSİKLET</span>
            </div>
            <div className="text-xs text-slate-500">Yedek Parça & Aksesuar</div>
          </Link>

          <div className="order-3 flex w-full flex-1 md:order-none md:w-auto">
            <input
              type="search"
              placeholder="Ürün, marka veya parça ara..."
              className="w-full rounded-l-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-900"
            />
            <button className="rounded-r-xl bg-slate-900 px-6 font-semibold text-white">
              Ara
            </button>
          </div>

          <nav className="ml-auto flex items-center gap-2 text-sm font-semibold">
            <Link href="/bayi" className="rounded-lg px-3 py-2 hover:bg-slate-100">
              Bayi Girişi
            </Link>
            <Link href="/hesabim" className="rounded-lg px-3 py-2 hover:bg-slate-100">
              Hesabım
            </Link>
            <Link
              href="/sepet"
              className="rounded-lg bg-red-600 px-4 py-2 text-white"
            >
              Sepet
            </Link>
          </nav>
        </div>
      </header>

      <div className="border-b bg-white">
        <nav className="mx-auto flex max-w-7xl gap-6 overflow-x-auto px-4 py-3 text-sm font-semibold whitespace-nowrap">
          <Link href="/">Ana Sayfa</Link>
          <Link href="/urunler">Tüm Ürünler</Link>
          <Link href="/kategoriler">Kategoriler</Link>
          <Link href="/markalar">Markalar</Link>
          <Link href="/bayi">Bayi / B2B</Link>
        </nav>
      </div>

      <section className="mx-auto max-w-7xl px-4 py-6">
        <div className="rounded-3xl bg-slate-900 px-6 py-10 text-white md:px-12 md:py-16">
          <p className="mb-3 font-semibold text-red-400">AKN MOTOSİKLET</p>
          <h1 className="max-w-3xl text-3xl font-black md:text-5xl">
            Motosikletiniz için aradığınız parçalar tek yerde.
          </h1>
          <p className="mt-5 max-w-2xl text-slate-300">
            Yedek parça, bakım ürünleri ve aksesuarları hızlıca bulun.
            Perakende ve bayi alışverişi tek mağazada.
          </p>

          <Link
            href="/urunler"
            className="mt-7 inline-block rounded-xl bg-red-600 px-6 py-3 font-bold"
          >
            Ürünleri İncele
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-6">
        <div className="mb-5 flex items-end justify-between">
          <div>
            <p className="text-sm font-semibold text-red-600">HIZLI ERİŞİM</p>
            <h2 className="text-2xl font-black">Kategoriler</h2>
          </div>
          <Link href="/kategoriler" className="text-sm font-semibold">
            Tümünü Gör →
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
          {categories.map((category) => (
            <Link
              href="/urunler"
              key={category.name}
              className="rounded-2xl border bg-white p-5 text-center shadow-sm transition hover:-translate-y-1"
            >
              <div className="mb-3 text-3xl">{category.icon}</div>
              <div className="font-bold">{category.name}</div>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-5 flex items-end justify-between">
          <div>
            <p className="text-sm font-semibold text-red-600">MAĞAZA</p>
            <h2 className="text-2xl font-black">Öne Çıkan Ürünler</h2>
          </div>
          <Link href="/urunler" className="text-sm font-semibold">
            Tüm Ürünler →
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {products.map((product) => (
            <article
              key={product.name}
              className="overflow-hidden rounded-2xl border bg-white shadow-sm"
            >
              <div className="flex aspect-square items-center justify-center bg-slate-100 text-5xl">
                🏍️
              </div>

              <div className="p-4">
                <div className="text-xs font-semibold text-slate-500">
                  {product.category}
                </div>
                <h3 className="mt-1 min-h-12 font-bold">{product.name}</h3>
                <div className="mt-3 text-xs font-semibold text-green-700">
                  {product.stock}
                </div>
                <div className="mt-1 text-xl font-black">{product.price}</div>

                <button className="mt-4 w-full rounded-xl bg-slate-900 py-3 text-sm font-bold text-white">
                  Sepete Ekle
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl bg-red-600 p-7 text-white">
            <div className="text-2xl font-black">Bayi misiniz?</div>
            <p className="mt-2 text-red-100">
              Bayi hesabınızla giriş yaparak size özel fiyatları görüntüleyin.
            </p>
            <Link
              href="/bayi"
              className="mt-5 inline-block rounded-lg bg-white px-5 py-3 font-bold text-red-600"
            >
              Bayi Girişi
            </Link>
          </div>

          <div className="rounded-2xl bg-slate-200 p-7">
            <div className="text-2xl font-black">Parçanızı hızlı bulun</div>
            <p className="mt-2 text-slate-600">
              Ürün adı, marka veya barkod ile arama yapın.
            </p>
          </div>
        </div>
      </section>

      <footer className="mt-10 bg-slate-950 text-slate-300">
        <div className="mx-auto max-w-7xl px-4 py-10">
          <div className="text-xl font-black text-white">
            AKN <span className="text-red-500">MOTOSİKLET</span>
          </div>
          <p className="mt-2 text-sm">
            Motosiklet yedek parça ve aksesuar mağazası.
          </p>
          <div className="mt-8 border-t border-slate-800 pt-5 text-xs">
            © 2026 AKN Motosiklet
          </div>
        </div>
      </footer>
    </main>
  );
}
