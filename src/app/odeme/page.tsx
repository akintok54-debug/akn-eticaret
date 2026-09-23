"use client";

import Link from "next/link";
import {
    useEffect,
    useRef,
    useState,
    type FormEvent,
} from "react";

import StoreHeader from "@/components/layout/StoreHeader";
import StoreFooter from "@/components/layout/StoreFooter";
import { useCart } from "@/context/CartContext";
import { useOrders } from "@/context/OrderContext";
import { useProducts } from "@/context/ProductContext";
import { money } from "@/lib/store";

type Settings = {
    enabled: boolean;
    shipping: number;
    threshold: number;
    bankName: string;
    iban: string;
};

function getCartSessionId() {
    let sessionId = localStorage.getItem("akn-cart-session");

    if (!sessionId) {
        sessionId = crypto.randomUUID();
        localStorage.setItem("akn-cart-session", sessionId);
    }

    return sessionId;
}

export default function CheckoutPage() {
    const { items, total, clearCart } = useCart();
    const { addOrder } = useOrders();
    const { refreshProducts } = useProducts();

    const [settings, setSettings] = useState<Settings | null>(null);
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(false);
    const [completed, setCompleted] = useState("");
    const [invoice, setInvoice] = useState("individual");

    const key = useRef("");
    const submitting = useRef(false);
    const checkoutTracked = useRef(false);

    useEffect(() => {
        fetch("/api/checkout")
            .then((response) => {
                if (!response.ok) throw new Error();
                return response.json();
            })
            .then(setSettings)
            .catch(() =>
                setError("Mağaza ayarları alınamadı. Sayfayı yenileyin.")
            );
    }, []);

    /*
     * Müşteri ödeme ekranına ulaştığında sepeti
     * ödeme aşamasına geçmiş olarak işaretliyoruz.
     */
    useEffect(() => {
        if (!items.length || checkoutTracked.current) return;

        checkoutTracked.current = true;

        const sessionId = getCartSessionId();

        void fetch("/api/cart-tracking", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                sessionId,
                checkoutStarted: true,
                items,
            }),
        }).catch(() => {
            // Takip sistemi sipariş akışını engellemez.
        });
    }, [items]);

    const shipping =
        settings && total < settings.threshold
            ? settings.shipping
            : 0;

    async function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (submitting.current || !settings?.enabled) return;

        submitting.current = true;
        setBusy(true);
        setError("");

        const form = new FormData(event.currentTarget);

        const value = (name: string) =>
            String(form.get(name) || "").trim();

        if (!key.current) {
            key.current = crypto.randomUUID();
        }

        const sessionId = getCartSessionId();

        const customer = {
            fullName: value("fullName"),
            phone: value("phone"),
            email: value("email"),
        };

        try {
            /*
             * Siparişi oluşturmadan hemen önce müşteri bilgilerini
             * mevcut alışveriş sepetine bağlıyoruz.
             */
            await fetch("/api/cart-tracking", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    sessionId,
                    customerName: customer.fullName,
                    customerPhone: customer.phone,
                    customerEmail: customer.email,
                    checkoutStarted: true,
                    items,
                }),
            });

            const response = await fetch("/api/orders", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    checkoutKey: key.current,
                    expectedTotal: total + shipping,

                    customer,

                    delivery: {
                        city: value("city"),
                        district: value("district"),
                        address: value("address"),
                    },

                    invoice: {
                        type: invoice,
                        companyName: value("companyName"),
                        taxOffice: value("taxOffice"),
                        taxNumber: value("taxNumber"),
                    },

                    paymentMethod: "transfer",

                    items: items.map((item) => ({
                        productId: item.id,
                        quantity: item.quantity,
                    })),
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message);
            }

            /*
             * Sipariş başarıyla oluştu.
             * Sepeti sipariş numarasıyla birlikte tamamlandı yapıyoruz.
             *
             * Burada items göndermiyoruz. Böylece yönetim panelindeki
             * tamamlanan sepetin ürün geçmişi korunuyor.
             */
            await fetch("/api/cart-tracking", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    sessionId,
                    customerName: customer.fullName,
                    customerPhone: customer.phone,
                    customerEmail: customer.email,
                    checkoutStarted: true,
                    completed: true,
                    orderId: data.order.id,
                    orderNumber: data.order.orderNumber,
                }),
            });

            addOrder(data.order);

            /*
             * Tamamlanan sepet kaydını artık bu tarayıcının yeni
             * alışverişinden ayırıyoruz.
             */
            localStorage.removeItem("akn-cart-session");

            clearCart();

            setCompleted(data.order.orderNumber);

            void refreshProducts();
        } catch (e) {
            setError(
                e instanceof Error
                    ? e.message
                    : "Sipariş kaydedilemedi."
            );
        } finally {
            submitting.current = false;
            setBusy(false);
        }
    }

    return (
        <>
            <StoreHeader />

            <main className="store-container">
                <div className="page-heading">
                    <p>
                        <Link href="/sepet">Sepetim</Link> / Teslimat ve ödeme
                    </p>

                    <h1>
                        {completed
                            ? "Siparişiniz kaydedildi"
                            : "Siparişinizi tamamlayın"}
                    </h1>
                </div>

                {completed ? (
                    <section className="form-panel mb-12">
                        <h2>{completed}</h2>

                        <p className="notice">
                            Siparişiniz havale / EFT ödemesi bekliyor.
                            Bu işlemde kartınızdan ödeme alınmadı.
                        </p>

                        <p className="my-5">
                            Alıcı: {settings?.bankName}
                            <br />
                            IBAN: {settings?.iban}
                            <br />
                            Havale açıklaması: {completed}
                        </p>

                        <Link
                            href="/siparisler"
                            className="button-dark"
                        >
                            Siparişimi görüntüle ↗
                        </Link>
                    </section>
                ) : !items.length ? (
                    <section className="catalog-message mb-12">
                        Sepetiniz boş.{" "}
                        <Link
                            href="/urunler"
                            className="underline"
                        >
                            Ürünlere göz atın.
                        </Link>
                    </section>
                ) : (
                    <form
                        onSubmit={submit}
                        className="checkout-layout"
                    >
                        <div className="checkout-fields">
                            {!settings?.enabled && (
                                <p
                                    className="notice"
                                    role="status"
                                >
                                    {settings
                                        ? "Mağazamız satışa hazırlanıyor. Sipariş alımı henüz açık değil; sepetinizi hazırlayabilirsiniz."
                                        : "Ödeme seçenekleri yükleniyor…"}
                                </p>
                            )}

                            <section className="form-panel">
                                <h2>01 — Teslimat bilgileri</h2>

                                <div className="form-grid">
                                    <Field
                                        name="fullName"
                                        label="Ad soyad"
                                        autoComplete="name"
                                    />

                                    <Field
                                        name="phone"
                                        label="Telefon"
                                        type="tel"
                                        autoComplete="tel"
                                    />

                                    <Field
                                        name="email"
                                        label="E-posta"
                                        type="email"
                                        autoComplete="email"
                                    />

                                    <Field
                                        name="city"
                                        label="İl"
                                        autoComplete="address-level1"
                                    />

                                    <Field
                                        name="district"
                                        label="İlçe"
                                        autoComplete="address-level2"
                                    />

                                    <label className="full-width">
                                        Açık adres
                                        <textarea
                                            required
                                            minLength={10}
                                            maxLength={1000}
                                            name="address"
                                            autoComplete="street-address"
                                            rows={3}
                                        />
                                    </label>
                                </div>
                            </section>

                            <section className="form-panel">
                                <h2>02 — Fatura bilgileri</h2>

                                <div className="form-grid">
                                    <label>
                                        Fatura türü
                                        <select
                                            value={invoice}
                                            onChange={(e) =>
                                                setInvoice(e.target.value)
                                            }
                                        >
                                            <option value="individual">
                                                Bireysel
                                            </option>

                                            <option value="corporate">
                                                Kurumsal
                                            </option>
                                        </select>
                                    </label>

                                    {invoice === "corporate" && (
                                        <>
                                            <Field
                                                name="companyName"
                                                label="Firma ünvanı"
                                            />

                                            <Field
                                                name="taxOffice"
                                                label="Vergi dairesi"
                                            />

                                            <Field
                                                name="taxNumber"
                                                label="Vergi numarası"
                                                pattern="[0-9]{10,11}"
                                            />
                                        </>
                                    )}
                                </div>
                            </section>

                            <section className="form-panel">
                                <h2>03 — Kargo ve ödeme</h2>

                                <p className="text-sm">
                                    Standart kargo:{" "}
                                    {settings
                                        ? money(shipping)
                                        : "Hesaplanıyor"}
                                </p>

                                {settings && (
                                    <p className="text-xs text-slate-500 mt-2">
                                        {money(settings.threshold)} ve üzeri
                                        alışverişlerde kargo ücretsiz.
                                    </p>
                                )}

                                <div className="notice mt-5">
                                    <strong>Havale / EFT</strong>
                                    <br />
                                    Sipariş kaydından sonra banka bilgileri
                                    gösterilir. Ödemeniz kontrol edildikten
                                    sonra siparişiniz hazırlanır.
                                </div>
                            </section>
                        </div>

                        <aside className="form-panel order-summary">
                            <h2>Sipariş özeti</h2>

                            {items.map((item) => (
                                <div key={item.id}>
                                    <span>
                                        {item.name}

                                        <small className="block mt-1 text-slate-500">
                                            {item.quantity} adet
                                        </small>
                                    </span>

                                    <strong className="whitespace-nowrap">
                                        {money(item.price * item.quantity)}
                                    </strong>
                                </div>
                            ))}

                            <div>
                                <span>Ara toplam</span>
                                <span>{money(total)}</span>
                            </div>

                            <div>
                                <span>Kargo</span>
                                <span>
                                    {settings
                                        ? money(shipping)
                                        : "—"}
                                </span>
                            </div>

                            <div className="summary-total">
                                <span>Toplam</span>
                                <strong>
                                    {money(total + shipping)}
                                </strong>
                            </div>

                            <p className="text-xs text-slate-500 mt-3">
                                Fiyatlara KDV dahildir. Güncel fiyat ve stok
                                sipariş anında kontrol edilir.
                            </p>

                            {error && (
                                <p
                                    className="notice error-notice mt-4"
                                    role="alert"
                                >
                                    {error}
                                </p>
                            )}

                            <button
                                disabled={busy || !settings?.enabled}
                                className="button-red"
                                type="submit"
                            >
                                {busy
                                    ? "Sipariş kaydediliyor…"
                                    : "Havale siparişi oluştur"}{" "}
                                <span>→</span>
                            </button>

                            <Link
                                href="/sepet"
                                className="block text-center text-xs mt-4 underline"
                            >
                                Sepete geri dön
                            </Link>
                        </aside>
                    </form>
                )}
            </main>

            <StoreFooter />
        </>
    );
}

function Field({
    name,
    label,
    type = "text",
    autoComplete,
    pattern,
}: {
    name: string;
    label: string;
    type?: string;
    autoComplete?: string;
    pattern?: string;
}) {
    return (
        <label>
            {label}

            <input
                required
                name={name}
                type={type}
                autoComplete={autoComplete}
                pattern={pattern}
                minLength={2}
                maxLength={200}
            />
        </label>
    );
}