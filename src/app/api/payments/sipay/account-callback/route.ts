import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkSipayPayment } from "@/lib/sipay";
import { pushAccountPaymentToErp } from "@/lib/erp-sync";

async function finish(request:Request){
 const url=new URL(request.url),id=url.searchParams.get("paymentId")||"";
 if(!id)return NextResponse.redirect(new URL("/cari-odeme?error=missing",request.url));
 try{
  const payment=await prisma.accountPayment.findUnique({where:{id}});
  if(!payment)return NextResponse.redirect(new URL("/cari-odeme?error=payment",request.url));
  const result=await checkSipayPayment("CARI-"+payment.id);
  if(!result.paid)return NextResponse.redirect(new URL("/cari-odeme?paymentId="+encodeURIComponent(id)+"&paid=0",request.url));
  await prisma.accountPayment.updateMany({where:{id,status:{not:"paid"}},data:{status:"paid",paidAt:new Date()}});
  try{await pushAccountPaymentToErp(id);}catch{}
  return NextResponse.redirect(new URL("/cari-odeme?paymentId="+encodeURIComponent(id)+"&paid=1",request.url));
 }catch{
  return NextResponse.redirect(new URL("/cari-odeme?paymentId="+encodeURIComponent(id)+"&error=status",request.url));
 }
}
export async function GET(request:Request){return finish(request);}
export async function POST(request:Request){return finish(request);}
