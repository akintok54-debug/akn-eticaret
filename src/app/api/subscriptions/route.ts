import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { currentCustomer, sameOrigin } from "@/lib/customer-session";
import { isAdmin } from "@/lib/admin";
import { unitPrice } from "@/lib/pricing";
import { sipayReady } from "@/lib/sipay";

const createSchema=z.object({
 frequency:z.enum(["weekly","monthly"]),
 intervalCount:z.number().int().min(1).max(12),
 remainingRuns:z.number().int().min(1).max(120).nullable().optional(),
 paymentMethod:z.enum(["transfer","sipay"]),
 nextRunAt:z.iso.datetime(),
 delivery:z.object({city:z.string().trim().min(2).max(100),district:z.string().trim().min(2).max(100),address:z.string().trim().min(10).max(1000)}),
 invoice:z.object({type:z.enum(["individual","corporate"]),companyName:z.string().max(200).default(""),taxOffice:z.string().max(200).default(""),taxNumber:z.string().max(11).default("")}),
 note:z.string().trim().max(1000).optional(),
 items:z.array(z.object({productId:z.string().min(1).max(100),quantity:z.number().int().min(1).max(999)})).min(1).max(50)
});

export async function GET(request:Request){
 try{
  if(isAdmin(request)){
   const rows=await prisma.subscription.findMany({include:{items:true},orderBy:{createdAt:"desc"},take:300});
   return Response.json({subscriptions:rows},{headers:{"Cache-Control":"no-store"}});
  }
  const buyer=await currentCustomer();
  if(!buyer)return Response.json({subscriptions:[]},{headers:{"Cache-Control":"no-store"}});
  const rows=await prisma.subscription.findMany({where:{customerId:buyer.id},include:{items:true},orderBy:{createdAt:"desc"}});
  return Response.json({subscriptions:rows},{headers:{"Cache-Control":"no-store"}});
 }catch{return Response.json({message:"Abonelikler alınamadı."},{status:503});}
}

export async function POST(request:Request){
 if(!sameOrigin(request))return Response.json({message:"Geçersiz istek kaynağı."},{status:403});
 try{
  const buyer=await currentCustomer();
  if(!buyer)return Response.json({message:"Abonelik oluşturmak için üye girişi gerekli."},{status:401});
  const parsed=createSchema.safeParse(await request.json());
  if(!parsed.success)return Response.json({message:"Abonelik bilgilerini kontrol edin."},{status:400});
  if(parsed.data.paymentMethod==="sipay"&&!(await sipayReady().catch(()=>false)))return Response.json({message:"Kartlı abonelik için Sipay aktif değil."},{status:409});
  const quantities=new Map<string,number>();for(const i of parsed.data.items)quantities.set(i.productId,(quantities.get(i.productId)??0)+i.quantity);
  const products=await prisma.product.findMany({where:{id:{in:[...quantities.keys()]},active:true}});
  if(products.length!==quantities.size)return Response.json({message:"Abonelikte geçersiz ürün var."},{status:409});
  const data=parsed.data;
  const sub=await prisma.subscription.create({data:{
   customerId:buyer.id,customerName:buyer.fullName,customerPhone:buyer.phone,customerEmail:buyer.email,
   status:"active",frequency:data.frequency,intervalCount:data.intervalCount,remainingRuns:data.remainingRuns??null,nextRunAt:new Date(data.nextRunAt),
   paymentMethod:data.paymentMethod,deliveryCity:data.delivery.city,deliveryDistrict:data.delivery.district,deliveryAddress:data.delivery.address,
   invoiceType:data.invoice.type,companyName:data.invoice.companyName||null,taxOffice:data.invoice.taxOffice||null,taxNumber:data.invoice.taxNumber||null,note:data.note||null,
   items:{create:products.map(p=>({productId:p.id,productName:p.name,sku:p.sku,unitPrice:unitPrice(p,buyer),quantity:quantities.get(p.id)!}))}
  },include:{items:true}});
  return Response.json({subscription:sub},{status:201});
 }catch{return Response.json({message:"Abonelik oluşturulamadı."},{status:503});}
}

export async function PATCH(request:Request){
 if(!sameOrigin(request))return Response.json({message:"Geçersiz istek kaynağı."},{status:403});
 try{
  const parsed=z.object({id:z.string().min(1).max(100),action:z.enum(["pause","resume","cancel"])}).safeParse(await request.json());
  if(!parsed.success)return Response.json({message:"Abonelik işlemi geçersiz."},{status:400});
  const admin=isAdmin(request),buyer=admin?null:await currentCustomer();
  if(!admin&&!buyer)return Response.json({message:"Üye girişi gerekli."},{status:401});
  const existing=await prisma.subscription.findFirst({where:admin?{id:parsed.data.id}:{id:parsed.data.id,customerId:buyer!.id}});
  if(!existing)return Response.json({message:"Abonelik bulunamadı."},{status:404});
  if(["completed","cancelled"].includes(existing.status))return Response.json({message:"Bu abonelik artık değiştirilemez."},{status:409});
  const status=parsed.data.action==="pause"?"paused":parsed.data.action==="resume"?"active":"cancelled";
  const updated=await prisma.subscription.update({where:{id:existing.id},data:{status},include:{items:true}});
  return Response.json({subscription:updated});
 }catch{return Response.json({message:"Abonelik güncellenemedi."},{status:503});}
}
