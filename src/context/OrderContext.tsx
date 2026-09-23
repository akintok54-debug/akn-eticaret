"use client";
import {createContext,useCallback,useContext,useEffect,useState,type ReactNode} from "react";
export type OrderStatus="Yeni"|"Hazırlanıyor"|"Kargoda"|"Tamamlandı"|"İptal";
export type OrderItem={productId:string;name:string;price:number;quantity:number;image:string|null};
export type Order={id:string;orderNumber:string;createdAt:string;customer:{fullName:string;phone:string;email:string};delivery:{city:string;district:string;address:string};invoice:{type:"individual"|"corporate";companyName:string;taxOffice:string;taxNumber:string};shippingMethod:string;paymentMethod:string;items:OrderItem[];total:number;status:OrderStatus};
type OrderContextType={orders:Order[];error:string;loaded:boolean;addOrder:(order:Order)=>void;refreshOrders:()=>Promise<void>;updateStatus:(id:string,status:OrderStatus)=>Promise<void>};
const OrderContext=createContext<OrderContextType|undefined>(undefined);
export function OrderProvider({children}:{children:ReactNode}) {
 const [orders,setOrders]=useState<Order[]>([]);
 const [error,setError]=useState("");
 const [loaded,setLoaded]=useState(false);
 const refreshOrders=useCallback(async()=>{try{const response=await fetch("/api/orders",{cache:"no-store"});const data=await response.json();if(!response.ok)throw new Error(data.message);setOrders(data.orders);setError("");}catch{setError("Siparişler yüklenemedi. Lütfen tekrar deneyin.");}finally{setLoaded(true);}},[]);
 // Initial synchronization reads the server, never browser-owned order records.
 // eslint-disable-next-line react-hooks/set-state-in-effect
 useEffect(()=>{void refreshOrders();},[refreshOrders]);
 function addOrder(order:Order){setOrders(current=>[order,...current.filter(o=>o.id!==order.id)]);}
 async function updateStatus(id:string,status:OrderStatus){const response=await fetch(`/api/orders/${id}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({status})});const data=await response.json();if(!response.ok){setError(data.message);return;}setError("");setOrders(current=>current.map(o=>o.id===id?data.order:o));}
 return <OrderContext.Provider value={{orders,error,loaded,addOrder,updateStatus,refreshOrders}}>{children}</OrderContext.Provider>;
}
export function useOrders(){const value=useContext(OrderContext);if(!value)throw new Error("OrderProvider missing");return value;}
