import {createCipheriv,createDecipheriv,createHash,randomBytes} from "node:crypto";
import {prisma} from "@/lib/prisma";
export const defaults={siteTitle:"AKN Motosiklet | Yedek Parça ve Aksesuar",siteDescription:"Motosiklet yedek parça ve aksesuar mağazası",keywords:"",geoContent:"",smtpHost:"",smtpPort:587,smtpUser:"",smtpPassword:"",smtpFrom:"",smtpEnabled:false,publicUrl:""};
export async function siteConfiguration(){return await prisma.siteConfiguration.findUnique({where:{id:"main"}})??defaults;}
export async function publicSeo(){const s=await siteConfiguration();return {siteTitle:s.siteTitle,siteDescription:s.siteDescription,keywords:s.keywords,geoContent:s.geoContent};}
function key(){if(!process.env.ADMIN_PASSWORD||process.env.ADMIN_PASSWORD.length<16)throw new Error("MAIL_KEY");return createHash("sha256").update("akn-smtp-v1:"+process.env.ADMIN_PASSWORD).digest();}
export function encryptSecret(value:string){const iv=randomBytes(12),cipher=createCipheriv("aes-256-gcm",key(),iv);const encrypted=Buffer.concat([cipher.update(value,"utf8"),cipher.final()]);return [iv.toString("hex"),cipher.getAuthTag().toString("hex"),encrypted.toString("hex")].join(".");}
export function decryptSecret(value:string){const [iv,tag,data]=value.split(".");const decipher=createDecipheriv("aes-256-gcm",key(),Buffer.from(iv,"hex"));decipher.setAuthTag(Buffer.from(tag,"hex"));return Buffer.concat([decipher.update(Buffer.from(data,"hex")),decipher.final()]).toString("utf8");}
export function safeConfiguration(s:typeof defaults){const {smtpPassword,...rest}=s;return {...rest,smtpPassword:"",hasSmtpPassword:!!smtpPassword};}
