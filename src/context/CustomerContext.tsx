"use client";
import {createContext,useContext,useEffect,useState,type ReactNode} from "react";
import {usePathname} from "next/navigation";
export type CustomerType="retail"|"dealer";
export type DealerStatus="none"|"pending"|"approved"|"passive";
export type Customer={id:string;erpCustomerId:string|null;fullName:string;phone:string;email:string;city:string;district:string;address:string;type:CustomerType;dealerStatus:DealerStatus;companyName:string;taxOffice:string;taxNumber:string;createdAt:string};
type Context={customers:Customer[];currentCustomer:Customer|null;isApprovedDealer:boolean;updateDealerStatus:(id:string,status:DealerStatus)=>Promise<void>};
const CustomerContext=createContext<Context|undefined>(undefined);
export function CustomerProvider({children}:{children:ReactNode}){const [customers,setCustomers]=useState<Customer[]>([]);const path=usePathname();useEffect(()=>{if(!path.startsWith("/admin"))return;fetch("/api/customers").then(r=>r.ok?r.json():null).then(d=>{if(d)setCustomers(d.customers);}).catch(()=>{});},[path]);async function updateDealerStatus(id:string,status:DealerStatus){const r=await fetch("/api/customers",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({id,status})});if(!r.ok){alert("Bayi durumu kaydedilemedi.");return;}setCustomers(list=>list.map(c=>c.id===id?{...c,dealerStatus:status}:c));}return <CustomerContext.Provider value={{customers,currentCustomer:null,isApprovedDealer:false,updateDealerStatus}}>{children}</CustomerContext.Provider>}
export function useCustomers(){const c=useContext(CustomerContext);if(!c)throw new Error("CustomerProvider missing");return c;}
