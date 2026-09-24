"use client";
import { useCustomers } from "@/context/CustomerContext";

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
    const { currentCustomer } = useCustomers();
    const { addOrder } = useOrders();
    const { refreshProducts } = useProducts();

    const [error, setError] = useState("");
    const [couponInput,setCouponInput]=useState("");
    const [couponCode,setCouponCode]=useState("");
    const [quote,setQuote]=useState<{key:string;subtotal:number;discountTotal:number;shippingTotal:number;total:number}|null>(null);
    const quoteKey=JSON.stringify({items:items.map(i=>({productId:i.id,quantity:i.quantity})),prices:items.map(i=>i.price),buyer:currentCustomer?.id,couponCode});
    useEffect(()=>{
      if(!items.length)return;
      const controller=new AbortController();
      fetch("/api/checkout",{method:"POST",headers:{"Content-Type":"application/json"},body:quoteKey,signal:controller.signal})
        .then(async r=>{const d=await r.json();if(!r.ok)throw new Error(d.message);return d;})
        .then(d=>{if(!controller.signal.aborted){setQuote({...d,key:quoteKey});setError("");}})
        .catch(e=>{if(!controller.signal.aborted){setQuote(null);setError(e instanceof Error?e.message:"Sepet tutarı hesaplanamadı.");}});
      return()=>controller.abort();
    },[quoteKey,items.length]);
    const quoteReady=quote?.key===quoteKey;
    const [settings, setSettings] = useState<Settings | null>(null);

    const [busy, setBusy] = useState(false);
    const [completed, setCompleted] = useState("");
    const [invoice, setInvoice] = useState("individual");

    const key = useRef("");
    const submitting = useRef(false);
    const checkoutTracked = useRef(false);
    const trackingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const pendingContact = useRef<string | null>(null);
    useEffect(() => {
        const flush = () => {
            if (!pendingContact.current) return;
            const body = pendingContact.current;
            pendingContact.current = null;
            void fetch("/api/cart-tracking", { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true }).catch(() => {});
        };
        const hidden = () => { if (document.visibilityState === "hidden") flush(); };
        window.addEventListener("pagehide", flush);
        document.addEventListener("visibilitychange", hidden);
        return () => { if (trackingTimer.current) clearTimeout(trackingTimer.current); flush(); window.removeEventListener("pagehide", flush); document.removeEventListener("visibilitychange", hidden); };
    }, []);

    function trackContact(event: FormEvent<HTMLFormElement>) {
        if (submitting.current) return;
        const form = new FormData(event.currentTarget);
        try {
            pendingContact.current = JSON.stringify({
                sessionId: getCartSessionId(), checkoutStarted: true,
                customerName: String(form.get("fullName") ?? "").trim(),
                customerPhone: String(form.get("phone") ?? "").trim(),
                customerEmail: String(form.get("email") ?? "").trim(),
                items,
            });
            if (trackingTimer.current) clearTimeout(trackingTimer.current);
            trackingTimer.current = setTimeout(() => {
                const body = pendingContact.current; pendingContact.current = null;
                if (body) void fetch("/api/cart-tracking", { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true }).catch(() => {});
            }, 400);
        } catch { /* Tracking must not block checkout if storage is unavailable. */ }
    }

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

        let sessionId: string;
        try { sessionId = getCartSessionId(); } catch { return; }

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

    const shipping = quoteReady && quote ? quote.shippingTotal : settings && total < settings.threshold ? settings.shipping : 0;

    async function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (submitting.current || !settings?.enabled || !quoteReady || !quote) return;

        submitting.current = true;
        setBusy(true);
        setError("");

        const form = new FormData(event.currentTarget);

        const value = (name: string) =>
            String(form.get(name) || "").trim();

        if (!key.current) {
            key.current = crypto.randomUUID();
        }

        let sessionId: string | undefined;
        try { sessionId = getCartSessionId(); } catch { /* Order flow works without local storage. */ }
        if (trackingTimer.current) clearTimeout(trackingTimer.current);
        pendingContact.current = null;

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
            }).catch(() => {});

            const response = await fetch("/api/orders", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    checkoutKey: key.current,
                    cartSessionId: sessionId,
                    expectedTotal: quote.total,
                    couponCode,

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
            }).catch(() => {});

            addOrder(data.order);

            /*
             * Tamamlanan sepet kaydını artık bu tarayıcının yeni
             * alışverişinden ayırıyoruz.
             */
            try { localStorage.removeItem("akn-cart-session"); } catch { /* Storage is optional. */ }

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
                        key={currentCustomer?.id ?? "guest"}
                        onSubmit={submit}
                        onInput={trackContact}
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
                                        defaultValue={currentCustomer?.fullName ?? ""}
                                        label="Ad soyad"
                                        autoComplete="name"
                                    />

                                    <Field
                                        name="phone"
                                        defaultValue={currentCustomer?.phone ?? ""}
                                        label="Telefon"
                                        type="tel"
                                        autoComplete="tel"
                                    />

                                    <Field
                                        name="email"
                                        defaultValue={currentCustomer?.email ?? ""}
                                        label="E-posta"
                                        type="email"
                                        autoComplete="email"
                                    />

                                    <Field
                                        name="city"
                                        defaultValue={currentCustomer?.addresses?.[0]?.city ?? ""}
                                        label="İl"
                                        autoComplete="address-level1"
                                    />

                                    <Field
                                        name="district"
                                        defaultValue={currentCustomer?.addresses?.[0]?.district ?? ""}
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
                                            defaultValue={currentCustomer?.addresses?.[0]?.address ?? ""}
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
                                        defaultValue={currentCustomer?.companyName ?? ""}
                                                label="Firma ünvanı"
                                            />

                                            <Field
                                                name="taxOffice"
                                        defaultValue={currentCustomer?.taxOffice ?? ""}
                                                label="Vergi dairesi"
                                            />

                                            <Field
                                                name="taxNumber"
                                        defaultValue={currentCustomer?.taxNumber ?? ""}
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
                                <span>{money(quoteReady && quote ? quote.subtotal : total)}</span>
                            </div>

                            <div>
                                <span>Kargo</span>
                                <span>
                                    {settings
                                        ? money(shipping)
                                        : "—"}
                                </span>
                            </div>

                            <label className="block mt-4 text-sm">Kupon kodu<input className="w-full border rounded p-2 mt-2" value={couponInput} maxLength={50} onChange={e=>setCouponInput(e.target.value)}/></label>
                            <button type="button" className="button-dark" onClick={()=>setCouponCode(couponInput.trim().toUpperCase())}>Kuponu uygula / kaldır</button>
                            {quoteReady && quote && quote.discountTotal>0 && <div><span>Kupon indirimi</span><strong>−{money(quote.discountTotal)}</strong></div>}
                            <div className="summary-total">
                                <span>Toplam</span>
                                <strong>
                                    {quoteReady && quote ? money(quote.total) : "Hesaplanıyor…"}
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
                                disabled={busy || !settings?.enabled || !quoteReady}
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
    defaultValue,
}: {
    name: string;
    label: string;
    type?: string;
    autoComplete?: string;
    pattern?: string;
    defaultValue?: string;
}) {
    return (
        <label>
            {label}

            <input
                required
                defaultValue={defaultValue}
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