"use client";
import {createContext,useContext,useEffect,useState,type ReactNode} from "react";
import {useProducts} from "@/context/ProductContext";
type Result=Promise<boolean>;
type CatalogContextType={categories:string[];brands:string[];error:string;addCategory:(name:string)=>Result;renameCategory:(oldName:string,name:string)=>Result;deleteCategory:(name:string)=>Result;addBrand:(name:string)=>Result;renameBrand:(oldName:string,name:string)=>Result;deleteBrand:(name:string)=>Result};
const Context=createContext<CatalogContextType|undefined>(undefined);
const unique=(values:string[])=>Array.from(new Map(values.map(v=>v.trim()).filter(Boolean).map(v=>[v.toLocaleLowerCase("tr-TR"),v])).values()).sort((a,b)=>a.localeCompare(b,"tr"));
type Entry={kind:string;name:string};
export function CatalogProvider({children}:{children:ReactNode}){
 const {products,refreshProducts}=useProducts(),[entries,setEntries]=useState<Entry[]>([]),[error,setError]=useState("");
 useEffect(()=>{const controller=new AbortController();fetch("/api/catalog",{cache:"no-store",signal:controller.signal}).then(async r=>{if(!r.ok)throw new Error();return r.json();}).then(d=>setEntries(d.entries)).catch(()=>{if(!controller.signal.aborted)setError("Kategori ve marka kayıtları yüklenemedi.");});return()=>controller.abort();},[]);
 async function mutate(kind:string,action:string,name:string,oldName?:string){
  try{const r=await fetch("/api/catalog",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({kind,action,name,oldName})});const d=await r.json();if(!r.ok)throw new Error(d.message);
   const read=await fetch("/api/catalog",{cache:"no-store"});if(!read.ok)throw new Error("Kayıtlar yenilenemedi.");setEntries((await read.json()).entries);await refreshProducts();setError("");return true;
  }catch(e){setError(e instanceof Error?e.message:"Kaydedilemedi.");return false;}
 }
 return <Context.Provider value={{categories:unique([...entries.filter(e=>e.kind==="category").map(e=>e.name),...products.map(p=>p.category)]),brands:unique([...entries.filter(e=>e.kind==="brand").map(e=>e.name),...products.map(p=>p.brand)]),error,addCategory:name=>mutate("category","add",name),renameCategory:(oldName,name)=>mutate("category","rename",name,oldName),deleteCategory:name=>mutate("category","deactivate",name),addBrand:name=>mutate("brand","add",name),renameBrand:(oldName,name)=>mutate("brand","rename",name,oldName),deleteBrand:name=>mutate("brand","deactivate",name)}}>{children}</Context.Provider>;
}
export function useCatalog(){const c=useContext(Context);if(!c)throw new Error("CatalogProvider missing");return c;}
