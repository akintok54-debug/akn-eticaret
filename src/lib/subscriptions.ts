import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { unitPrice } from "@/lib/pricing";
import { storeSettings } from "@/lib/commerce";
import { shippingCost } from "@/lib/checkout";
import { pushOrderToErp } from "@/lib/erp-sync";

function advance(date:Date,frequency:string,interval:number){
 const next=new Date(date);
 if(frequency==="daily")next.setDate(next.getDate()+interval);
 else if(frequency==="weekly")next.setDate(next.getDate()+7*interval);
 else next.setMonth(next.getMonth()+interval);
 return next;
}

export async function processDueSubscriptions(limit=50){
 const now=new Date();
 const due=await prisma.subscription.findMany({
  where:{status:"active",nextRunAt:{lte:now}},
  orderBy:{nextRunAt:"asc"},
  take:limit,
  select:{id:true}
 });
 const results:Array<{id:string;orderId?:string;ok:boolean;message?:string}>=[];
 for(const row of due){
  try{
   const order=await prisma.$transaction(async tx=>{
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${"subscription:"+row.id}))::text`;
    const sub=await tx.subscription.findUnique({where:{id:row.id},include:{items:true}});
    if(!sub||sub.status!=="active"||sub.nextRunAt>new Date())return null;
    const customer=sub.customerId?await tx.customer.findUnique({where:{id:sub.customerId},include:{group:true}}):null;
    const products=await tx.product.findMany({where:{id:{in:sub.items.map(i=>i.productId)},active:true}});
    if(products.length!==sub.items.length)throw new Error("PRODUCT");
    let subtotalCents=0;
    const lines=[];
    for(const item of sub.items){
     const product=products.find(p=>p.id===item.productId);
     if(!product)throw new Error("PRODUCT");
     const changed=await tx.product.updateMany({where:{id:product.id,active:true,stock:{gte:item.quantity}},data:{stock:{decrement:item.quantity}}});
     if(!changed.count)throw new Error("STOCK");
     const cents=Math.round(unitPrice(product,customer)*100);
     subtotalCents+=cents*item.quantity;
     lines.push({productId:product.id,productName:product.name,sku:product.sku,barcode:product.barcode,unitPrice:cents/100,quantity:item.quantity,vatRate:product.vatRate,lineTotal:cents*item.quantity/100});
    }
    const settings=await storeSettings();
    const shipping=shippingCost(subtotalCents/100,settings);
    const created=await tx.order.create({data:{
     customerId:sub.customerId,orderNumber:`AKN-${randomUUID().replace(/-/g,"").slice(0,16).toUpperCase()}`,
     customerName:sub.customerName,customerPhone:sub.customerPhone,customerEmail:sub.customerEmail,
     city:sub.deliveryCity,district:sub.deliveryDistrict,deliveryAddress:sub.deliveryAddress,
     invoiceType:sub.invoiceType,companyName:sub.companyName,taxOffice:sub.taxOffice,taxNumber:sub.taxNumber,
     shippingMethod:"standard",paymentMethod:sub.paymentMethod,paymentStatus:"pending",status:"Yeni",
     subtotal:subtotalCents/100,shippingTotal:shipping,discountTotal:0,total:(subtotalCents+Math.round(shipping*100))/100,
     items:{create:lines}
    },include:{items:true}});
    const remaining=sub.remainingRuns===null?null:Math.max(0,sub.remainingRuns-1);
    await tx.subscription.update({where:{id:sub.id},data:{
     lastRunAt:new Date(),
     nextRunAt:advance(sub.nextRunAt,sub.frequency,sub.intervalCount),
     remainingRuns:remaining,
     status:remaining===0?"completed":"active"
    }});
    return created;
   },{maxWait:10000,timeout:30000});
   if(order){try{await pushOrderToErp(order.id);}catch(error){console.error("Abonelik ERP senkronu başarısız:",error);}}
   results.push({id:row.id,ok:true,...(order?{orderId:order.id}:{})});
  }catch(e){
   results.push({id:row.id,ok:false,message:e instanceof Error?e.message:"ERROR"});
  }
 }
 return results;
}
