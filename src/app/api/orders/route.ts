import { storeSettings, couponDiscount } from "@/lib/commerce";
import { currentCustomer, sameOrigin } from "@/lib/customer-session";
import { unitPrice } from "@/lib/pricing";
import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { guestSession } from "@/lib/guest-session";
import { checkoutSchema, shippingCost } from "@/lib/checkout";
import { orderView } from "@/lib/order-view";
import { isAdmin } from "@/lib/admin";
import { pushOrderToErp } from "@/lib/erp-sync";
import { legalSnapshot } from "@/lib/legal";

export async function GET(request: Request) {
 try {
  const admin = isAdmin(request);
  const guest = admin ? null : await guestSession();
  const buyer=admin?null:await currentCustomer();
  if (!admin && !guest && !buyer) return Response.json({orders:[]},{headers:{"Cache-Control":"no-store"}});
  const cursor=new URL(request.url).searchParams.get("cursor");
  if(cursor && cursor.length>100)return Response.json({message:"Geçersiz sayfa."},{status:400});
  const orders = await prisma.order.findMany({where:admin?{}:{OR:[...(guest?[{guestSessionId:guest}]:[]),...(buyer?[{customerId:buyer.id}]:[])]},include:{items:true,legalAcceptances:true},orderBy:[{createdAt:"desc"},{id:"desc"}],take:101,...(cursor?{cursor:{id:cursor},skip:1}:{})});
  const hasMore=orders.length>100;
  const page=orders.slice(0,100);
  return Response.json({orders:page.map(orderView),nextCursor:hasMore?page[page.length-1].id:null},{headers:{"Cache-Control":"no-store"}});
 } catch { return Response.json({message:"Siparişler alınamadı."},{status:503}); }
}

