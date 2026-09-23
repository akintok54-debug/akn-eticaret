"use client";
import Link from "next/link";
import StoreHeader from "@/components/layout/StoreHeader";
import StoreFooter from "@/components/layout/StoreFooter";
import {useOrders} from "@/context/OrderContext";
export default function AccountPage(){const {orders}=useOrders();return <><StoreHeader/><main className="store-container"><div className="page-heading"><span className="overline">AKN MOTOSİKLET</span><h1>Alışveriş hesabım</h1></div><div className="form-panel mb-12"><h2>Üyeliksiz alışveriş</h2><p className="text-sm text-slate-500 leading-7">Sipariş vermek için üye olmanız gerekmez. Bu tarayıcıdan oluşturduğunuz siparişlerinizi güvenli oturumunuz üzerinden takip edebilirsiniz. Tarayıcı çerezlerini sildiğinizde bu erişim sona erer.</p><div className="mt-6 flex flex-wrap gap-3"><Link href="/siparisler" className="button-dark">Siparişlerim ({orders.length}) ↗</Link><Link href="/urunler" className="button-red">Alışverişe devam et ↗</Link></div></div></main><StoreFooter/></>}
