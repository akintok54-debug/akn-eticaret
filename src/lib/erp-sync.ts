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

export async function pushAccountPaymentToErp(paymentId:string){
 const c=await erpConfig(); if(!c)return null;
 const p=await prisma.accountPayment.findUnique({where:{id:paymentId},include:{customer:true}});
 if(!p||p.status!=="paid")return null;
 const body={paymentId:p.id,tutar:p.amount,reference:p.providerRef||p.id,erpCustomerId:p.customer.erpCustomerId,customerEmail:p.customer.email,customerPhone:p.customer.phone};
 const r=await fetch(c.url+"/api/integrations/akn/cari-tahsilatlar",{method:"POST",headers:{...c.headers,"Idempotency-Key":p.id},body:JSON.stringify(body)});
 if(!r.ok)throw new Error("ERP_ACCOUNT_PAYMENT_"+r.status);
 const j=await r.json() as {cariHareketId?:string};
 await prisma.accountPayment.update({where:{id:p.id},data:{erpMovementId:String(j.cariHareketId||""),erpSyncedAt:new Date()}});
 return j;
}

export async function fetchCustomerAccountFromErp(customer:{erpCustomerId:string|null;email:string|null;phone:string}){
 const c=await erpConfig(); if(!c)return null;
 const q=new URLSearchParams(); if(customer.erpCustomerId)q.set("erpCustomerId",customer.erpCustomerId); if(customer.email)q.set("email",customer.email); if(customer.phone)q.set("telefon",customer.phone);
 const r=await fetch(c.url+"/api/integrations/akn/cari-hesap?"+q.toString(),{headers:c.headers,cache:"no-store"});
 if(r.status===404)return null; if(!r.ok)throw new Error("ERP_ACCOUNT_"+r.status);
 return r.json();
}
