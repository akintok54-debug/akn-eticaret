"use client";
import {createContext,useCallback,useContext,useEffect,useState,type ReactNode} from "react";
import type {Product} from "@/types/product";
type BatchResult={added:number;updated:number;failed:number};
type Context={products:Product[];loaded:boolean;error:string;refreshProducts:()=>Promise<void>;addProduct:(p:Product)=>Promise<boolean>;updateProduct:(id:string,changes:Partial<Product>)=>Promise<boolean>;addManyProducts:(p:Product[])=>Promise<BatchResult>;updateManyProducts:(ids:string[],fn:(p:Product)=>Product)=>Promise<boolean>;deleteProduct:(id:string)=>Promise<boolean>;toggleProduct:(id:string)=>Promise<boolean>;changeStock:(id:string,amount:number)=>Promise<boolean>};
const ProductContext=createContext<Context|undefined>(undefined);
function normalize(p:Product):Product{return {...p,barcode:p.barcode??"",purchasePrice:Number(p.purchasePrice??0),dealerPrice:Number(p.dealerPrice??p.retailPrice),image:p.image??null};}
function payload(p:Partial<Product>){return {...p,...("barcode" in p?{barcode:p.barcode?.trim()||null}:{}),...("image" in p?{image:p.image?.trim()||null}:{})};}
export function ProductProvider({children}:{children:ReactNode}){
 const [products,setProducts]=useState<Product[]>([]);const [loaded,setLoaded]=useState(false);const [error,setError]=useState("");
 const refreshProducts=useCallback(async()=>{try{const r=await fetch("/api/products",{cache:"no-store"});const data=await r.json();if(!r.ok)throw new Error(data.message);setProducts(data.products.map(normalize));setError("");}catch{setError("Ürünlere şu anda ulaşılamıyor. Lütfen tekrar deneyin.");}finally{setLoaded(true);}},[]);
 // Synchronize remote catalog after hydration.
 // eslint-disable-next-line react-hooks/set-state-in-effect
 useEffect(()=>{void refreshProducts();},[refreshProducts]);
 async function request(path:string,method:string,body?:unknown){const response=await fetch(path,{method,headers:{"Content-Type":"application/json"},...(body===undefined?{}:{body:JSON.stringify(body)})});const data=await response.json();if(!response.ok)throw new Error(data.message||"İşlem kaydedilemedi.");return data;}
 async function mutate(path:string,method:string,body?:unknown){try{await request(path,method,body);await refreshProducts();return true;}catch(e){const message=e instanceof Error?e.message:"İşlem kaydedilemedi.";setError(message);alert(message);return false;}}
 const addProduct=(p:Product)=>mutate("/api/products","POST",payload(p));
 const updateProduct=(id:string,p:Partial<Product>)=>mutate(`/api/products/${id}`,"PATCH",payload(p));
 const deleteProduct=(id:string)=>mutate(`/api/products/${id}`,"DELETE");
 const changeStock=(id:string,amount:number)=>mutate(`/api/products/${id}/stock`,"PATCH",{amount});
 async function toggleProduct(id:string){const p=products.find(p=>p.id===id);return p?updateProduct(id,{active:!p.active}):false;}
 async function addManyProducts(incoming:Product[]){const result={added:0,updated:0,failed:0};const known=[...products];for(const p of incoming){const old=known.find(v=>v.sku===p.sku||(p.barcode&&v.barcode===p.barcode));try{const data=await request(old?`/api/products/${old.id}`:"/api/products",old?"PATCH":"POST",payload(p));if(old)result.updated++;else{result.added++;known.push(data.product);}}catch{result.failed++;}}await refreshProducts();return result;}
 async function updateManyProducts(ids:string[],fn:(p:Product)=>Product){let failed=0;for(const p of products.filter(p=>ids.includes(p.id))){try{await request(`/api/products/${p.id}`,"PATCH",payload(fn(p)));}catch{failed++;}}await refreshProducts();if(failed){alert(`${failed} ürün güncellenemedi. Kayıtları kontrol edin.`);return false;}return true;}
 return <ProductContext.Provider value={{products,loaded,error,refreshProducts,addProduct,updateProduct,deleteProduct,changeStock,toggleProduct,addManyProducts,updateManyProducts}}>{children}</ProductContext.Provider>;
}
export function useProducts(){const context=useContext(ProductContext);if(!context)throw new Error("ProductProvider missing");return context;}
