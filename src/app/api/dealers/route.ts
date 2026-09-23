import { z } from "zod";
import { prisma } from "@/lib/prisma";
const text=z.string().trim().min(2).max(200);
const schema=z.object({fullName:text,phone:z.string().regex(/^\+?[0-9 ()-]{10,20}$/),email:z.email().max(200),companyName:text,taxOffice:text,taxNumber:z.string().regex(/^\d{10,11}$/),city:text,district:text,address:z.string().trim().min(10).max(1000)});
export async function POST(request:Request){
 const origin=request.headers.get("origin");
 if(!origin||(origin!==new URL(request.url).origin&&origin!==process.env.SITE_URL))return Response.json({message:"Geçersiz istek."},{status:403});
 try{const parsed=schema.safeParse(await request.json());if(!parsed.success)return Response.json({message:"Lütfen başvuru bilgilerinizi kontrol edin."},{status:400});
 const {city,district,address,...data}=parsed.data;
 const phone=data.phone.replace(/[^0-9]/g,"");
 const existing=await prisma.customer.findUnique({where:{phone},select:{id:true}});
 if(!existing)await prisma.customer.create({data:{...data,phone,type:"dealer",dealerStatus:"pending",addresses:{create:{fullName:data.fullName,phone,city,district,address}}}});
 return Response.json({message:"Başvurunuz alındı. Aynı telefonla mevcut başvurunuz varsa kaydınız korunur."});
 }catch{return Response.json({message:"Başvuru şu anda kaydedilemiyor. Lütfen daha sonra deneyin."},{status:503});}
}
