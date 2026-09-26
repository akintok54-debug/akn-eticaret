import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { currentCustomer, sameOrigin } from "@/lib/customer-session";
import { createSipayAccountPaymentLink, sipayReady } from "@/lib/sipay";
import { fetchCustomerAccountFromErp, pushAccountPaymentToErp } from "@/lib/erp-sync";

export async function GET(){
 const customer=await currentCustomer();
 if(!customer)return Response.json({message:"Oturum açmanız gerekiyor."},{status:401});
 let payments=await prisma.accountPayment.findMany({where:{customerId:customer.id},orderBy:{createdAt:"desc"},take:100});
 for(const p of payments.filter(x=>x.status==="paid"&&!x.erpSyncedAt).slice(0,5)){try{await pushAccountPaymentToErp(p.id);}catch{}}
 payments=await prisma.accountPayment.findMany({where:{customerId:customer.id},orderBy:{createdAt:"desc"},take:100});
 let account=null; try{account=await fetchCustomerAccountFromErp(customer);}catch{}
 return Response.json({payments,account},{headers:{"Cache-Control":"no-store"}});
}
export async function POST(request:Request){
 if(!sameOrigin(request))return Response.json({message:"Geçersiz istek kaynağı."},{status:403});
 const customer=await currentCustomer();
 if(!customer)return Response.json({message:"Oturum açmanız gerekiyor."},{status:401});
 if(customer.type!=="dealer"||customer.dealerStatus!=="approved")return Response.json({message:"Cari kart ödemesi onaylı bayilere açıktır."},{status:403});
 const parsed=z.object({amount:z.coerce.number().min(1).max(1000000)}).safeParse(await request.json().catch(()=>null));
 if(!parsed.success)return Response.json({message:"Geçerli bir ödeme tutarı girin."},{status:400});
 if(!await sipayReady())return Response.json({message:"Kart ödeme sistemi şu anda kullanıma hazır değil."},{status:503});
 const payment=await prisma.accountPayment.create({data:{customerId:customer.id,amount:Math.round(parsed.data.amount*100)/100}});
 try{
  const result=await createSipayAccountPaymentLink(payment,customer,new URL(request.url).origin);
  await prisma.accountPayment.update({where:{id:payment.id},data:{providerRef:result.reference}});
  return Response.json({paymentId:payment.id,link:result.link},{status:201});
 }catch(e){
  await prisma.accountPayment.update({where:{id:payment.id},data:{status:"failed"}});
  return Response.json({message:e instanceof Error?e.message:"Kart ödemesi başlatılamadı."},{status:502});
 }
}
