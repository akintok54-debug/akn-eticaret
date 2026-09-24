import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { adminGuard } from "@/lib/admin";
import { guestSession } from "@/lib/guest-session";
import { currentCustomer, sameOrigin } from "@/lib/customer-session";
import { unitPrice } from "@/lib/pricing";
import { shippingCost } from "@/lib/checkout";
import { storeSettings,settingsSchema,couponSchema,couponDiscount } from "@/lib/commerce";
import { membershipError } from "@/lib/membership";

export async function GET(request:Request){
 try{
  const manage=new URL(request.url).searchParams.get("manage")==="1";
  if(manage){const denied=adminGuard(request);if(denied)return denied;}
  const settings=await storeSettings();
  if(manage)return Response.json({settings,coupons:await prisma.coupon.findMany({orderBy:{createdAt:"desc"}})},{headers:{"Cache-Control":"no-store"}});
  if(settings.enabled)await guestSession(true);
  return Response.json({...settings,bankName:settings.enabled?settings.bankName:"",iban:settings.enabled?settings.iban:""},{headers:{"Cache-Control":"no-store"}});
 }catch(e){return membershipError(e);}
}
export async function PATCH(request:Request){
 const denied=adminGuard(request);if(denied)return denied;
 try{
  const body=await request.json();
  if(body.action==="shipping"||body.action==="payment"){
   const current=await storeSettings();
   const parsed=body.action==="shipping"?z.object({shipping:z.number().finite().min(0).max(100000),threshold:z.number().finite().min(0).max(10000000)}).safeParse(body):z.object({enabled:z.boolean(),bankName:z.string().trim().max(200),iban:z.string().trim().max(50)}).safeParse(body);
   if(!parsed.success||!settingsSchema.safeParse({...current,...parsed.data}).success)return Response.json({message:"Kargo veya ödeme bilgilerini kontrol edin. Satış için geçerli alıcı adı ve Türk IBAN gerekli."},{status:400});
   const settings=await prisma.storeSettings.upsert({where:{id:"main"},create:{id:"main",enabled:current.enabled,bankName:current.bankName,iban:current.iban,shipping:current.shipping,threshold:current.threshold,...parsed.data},update:parsed.data});
   return Response.json({settings});
  }
  if(body.action==="settings"){
   const parsed=settingsSchema.safeParse(body);
   if(!parsed.success)return Response.json({message:"Kargo tutarını, hesap adını ve IBAN bilgisini kontrol edin."},{status:400});
   const settings=await prisma.storeSettings.upsert({where:{id:"main"},create:{id:"main",...parsed.data},update:parsed.data});
   return Response.json({settings});
  }
  if(body.action==="coupon"){
   const parsed=couponSchema.safeParse(body);
   if(!parsed.success)return Response.json({message:"Kupon bilgilerini ve tarih aralığını kontrol edin."},{status:400});
   const {id,...data}=parsed.data;
   const coupon=id?await prisma.coupon.update({where:{id},data}):await prisma.coupon.create({data});
   return Response.json({coupon});
  }
  return Response.json({message:"Geçersiz işlem."},{status:400});
 }catch(e){return membershipError(e);}
}
export async function POST(request:Request){
 if(!sameOrigin(request))return Response.json({message:"Geçersiz istek kaynağı."},{status:403});
 try{
  const parsed=z.object({items:z.array(z.object({productId:z.string().min(1).max(100),quantity:z.number().int().min(1).max(999)})).min(1).max(100),couponCode:z.string().trim().max(50).optional()}).safeParse(await request.json());
  if(!parsed.success)return Response.json({message:"Sepet bilgilerini kontrol edin."},{status:400});
  const quantities=new Map<string,number>();for(const item of parsed.data.items)quantities.set(item.productId,(quantities.get(item.productId)??0)+item.quantity);
  const [products,buyer,settings]=await Promise.all([prisma.product.findMany({where:{id:{in:[...quantities.keys()]},active:true}}),currentCustomer(),storeSettings()]);
  if(products.length!==quantities.size||products.some(p=>p.stock<quantities.get(p.id)!||quantities.get(p.id)!>999))return Response.json({message:"Sepetinizde yeterli stok olmayan ürün var."},{status:409});
  const subtotalCents=products.reduce((sum,p)=>sum+Math.round(unitPrice(p,buyer)*100)*quantities.get(p.id)!,0);
  const code=parsed.data.couponCode?.toUpperCase()||null;
  const discount=code?couponDiscount(await prisma.coupon.findUnique({where:{code}}),subtotalCents):0;
  const shipping=shippingCost((subtotalCents-discount)/100,settings);
  return Response.json({subtotal:subtotalCents/100,discountTotal:discount/100,shippingTotal:shipping,total:(subtotalCents-discount+Math.round(shipping*100))/100,couponCode:code},{headers:{"Cache-Control":"no-store"}});
 }catch(e){if(e instanceof Error&&e.message==="COUPON")return Response.json({message:"Kupon geçersiz, süresi dolmuş veya sepet koşullarını karşılamıyor."},{status:400});return membershipError(e);}
}
