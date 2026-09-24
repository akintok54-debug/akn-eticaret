import { createHash, createHmac, randomBytes, randomUUID, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
const cookieName="akn-guest";
const digest=(value:string)=>createHash("sha256").update(value).digest("hex");
export async function guestSession(create=false):Promise<string|null>{
 const jar=await cookies(),raw=jar.get(cookieName)?.value;
 if(raw){
  if(/^[a-f0-9]{64}$/.test(raw)){
   const session=await prisma.guestSession.findUnique({where:{tokenHash:digest(raw)}});
   if(session&&session.expiresAt>new Date())return session.id;
  }else{
   // Keep previously issued signed guest cookies valid without changing any secret.
   const [id,signature]=raw.split("."),secret=process.env.SESSION_SECRET;
   if(secret&&secret.length>=32&&/^[a-f0-9-]{36}$/.test(id)&&/^[a-f0-9]{64}$/.test(signature??"")){
    const expected=createHmac("sha256",secret).update(id).digest("hex");
    if(timingSafeEqual(Buffer.from(signature),Buffer.from(expected)))return id;
   }
  }
 }
 if(!create)return null;
 const id=randomUUID(),token=randomBytes(32).toString("hex");
 await prisma.guestSession.create({data:{id,tokenHash:digest(token),expiresAt:new Date(Date.now()+30*86400000)}});
 jar.set(cookieName,token,{httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"lax",path:"/",maxAge:30*86400});
 return id;
}
