import {z} from "zod";
import {revalidatePath} from "next/cache";
import {adminGuard} from "@/lib/admin";
import {prisma} from "@/lib/prisma";
import {siteConfiguration,safeConfiguration,encryptSecret} from "@/lib/site-configuration";
import {mailTransport} from "@/lib/mail";
const seo=z.object({action:z.literal("seo"),siteTitle:z.string().trim().min(2).max(120),siteDescription:z.string().trim().min(10).max(500),keywords:z.string().trim().max(500),geoContent:z.string().trim().max(10000)});
const mail=z.object({action:z.literal("mail"),smtpHost:z.string().trim().max(253).regex(/^$|^(?=.{1,253}$)[a-zA-Z0-9](?:[a-zA-Z0-9.-]*[a-zA-Z0-9])?$/),smtpPort:z.union([z.literal(465),z.literal(587)]),smtpUser:z.string().trim().max(200),smtpFrom:z.union([z.literal(""),z.email().max(200)]),smtpPassword:z.string().max(500),smtpEnabled:z.boolean(),publicUrl:z.union([z.literal(""),z.url().max(500).refine(v=>{const u=new URL(v);return u.protocol==="https:"&&!u.username&&!u.password&&u.pathname==="/"&&!u.search&&!u.hash;})])});
export async function GET(request:Request){
 const denied=adminGuard(request);if(denied)return denied;
 try{return Response.json({settings:safeConfiguration(await siteConfiguration()),activeSessions:await prisma.customerSession.count({where:{expiresAt:{gt:new Date()}}})},{headers:{"Cache-Control":"no-store"}});}catch{return Response.json({message:"Ayarlar yüklenemedi."},{status:503});}
}
export async function PATCH(request:Request){
 const denied=adminGuard(request);if(denied)return denied;
 try{
  const body=await request.json();
  if(body.action==="revokeSessions"){
   if(body.confirm!==true)return Response.json({message:"Oturumları kapatma onayı gerekli."},{status:400});
   const result=await prisma.customerSession.deleteMany({});
   return Response.json({message:result.count+" müşteri oturumu kapatıldı.",activeSessions:0});
  }
  if(body.action==="verifyMail"){
   const settings=await siteConfiguration();
   if(!settings.smtpHost||!settings.smtpUser||!settings.smtpPassword||!settings.smtpFrom)return Response.json({message:"Önce e-posta ayarlarını kaydedin."},{status:400});
   const transport=mailTransport(settings);
   try{await transport.verify();return Response.json({message:"SMTP bağlantısı ve kimlik doğrulaması başarılı. E-posta gönderilmedi."});}
   catch{return Response.json({message:"SMTP bağlantısı doğrulanamadı. Sunucu, port ve giriş bilgilerini kontrol edin."},{status:502});}
   finally{transport.close();}
  }
  const parsed=body.action==="seo"?seo.safeParse(body):mail.safeParse(body);
  if(!parsed.success)return Response.json({message:"Alanları kontrol edin. Site adresi https:// ile başlayan ana adres olmalı; SMTP portu 465 veya 587 olmalıdır."},{status:400});
  const {action,...values}=parsed.data;
  let saved;
  if(action==="seo"){
   saved=await prisma.siteConfiguration.upsert({where:{id:"main"},create:{id:"main",...values},update:values});
  }else{
   const input=mail.parse(body);const existing=await siteConfiguration();
   const password=input.smtpPassword?encryptSecret(input.smtpPassword):existing.smtpPassword;
   if(input.smtpEnabled&&(!password||!input.smtpHost||!input.smtpUser||!input.smtpFrom||!input.publicUrl))return Response.json({message:"E-posta gönderimini açmak için tüm SMTP bilgileri ve canlı site adresi gerekli."},{status:400});
   const {action:_,smtpPassword:__,...settings}=input;void _;void __;
   saved=await prisma.siteConfiguration.upsert({where:{id:"main"},create:{id:"main",...settings,smtpPassword:password},update:{...settings,smtpPassword:password}});
  }
  if(action==="seo")revalidatePath("/", "layout");
  return Response.json({settings:safeConfiguration(saved),message:"Ayarlar kaydedildi."});
 }catch{return Response.json({message:"Ayarlar kaydedilemedi. Lütfen tekrar deneyin."},{status:503});}
}
