import { prisma } from "@/lib/prisma";
import { decryptSecret } from "@/lib/site-configuration";

async function erpConfig(){
 const s=await prisma.integrationSetting.findUnique({where:{slug:"bahadir-erp-v2"}});
 if(!s?.enabled)return null; const v=(s.values as Record<string,string>)||{};
 if(!v.baseUrl||!v.clientId||!v.clientSecret)return null;
 return {url:v.baseUrl.replace(/\/+$/,""),headers:{"X-Client-Id":String(v.clientId),"X-Client-Secret":decryptSecret(v.clientSecret),"Content-Type":"application/json"}};
}
export async function pushOrderToErp(orderId:string){
 const c=await erpConfig(); if(!c)return null;
 const o=await prisma.order.findUnique({where:{id:orderId},include:{items:true}}); if(!o)return null;
 const r=await fetch(c.url+"/api/integrations/akn/siparisler",{method:"POST",headers:c.headers,body:JSON.stringify(o)});
 if(!r.ok)throw new Error(`ERP_ORDER_${r.status}`);
 const j=await r.json(); await prisma.order.update({where:{id:o.id},data:{erpOrderId:String(j.siparisId),lastErpSyncAt:new Date()}});
 return j;
}
export async function pullErpCatalog(){
 const c=await erpConfig(); if(!c)return {updated:0};
 const r=await fetch(c.url+"/api/integrations/akn/katalog",{headers:c.headers,cache:"no-store"}); if(!r.ok)throw new Error(`ERP_CATALOG_${r.status}`);
 const j=await r.json(); let updated=0;
 for(const x of (j.urunler||[])){
  const p=await prisma.product.findFirst({where:{OR:[{erpProductId:String(x._id)}, {sku:String(x.kod||"")},...(x.barkod?[{barcode:String(x.barkod)}]:[])]}});
  if(!p)continue;
  await prisma.product.update({where:{id:p.id},data:{erpProductId:String(x._id),purchasePrice:Number(x.alisFiyati||0),retailPrice:Number(x.perakendeFiyati??x.satisFiyati??0),dealerPrice:Number(x.bayiFiyati??x.satisFiyati??0),vatRate:Number(x.kdv||0),stock:Math.max(0,Math.trunc(Number(x.stok||0))),criticalStock:Math.max(0,Math.trunc(Number(x.kritikStok||0))),active:x.aktif!==false,lastErpSyncAt:new Date()}});
  updated++;
 }
 return {updated};
}
