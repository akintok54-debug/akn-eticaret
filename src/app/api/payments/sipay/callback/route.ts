import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkSipayPayment } from "@/lib/sipay";

async function finish(request:Request){
 const url=new URL(request.url);
 const orderId=url.searchParams.get("orderId")||"";
 if(!orderId)return NextResponse.redirect(new URL("/odeme/sonuc?error=missing",request.url));
 try{
  const order=await prisma.order.findUnique({where:{id:orderId}});
  if(!order||order.paymentMethod!=="sipay")return NextResponse.redirect(new URL("/odeme/sonuc?error=order",request.url));
  const result=await checkSipayPayment(order.id);
  if(result.paid){
   await prisma.order.updateMany({where:{id:order.id,paymentStatus:{not:"paid"}},data:{paymentStatus:"paid",paidAt:new Date()}});
   return NextResponse.redirect(new URL("/odeme/sonuc?orderId="+encodeURIComponent(order.id)+"&paid=1",request.url));
  }
  return NextResponse.redirect(new URL("/odeme/sonuc?orderId="+encodeURIComponent(order.id)+"&paid=0",request.url));
 }catch{
  return NextResponse.redirect(new URL("/odeme/sonuc?orderId="+encodeURIComponent(orderId)+"&error=status",request.url));
 }
}
export async function GET(request:Request){return finish(request);}
export async function POST(request:Request){return finish(request);}
