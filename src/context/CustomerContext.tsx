"use client";
import {createContext,useCallback,useContext,useEffect,useState,type ReactNode} from "react";
import {usePathname} from "next/navigation";
export type CustomerType="retail"|"dealer";
export type DealerStatus="none"|"pending"|"approved"|"passive";
export type Customer={id:string;erpCustomerId:string|null;fullName:string;phone:string;email:string;city:string;district:string;address:string;type:CustomerType;dealerStatus:DealerStatus;companyName:string;taxOffice:string;taxNumber:string;createdAt:string;addresses?:{city:string;district:string;address:string}[]};
type Context={customers:Customer[];currentCustomer:Customer|null;loaded:boolean;error:string;refreshCustomer:()=>Promise<void>;isApprovedDealer:boolean;updateDealerStatus:(id:string,status:DealerStatus)=>Promise<void>};
const CustomerContext=createContext<Context|undefined>(undefined);
export function CustomerProvider({children}:{children:ReactNode}){
 const [customers,setCustomers]=useState<Customer[]>([]),[currentCustomer,setCurrent]=useState<Customer|null>(null),[loaded,setLoaded]=useState(false),[error,setError]=useState("");
 const path=usePathname();
 const refreshCustomer=useCallback(async()=>{try{const r=await fetch("/api/account",{cache:"no-store"});const d=await r.json();if(!r.ok)throw new Error(d.message);setCurrent(d.customer);setError("");}catch{setError("Hesap bilgileri alınamadı.");}finally{setLoaded(true);}},[]);
 useEffect(()=>{const controller=new AbortController();fetch("/api/account",{cache:"no-store",signal:controller.signal}).then(async r=>{if(!r.ok)throw new Error();return r.json();}).then(d=>{setCurrent(d.customer);setLoaded(true);}).catch(()=>{if(!controller.signal.aborted){setError("Hesap bilgileri alınamadı.");setLoaded(true);}});return()=>controller.abort();},[]);
 useEffect(()=>{if(!path.startsWith("/admin"))return;fetch("/api/customers").then(r=>r.ok?r.json():null).then(d=>{if(d)setCustomers(d.customers);}).catch(()=>{});},[path]);
 async function updateDealerStatus(id:string,status:DealerStatus){const r=await fetch("/api/customers",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({id,status})});if(!r.ok){setError("Bayi durumu kaydedilemedi.");return;}setCustomers(list=>list.map(c=>c.id===id?{...c,dealerStatus:status}:c));}
 return <CustomerContext.Provider value={{customers,currentCustomer,loaded,error,refreshCustomer,isApprovedDealer:currentCustomer?.type==="dealer"&&currentCustomer.dealerStatus==="approved",updateDealerStatus}}>{children}</CustomerContext.Provider>;
}
export function useCustomers(){const c=useContext(CustomerContext);if(!c)throw new Error("CustomerProvider missing");return c;}
