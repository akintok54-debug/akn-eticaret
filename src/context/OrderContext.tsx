"use client";
import {createContext,useCallback,useContext,useEffect,useState,type ReactNode} from "react";
export type OrderStatus="Yeni"|"Hazırlanıyor"|"Kargoda"|"Tamamlandı"|"İptal"|"İade"|"Taslak";
export type OrderItem={productId:string;name:string;price:number;quantity:number;image:string|null;sku?:string;barcode?:string|null;vatRate?:number;lineTotal?:number};
export type Order={subtotal?:number;shippingTotal?:number;couponCode?:string;shippingCompany?:string;trackingNumber?:string;trackingUrl?:string;paymentStatus?:string;paidAt?:string;returnRequestedAt?:string;returnReason?:string;discountTotal?:number;id:string;orderNumber:string;createdAt:string;customer:{fullName:string;phone:string;email:string};delivery:{city:string;district:string;address:string};invoice:{type:"individual"|"corporate";companyName:string;taxOffice:string;taxNumber:string};shippingMethod:string;paymentMethod:string;items:OrderItem[];total:number;status:OrderStatus};
type OrderContextType={hasMore:boolean;loadingMore:boolean;loadMoreOrders:()=>Promise<void>;orders:Order[];error:string;loaded:boolean;addOrder:(order:Order)=>void;refreshOrders:()=>Promise<void>;updateStatus:(id:string,status:OrderStatus)=>Promise<void>};
const OrderContext=createContext<OrderContextType|undefined>(undefined);
export function OrderProvider({children}:{children:ReactNode}) {
 const [nextCursor,setNextCursor]=useState<string|null>(null);
 const [loadingMore,setLoadingMore]=useState(false);
 const [orders,setOrders]=useState<Order[]>([]);
 const [error,setError]=useState("");
 const [loaded,setLoaded]=useState(false);
 const refreshOrders=useCallback(async()=>{try{const response=await fetch("/api/orders",{cache:"no-store"});const data=await response.json();if(!response.ok)throw new Error(data.message);setOrders(data.orders);setNextCursor(data.nextCursor??null);setError("");}catch{setError("Siparişler yüklenemedi. Lütfen tekrar deneyin.");}finally{setLoaded(true);}},[]);
 // Initial synchronization reads the server, never browser-owned order records.
 // eslint-disable-next-line react-hooks/set-state-in-effect
 useEffect(()=>{void refreshOrders();},[refreshOrders]);
 async function loadMoreOrders(){if(!nextCursor||loadingMore)return;setLoadingMore(true);try{const response=await fetch("/api/orders?cursor="+encodeURIComponent(nextCursor),{cache:"no-store"});const data=await response.json();if(!response.ok)throw new Error(data.message);setOrders(old=>[...old,...data.orders.filter((order:Order)=>!old.some(o=>o.id===order.id))]);setNextCursor(data.nextCursor??null);setError("");}catch(e){setError(e instanceof Error?e.message:"Siparişler yüklenemedi.");}finally{setLoadingMore(false);}}
 function addOrder(order:Order){setOrders(current=>[order,...current.filter(o=>o.id!==order.id)]);}
 async function updateStatus(id:string,status:OrderStatus){const response=await fetch(`/api/orders/${id}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({status})});const data=await response.json();if(!response.ok){setError(data.message);return;}setError("");setOrders(current=>current.map(o=>o.id===id?data.order:o));}
 return <OrderContext.Provider value={{hasMore:!!nextCursor,loadingMore,loadMoreOrders,orders,error,loaded,addOrder,updateStatus,refreshOrders}}>{children}</OrderContext.Provider>;
}
export function useOrders(){const value=useContext(OrderContext);if(!value)throw new Error("OrderProvider missing");return value;}
