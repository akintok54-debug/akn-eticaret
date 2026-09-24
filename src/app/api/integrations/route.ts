import { NextResponse } from "next/server";
import { z } from "zod";
import { adminGuard } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { integrationItems } from "@/lib/integrations";
import { encryptSecret } from "@/lib/site-configuration";

const bodySchema=z.object({slug:z.string().min(1).max(80),enabled:z.boolean(),values:z.record(z.string(),z.string().max(4000))});
const allowed=new Map(integrationItems.filter(i=>i.mode==="settings").map(i=>[i.slug,i]));

export async function GET(request:Request){
 const denied=adminGuard(request);if(denied)return denied;
 const rows=await prisma.integrationSetting.findMany({orderBy:{slug:"asc"}});
 return NextResponse.json({integrations:rows.map(r=>({slug:r.slug,enabled:r.enabled,values:Object.fromEntries(Object.keys((r.values as Record<string,string>)||{}).map(k=>[k,""])),configured:Object.keys((r.values as Record<string,string>)||{})}))},{headers:{"Cache-Control":"no-store"}});
}

export async function PATCH(request:Request){
 const denied=adminGuard(request);if(denied)return denied;
 const parsed=bodySchema.safeParse(await request.json().catch(()=>null));
 if(!parsed.success)return NextResponse.json({message:"Entegrasyon bilgilerini kontrol edin."},{status:400});
 const item=allowed.get(parsed.data.slug);if(!item)return NextResponse.json({message:"Bu entegrasyon bu ekrandan yapılandırılamaz."},{status:400});
 const existing=await prisma.integrationSetting.findUnique({where:{slug:parsed.data.slug}});
 const previous=(existing?.values as Record<string,string>|null)||{};
 const clean:Record<string,string>={};
 for(const field of item.fields||[]){
  const value=(parsed.data.values[field.key]||"").trim();
  if(value)clean[field.key]=field.secret?encryptSecret(value):value;
  else if(previous[field.key])clean[field.key]=previous[field.key];
 }
 const saved=await prisma.integrationSetting.upsert({where:{slug:parsed.data.slug},create:{slug:parsed.data.slug,enabled:parsed.data.enabled,values:clean},update:{enabled:parsed.data.enabled,values:clean}});
 return NextResponse.json({success:true,slug:saved.slug,enabled:saved.enabled,configured:Object.keys(clean)});
}
