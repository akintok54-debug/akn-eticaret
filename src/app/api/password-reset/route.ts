import {z} from "zod";
import {randomBytes,createHash} from "node:crypto";
import {after} from "next/server";
import {prisma} from "@/lib/prisma";
import {passwordHash,sameOrigin} from "@/lib/customer-session";
import {siteConfiguration} from "@/lib/site-configuration";
import {mailReady,sendResetMail} from "@/lib/mail";
const schema=z.discriminatedUnion("action",[
 z.object({action:z.literal("request"),email:z.email().max(200).transform(v=>v.toLowerCase())}),
 z.object({action:z.literal("reset"),token:z.string().regex(/^[a-f0-9]{64}$/),password:z.string().min(10).max(128)})
]);
const digest=(value:string)=>createHash("sha256").update(value).digest("hex");
const invalid=()=>Response.json({message:"Bağlantı geçersiz, kullanılmış veya süresi dolmuş. Yeni bağlantı isteyin."},{status:400});
export async function POST(request:Request){
 if(!sameOrigin(request))return Response.json({message:"Geçersiz istek kaynağı."},{status:403});
 try{
  const parsed=schema.safeParse(await request.json());if(!parsed.success)return Response.json({message:"E-posta veya bağlantı bilgilerini kontrol edin. Yeni şifre en az 10 karakter olmalıdır."},{status:400});
  const data=parsed.data;
  if(data.action==="request"){
   const settings=await siteConfiguration();
   if(!mailReady(settings))return Response.json({message:"Şifre sıfırlama e-posta hizmeti henüz hazır değil. Lütfen mağazayla iletişime geçin."},{status:503});
   after(async()=>{
    try{
     const token=randomBytes(32).toString("hex");
     const account=await prisma.$transaction(async tx=>{
      await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${"reset:"+data.email}))::text`;
      const found=await tx.customerAccount.findUnique({where:{email:data.email},include:{customer:true}});
      const now=new Date();
      if(!found||!found.customer.active||(found.resetRequestedAt&&now.getTime()-found.resetRequestedAt.getTime()<60000))return null;
      const fresh=!found.resetWindowAt||now.getTime()-found.resetWindowAt.getTime()>=3600000;
      if(!fresh&&found.resetRequests>=5)return null;
      await tx.customerAccount.update({where:{id:found.id},data:{resetTokenHash:digest(token),resetExpiresAt:new Date(now.getTime()+15*60000),resetRequestedAt:now,resetWindowAt:fresh?now:found.resetWindowAt,resetRequests:fresh?1:found.resetRequests+1}});
      return found;
     },{maxWait:10000,timeout:20000});
     if(account){try{await sendResetMail(settings,account.email,token);}catch{
      await prisma.customerAccount.updateMany({where:{id:account.id,resetTokenHash:digest(token)},data:{resetTokenHash:null,resetExpiresAt:null}});
      console.error("AKN password reset email delivery failed.");
     }}
    }catch{console.error("AKN password reset request failed.");}
   });
   return Response.json({message:"Bu adresle aktif bir hesabınız varsa sıfırlama bağlantısı e-posta ile gönderilecektir. Gelen kutunuzu ve spam klasörünü kontrol edin."},{status:202,headers:{"Cache-Control":"no-store"}});
  }
  const tokenHash=digest(data.token);
  const account=await prisma.customerAccount.findUnique({where:{resetTokenHash:tokenHash},include:{customer:true}});
  if(!account||!account.customer.active||!account.resetExpiresAt||account.resetExpiresAt<=new Date())return invalid();
  const hash=await passwordHash(data.password);
  const changed=await prisma.$transaction(async tx=>{
   const result=await tx.customerAccount.updateMany({where:{id:account.id,resetTokenHash:tokenHash,resetExpiresAt:{gt:new Date()},customer:{active:true}},data:{passwordHash:hash,resetTokenHash:null,resetExpiresAt:null,failedLogins:0,lockedUntil:null}});
   if(result.count!==1)return false;
   await tx.customerSession.deleteMany({where:{accountId:account.id}});
   return true;
  });
  if(!changed)return invalid();
  return Response.json({message:"Şifreniz güncellendi ve önceki oturumlarınız kapatıldı. Yeni şifrenizle giriş yapabilirsiniz."},{headers:{"Cache-Control":"no-store"}});
 }catch{return Response.json({message:"İşlem şu anda tamamlanamadı. Lütfen tekrar deneyin."},{status:503});}
}
