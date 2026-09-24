import { NextResponse } from "next/server";
import { adminGuard } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { decryptSecret } from "@/lib/site-configuration";

type ErpProduct={_id?:string;kod?:string;barkod?:string};
const base=(v:string)=>v.trim().replace(/\/+$/,"");
const authHeaders=(token:string)=>({Authorization:`Bearer ${token}`,"Content-Type":"application/json"});

export async function POST(request:Request){
 const denied=adminGuard(request); if(denied)return denied;
 const setting=await prisma.integrationSetting.findUnique({where:{slug:"bahadir-erp-v2"}});
 if(!setting?.enabled)return NextResponse.json({message:"Bahadır ERP V2 entegrasyonu etkin değil."},{status:400});
 const v=(setting.values as Record<string,string>)||{};
 if(!v.baseUrl||!v.apiToken)return NextResponse.json({message:"ERP bağlantı bilgileri eksik."},{status:400});
 const token=decryptSecret(v.apiToken),headers=authHeaders(token),url=base(v.baseUrl);
 const local=await prisma.product.findMany({orderBy:{createdAt:"asc"}});
 const erpRes=await fetch(url+"/api/integrations/akn/urunler",{headers,cache:"no-store"});
 if(!erpRes.ok)return NextResponse.json({message:`ERP ürünleri alınamadı (${erpRes.status}).`},{status:502});
 const ej=await erpRes.json();
 const remote:ErpProduct[]=Array.isArray(ej.urunler)?ej.urunler:[];
 let created=0,updated=0,conflicts=0,failed=0;
 for(const p of local){
  try{
   const skuMatches=remote.filter(x=>(x.kod||"").toUpperCase()===p.sku.toUpperCase());
   const barcodeMatches=p.barcode?remote.filter(x=>(x.barkod||"")===p.barcode):[];
   const ids=new Set([...skuMatches,...barcodeMatches].map(x=>x._id).filter(Boolean));
   if(ids.size>1){conflicts++;continue;}
   const match=remote.find(x=>(p.erpProductId&&x._id===p.erpProductId)||ids.has(x._id));
   const body={kod:p.sku,barkod:p.barcode||"",ad:p.name,kategori:p.category,marka:p.brand,kdv:p.vatRate,
    alisFiyati:p.purchasePrice,satisFiyati:p.retailPrice,bayiFiyati:p.dealerPrice,
    perakendeFiyati:p.retailPrice,kritikStok:p.criticalStock,gorsel:p.image||"",aktif:p.active};
   const endpoint=match?url+"/api/integrations/akn/urunler/"+match._id:url+"/api/integrations/akn/urunler";
   const rr=await fetch(endpoint,{method:match?"PATCH":"POST",headers,body:JSON.stringify(body)});
   if(!rr.ok){failed++;continue;}
   const data=await rr.json(); const rid=String(data.urun?._id||match?._id||"");
   if(rid)await prisma.product.update({where:{id:p.id},data:{erpProductId:rid,lastErpSyncAt:new Date()}});
   match?updated++:created++;
  }catch{failed++;}
 }
 return NextResponse.json({success:failed===0&&conflicts===0,direction:"AKN_TO_ERP",created,updated,conflicts,failed,totalLocal:local.length});
}
