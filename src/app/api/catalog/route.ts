import {z} from "zod";
import {prisma} from "@/lib/prisma";
import {adminGuard} from "@/lib/admin";
import {membershipError} from "@/lib/membership";
const name=z.string().trim().min(1).max(150).transform(v=>v.replace(/\s+/g," "));
const schema=z.object({kind:z.enum(["category","brand"]),action:z.enum(["add","rename","deactivate"]),name,oldName:name.optional()});
export async function GET(){
 try{return Response.json({entries:await prisma.catalogEntry.findMany({where:{active:true},orderBy:{name:"asc"}})},{headers:{"Cache-Control":"no-store"}});}
 catch(e){return membershipError(e);}
}
export async function PATCH(request:Request){
 const denied=adminGuard(request);if(denied)return denied;
 try{
  const parsed=schema.safeParse(await request.json());
  if(!parsed.success)return Response.json({message:"Kategori veya marka bilgilerini kontrol edin."},{status:400});
  const {kind,action,name,oldName}=parsed.data;
  if(action==="rename"&&!oldName)return Response.json({message:"Önceki ad gerekli."},{status:400});
  await prisma.$transaction(async tx=>{
   await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${"catalog:"+kind}))::text`;
   const where=kind==="category"?{category:action==="rename"?oldName:name}:{brand:action==="rename"?oldName:name};
   if(action==="deactivate"){
    if(await tx.product.count({where}))throw new Error("IN_USE");
    await tx.catalogEntry.upsert({where:{kind_name:{kind,name}},create:{kind,name,active:false},update:{active:false}});
    return;
   }
   const collision=await tx.catalogEntry.findFirst({where:{kind,name:{equals:name,mode:"insensitive"},active:true}});
   if(collision&&collision.name!==oldName)throw new Error("DUPLICATE");
   await tx.catalogEntry.upsert({where:{kind_name:{kind,name}},create:{kind,name},update:{active:true}});
   if(action==="rename"&&oldName!==name){
    await tx.product.updateMany({where,data:kind==="category"?{category:name}:{brand:name}});
    await tx.catalogEntry.updateMany({where:{kind,name:oldName},data:{active:false}});
   }
  },{isolationLevel:"Serializable",maxWait:10000,timeout:20000});
  return Response.json({success:true});
 }catch(e){
  if(e instanceof Error&&["IN_USE","DUPLICATE"].includes(e.message))return Response.json({message:e.message==="IN_USE"?"Bu kayıt ürünlerde kullanılıyor. Önce ürünleri başka bir kayda taşıyın.":"Bu ad zaten kullanılıyor."},{status:409});
  return membershipError(e);
 }
}
