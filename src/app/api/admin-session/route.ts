import { cookies } from "next/headers";
import { z } from "zod";
import { adminCredentialsMatch, adminToken } from "@/lib/admin";
import { sameOrigin } from "@/lib/customer-session";
const schema=z.object({user:z.string().min(1).max(200),password:z.string().min(1).max(512)});
const attempts=new Map<string,{count:number;until:number}>();
export async function POST(request:Request) {
  if(!sameOrigin(request))return Response.json({message:"Geçersiz istek kaynağı."},{status:403});
  const ip=request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const now=Date.now();
  for(const [key,value] of attempts)if(value.until<=now)attempts.delete(key);
  if(attempts.size>=10000&&!attempts.has(ip))return Response.json({message:"Lütfen daha sonra tekrar deneyin."},{status:429});
  const attempt=attempts.get(ip)??{count:0,until:now+60000};
  if(attempt.count>=10)return Response.json({message:"Çok fazla deneme. Bir dakika sonra tekrar deneyin."},{status:429,headers:{"Retry-After":"60"}});
  attempt.count++;attempts.set(ip,attempt);
  const data=schema.safeParse(await request.json().catch(()=>null));
  if(!data.success||!adminCredentialsMatch(data.data.user,data.data.password))return Response.json({message:"Yönetici kullanıcı adı veya şifresi hatalı."},{status:401,headers:{"Cache-Control":"no-store"}});
  attempts.delete(ip);
  const jar=await cookies();
  jar.delete("akn-customer");
  jar.set("akn-admin",adminToken(),{httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"strict",path:"/",maxAge:8*3600});
  return Response.json({success:true},{headers:{"Cache-Control":"no-store"}});
}
export async function DELETE(request:Request) {
  if(!sameOrigin(request))return Response.json({message:"Geçersiz istek kaynağı."},{status:403});
  (await cookies()).delete("akn-admin");
  return Response.json({success:true},{headers:{"Cache-Control":"no-store"}});
}
