import { z } from "zod";
import { adminGuard, isAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { orderView, orderTransitions } from "@/lib/order-view";
import { currentCustomer, sameOrigin } from "@/lib/customer-session";
import { guestSession } from "@/lib/guest-session";
import { membershipError } from "@/lib/membership";

const schema=z.object({
 status:z.enum(["Taslak","Yeni","Hazırlanıyor","Kargoda","Tamamlandı","İptal","İade"]).optional(),
 shippingCompany:z.string().trim().max(100).optional(),trackingNumber:z.string().trim().max(100).optional(),
 trackingUrl:z.union([z.url().max(1000).refine(v=>new URL(v).protocol==="https:"),z.literal("")]).optional(),
 paymentStatus:z.enum(["pending","paid","refunded"]).optional(),
 returnReason:z.string().trim().max(2000).optional(),returnNote:z.string().trim().max(2000).optional()
}).refine(v=>Object.keys(v).length>0);

export async function PATCH(request:Request,context:{params:Promise<{id:string}>}) {
 if(!isAdmin(request))return requestReturn(request,context);
 const denied=adminGuard(request);if(denied)return denied;
 try{
  const parsed=schema.safeParse(await request.json());
  if(!parsed.success)return Response.json({message:"Sipariş, ödeme ve kargo bilgilerini kontrol edin."},{status:400});
  const {id}=await context.params, data=parsed.data;
  const result=await prisma.$transaction(async tx=>{
   await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${"order:"+id}))::text`;
   const order=await tx.order.findUniqueOrThrow({where:{id},include:{items:true}});
   const status=data.status??order.status, changed=status!==order.status;
   if(changed&&!orderTransitions[order.status]?.includes(status))throw new Error("TRANSITION");
   if(status==="İade"&&!(data.returnReason??order.returnReason)?.trim())throw new Error("REASON");
   const payment=data.paymentStatus??order.paymentStatus;
   if(["Kargoda","Tamamlandı"].includes(status)&&payment!=="paid")throw new Error("PAYMENT");
   if(status==="Kargoda"&&(!(data.shippingCompany??order.shippingCompany)||!(data.trackingNumber??order.trackingNumber)))throw new Error("SHIPPING");
   if(data.paymentStatus==="refunded"&&(!["İptal","İade"].includes(status)||!["paid","refunded"].includes(order.paymentStatus)))throw new Error("REFUND");
   if(order.paymentStatus==="paid"&&data.paymentStatus==="pending")throw new Error("PAYMENT");
   if(order.paymentStatus==="refunded"&&data.paymentStatus&&data.paymentStatus!=="refunded")throw new Error("PAYMENT");
   const updated=await tx.order.update({where:{id},data:{...data,status,paidAt:payment==="paid"?(order.paidAt??new Date()):order.paidAt,returnedAt:changed&&status==="İade"?new Date():order.returnedAt},include:{items:true}});
   if(changed&&["İptal","İade"].includes(status)){
    for(const item of order.items)if(item.productId)await tx.product.update({where:{id:item.productId},data:{stock:{increment:item.quantity}}});
   }
   return updated;
  },{maxWait:10000,timeout:30000});
  return Response.json({order:orderView(result)});
 }catch(e){
  const messages:Record<string,string>={TRANSITION:"Bu sipariş durumu geçişine izin verilmiyor.",REASON:"İade nedeni zorunludur.",PAYMENT:"Ödeme durumunu kontrol edin. Kargoya teslim için tahsilat onayı gerekir.",SHIPPING:"Kargo firması ve takip numarası zorunludur.",REFUND:"Yalnızca tahsil edilmiş iptal/iade siparişleri için geri ödeme kaydedilebilir."};
  if(e instanceof Error&&messages[e.message])return Response.json({message:messages[e.message]},{status:409});
  return membershipError(e);
 }
}
async function requestReturn(request:Request,context:{params:Promise<{id:string}>}){
 if(!sameOrigin(request))return Response.json({message:"Geçersiz istek kaynağı."},{status:403});
 try{
  const buyer=await currentCustomer(),guest=await guestSession();
  if(!buyer&&!guest)return Response.json({message:"Sipariş oturumu gerekli."},{status:401});
  const body=z.discriminatedUnion("action",[z.object({action:z.literal("request_return"),returnReason:z.string().trim().min(5).max(2000)}),z.object({action:z.literal("cancel")})]).safeParse(await request.json());
  if(!body.success)return Response.json({message:"İade nedenini en az 5 karakterle açıklayın."},{status:400});
  const {id}=await context.params;
  if(body.data.action==="cancel"){
   const result=await prisma.$transaction(async tx=>{
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${"order:"+id}))::text`;
    const order=await tx.order.findFirst({where:{id,OR:[...(buyer?[{customerId:buyer.id}]:[]),...(guest?[{guestSessionId:guest}]:[])]},include:{items:true}});
    if(!order)return {status:404,message:"Sipariş bulunamadı."};
    if(order.status==="İptal")return {status:200,message:"Siparişiniz zaten iptal edildi."};
    if(!["Yeni","Hazırlanıyor"].includes(order.status))return {status:409,message:"Kargoya verilen sipariş iptal edilemez. İade talebi oluşturabilirsiniz."};
    await tx.order.update({where:{id},data:{status:"İptal"}});
    for(const item of order.items)if(item.productId)await tx.product.update({where:{id:item.productId},data:{stock:{increment:item.quantity}}});
    return {status:200,message:order.paymentStatus==="paid"?"Siparişiniz iptal edildi. Geri ödeme mağaza tarafından ayrıca tamamlanacaktır.":"Siparişiniz iptal edildi."};
   },{maxWait:10000,timeout:30000});
   return Response.json({message:result.message},{status:result.status});
  }
  const changed=await prisma.order.updateMany({where:{id,OR:[...(buyer?[{customerId:buyer.id}]:[]),...(guest?[{guestSessionId:guest}]:[])],status:{in:["Kargoda","Tamamlandı"]},returnRequestedAt:null},data:{returnRequestedAt:new Date(),returnReason:body.data.returnReason}});
  if(!changed.count)return Response.json({message:"Sipariş bulunamadı veya mevcut durumu iade talebine uygun değil."},{status:409});
  return Response.json({success:true});
 }catch(e){return membershipError(e);}
}
