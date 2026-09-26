import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { currentCustomer, sameOrigin } from "@/lib/customer-session";
import { guestSession } from "@/lib/guest-session";
import { createSipayLink } from "@/lib/sipay";

export async function POST(request:Request){
 if(!sameOrigin(request))return Response.json({message:"Geçersiz istek kaynağı."},{status:403});
 const parsed=z.object({orderId:z.string().min(1).max(100)}).safeParse(await request.json().catch(()=>null));
 if(!parsed.success)return Response.json({message:"Sipariş bilgisi geçersiz."},{status:400});
 const [buyer,guest]=await Promise.all([currentCustomer(),guestSession()]);
 const order=await prisma.order.findFirst({where:{id:parsed.data.orderId,OR:[...(buyer?[{customerId:buyer.id}]:[]),...(guest?[{guestSessionId:guest}]:[])]},include:{items:true}});
 if(!order)return Response.json({message:"Sipariş bulunamadı."},{status:404});
 if(order.paymentMethod!=="sipay")return Response.json({message:"Bu sipariş kart ödemesine açık değil."},{status:409});
 if(order.paymentStatus==="paid")return Response.json({message:"Sipariş zaten ödendi."},{status:409});
 try{
  const origin=new URL(request.url).origin;
  const result=await createSipayLink(order,origin);
  return Response.json(result);
 }catch(e){
  return Response.json({message:e instanceof Error?e.message:"Sipay ödeme başlatılamadı."},{status:502});
 }
}