export async function POST(request: Request) {

 if(!sameOrigin(request)) return Response.json({message:"Geçersiz istek kaynağı."},{status:403});
 try {
  const settings=await storeSettings();
  if(!settings.enabled)return Response.json({message:"Sipariş alımı henüz açık değil."},{status:503});
  const parsed=checkoutSchema.safeParse(await request.json());
  if (!parsed.success) return Response.json({message:"Teslimat, fatura ve sepet bilgilerinizi kontrol edin."},{status:400});
  const data=parsed.data;
  const guest=await guestSession(true);
  const buyer=await currentCustomer();
  const isDealer=buyer?.type==="dealer"&&buyer.dealerStatus==="approved";
  if(!data.legal.kvkkNoticeRead) return Response.json({message:"KVKK aydınlatma metnini okuduğunuzu teyit edin."},{status:400});
  if(isDealer ? !data.legal.b2bTermsAccepted : (!data.legal.preInformationAccepted||!data.legal.distanceSalesAccepted)) return Response.json({message:"Siparişi tamamlamak için gerekli satış metinlerini okuyup onaylayın."},{status:400});
  const key=`${buyer?.id??guest}:${data.checkoutKey}`;
  const existing=await prisma.order.findUnique({where:{checkoutKey:key},include:{items:true,legalAcceptances:true}});
  if(existing) return Response.json({order:orderView(existing)});
  const quantities=new Map<string,number>();
  for(const item of data.items) quantities.set(item.productId,(quantities.get(item.productId)??0)+item.quantity);
  if([...quantities.values()].some(q=>q>999)) return Response.json({message:"Ürün adedi sınırı aşıldı."},{status:400});
  const order=await prisma.$transaction(async tx=>{
   await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${key}))::text`;
   const retry=await tx.order.findUnique({where:{checkoutKey:key},include:{items:true,legalAcceptances:true}});
   if(retry)return retry;
   const products=await tx.product.findMany({where:{id:{in:[...quantities.keys()]},active:true}});
   if(products.length!==quantities.size) throw new Error("STOCK");
   let subtotalCents=0;
   const lines=[];
   for(const product of products.sort((a,b)=>a.id.localeCompare(b.id))){
    const quantity=quantities.get(product.id)!;
    const changed=await tx.product.updateMany({where:{id:product.id,active:true,stock:{gte:quantity}},data:{stock:{decrement:quantity}}});
    if(!changed.count) throw new Error("STOCK");
    const cents=Math.round(unitPrice(product,buyer)*100);
    if(!Number.isSafeInteger(cents)||cents<0) throw new Error("PRICE");
    subtotalCents+=cents*quantity;
    lines.push({productId:product.id,productName:product.name,sku:product.sku,barcode:product.barcode,unitPrice:cents/100,quantity,vatRate:product.vatRate,lineTotal:cents*quantity/100});
   }
   const subtotal=subtotalCents/100;
   const code=data.couponCode?.toUpperCase()||null;
   let discountCents=0;
   if(code){
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${"coupon:"+code}))::text`;
    const coupon=await tx.coupon.findUnique({where:{code}});
    discountCents=couponDiscount(coupon,subtotalCents);
    await tx.coupon.update({where:{code},data:{usedCount:{increment:1}}});
   }
   const shipping=shippingCost((subtotalCents-discountCents)/100,settings);
   if (Math.round(data.expectedTotal * 100) !== subtotalCents-discountCents + Math.round(shipping * 100)) throw new Error("PRICE_CHANGED");
   const totalValue=(subtotalCents-discountCents+Math.round(shipping*100))/100;
   const legalExtra=[`Alıcı: ${data.customer.fullName}`,`Teslimat: ${data.delivery.address}, ${data.delivery.district} / ${data.delivery.city}`,`Ödeme: ${data.paymentMethod==="sipay"?"Kredi/Banka Kartı":"Havale / EFT"}`,`Ara toplam: ${subtotal.toFixed(2)} TL`,`İndirim: ${(discountCents/100).toFixed(2)} TL`,`Kargo: ${shipping.toFixed(2)} TL`,`Genel toplam: ${totalValue.toFixed(2)} TL`,"Ürünler:",...lines.map(x=>`- ${x.productName} | ${x.quantity} adet | ${x.unitPrice.toFixed(2)} TL | KDV %${x.vatRate}`)].join("\n");
   const legalAcceptances=isDealer
    ? [legalSnapshot("bayi-satis-kosullari",legalExtra),legalSnapshot("kvkk",legalExtra)]
    : [legalSnapshot("on-bilgilendirme",legalExtra),legalSnapshot("mesafeli-satis",legalExtra),legalSnapshot("kvkk",legalExtra)];
   const created = await tx.order.create({data:{checkoutKey:key,guestSessionId:buyer?null:guest,customerId:buyer?.id,orderNumber:`AKN-${randomUUID().replace(/-/g,"").slice(0,16).toUpperCase()}`,customerName:data.customer.fullName,customerPhone:data.customer.phone,customerEmail:data.customer.email,city:data.delivery.city,district:data.delivery.district,deliveryAddress:data.delivery.address,invoiceType:data.invoice.type,companyName:data.invoice.companyName,taxOffice:data.invoice.taxOffice,taxNumber:data.invoice.taxNumber,shippingMethod:"standard",paymentMethod:data.paymentMethod,subtotal,couponCode:code,discountTotal:discountCents/100,shippingTotal:shipping,total:totalValue,items:{create:lines},legalAcceptances:{create:legalAcceptances}},include:{items:true,legalAcceptances:true}});
   if (data.cartSessionId) {
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${data.cartSessionId}))::text`;
    await tx.shoppingCart.updateMany({where:{sessionId:data.cartSessionId,completedAt:null},data:{status:"Tamamlandı",completedAt:new Date(),abandonedAt:null,orderId:created.id,orderNumber:created.orderNumber,customerName:created.customerName,customerPhone:created.customerPhone,customerEmail:created.customerEmail,checkoutStarted:true}});
   }
   return created;
  },{maxWait:10000,timeout:30000});
  try { await pushOrderToErp(order.id); } catch (erpError) { console.error("AKN ERP sipariş senkronu başarısız:", erpError); }
  return Response.json({order:orderView(order)},{status:201});
 } catch(error) {
  if(error instanceof Error && error.message==="COUPON") return Response.json({message:"Kupon artık kullanılamıyor. Sepet tutarını yeniden kontrol edin."},{status:409});
  if(error instanceof SyntaxError) return Response.json({message:"Geçersiz istek."},{status:400});
  if(error instanceof Error && error.message==="PRICE_CHANGED") return Response.json({message:"Fiyat veya kargo tutarı değişti. Sepetinizi güncelleyip yeniden onaylayın."},{status:409});
  if(error instanceof Error && error.message==="STOCK") return Response.json({message:"Sepetinizdeki bir ürün için yeterli stok kalmadı. Sepetinizi güncelleyin."},{status:409});
  return Response.json({message:"Sipariş kaydedilemedi. Lütfen tekrar deneyin; sepetiniz korunuyor."},{status:503});
 }
}
