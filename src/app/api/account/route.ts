import { adminGuard } from "@/lib/admin";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { currentCustomer, createCustomerSession, endCustomerSession, passwordHash, passwordMatches, sameOrigin } from "@/lib/customer-session";
import { normalizePhone, membershipError } from "@/lib/membership";

const email = z.email().max(200).transform(v=>v.toLowerCase());
const password = z.string().min(10).max(128);
const login = z.object({action:z.literal("login"),email,password:z.string().min(1).max(128)});
const register = z.object({action:z.literal("register"),email,password,fullName:z.string().trim().min(2).max(150),phone:z.string().transform(normalizePhone).refine(v=>/^0[0-9]{10}$/.test(v))});
const change = z.object({action:z.literal("password"),currentPassword:z.string().min(1).max(128),password});
const provision=z.object({action:z.literal("provision"),customerId:z.string().min(1),password});
const schema = z.discriminatedUnion("action",[login,register,change,provision]);
const address = z.object({fullName:z.string().trim().min(2).max(150),city:z.string().trim().min(2).max(100),district:z.string().trim().min(2).max(100),address:z.string().trim().min(10).max(1000)});
const denied = () => Response.json({message:"E-posta veya şifre hatalı ya da hesap geçici olarak kilitli."},{status:401});
export async function GET() {
  try { return Response.json({customer:await currentCustomer()},{headers:{"Cache-Control":"no-store"}}); }
  catch(e){return membershipError(e);}
}
export async function POST(request:Request) {
  if(!sameOrigin(request)) return Response.json({message:"Geçersiz istek kaynağı."},{status:403});
  try {
    const parsed=schema.safeParse(await request.json());
    if(!parsed.success) return Response.json({message:"Bilgileri kontrol edin. Şifre en az 10 karakter olmalıdır."},{status:400});
    const data=parsed.data;
    if(data.action==="provision"){
      const denied=adminGuard(request);if(denied)return denied;
      const customer=await prisma.customer.findUniqueOrThrow({where:{id:data.customerId}});
      const parsedEmail=email.safeParse(customer.email);
      if(!parsedEmail.success)return Response.json({message:"Müşteriye önce geçerli bir e-posta kaydedin."},{status:400});
      const hash=await passwordHash(data.password);
      await prisma.$transaction(async tx=>{
        const account=await tx.customerAccount.upsert({where:{customerId:customer.id},create:{customerId:customer.id,email:parsedEmail.data,passwordHash:hash},update:{email:parsedEmail.data,passwordHash:hash,resetTokenHash:null,resetExpiresAt:null,failedLogins:0,lockedUntil:null}});
        await tx.customerSession.deleteMany({where:{accountId:account.id}});
      });
      return Response.json({success:true});
    }
    if(data.action==="register") {
      const hash=await passwordHash(data.password);
      const account=await prisma.$transaction(async tx=>{
        if(await tx.customer.findFirst({where:{OR:[{phone:data.phone},{email:{equals:data.email,mode:"insensitive"}}]}})) throw new Error("EXISTING_CUSTOMER");
        return tx.customerAccount.create({data:{email:data.email,passwordHash:hash,customer:{create:{fullName:data.fullName,phone:data.phone,email:data.email}}}});
      },{isolationLevel:"Serializable",maxWait:10000,timeout:20000});
      await createCustomerSession(account.id);
      return Response.json({success:true},{status:201});
    }
    if(data.action==="password") {
      const customer=await currentCustomer();
      if(!customer)return denied();
      const account=await prisma.customerAccount.findUnique({where:{customerId:customer.id}});
      if(!account || !await passwordMatches(data.currentPassword,account.passwordHash))return denied();
      const hash=await passwordHash(data.password);
      await prisma.$transaction([prisma.customerAccount.update({where:{id:account.id},data:{passwordHash:hash,resetTokenHash:null,resetExpiresAt:null}}),prisma.customerSession.deleteMany({where:{accountId:account.id}})]);
      await createCustomerSession(account.id);
      return Response.json({success:true});
    }
    const result=await prisma.$transaction(async tx=>{
      await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${"login:"+data.email}))::text`;
      const account=await tx.customerAccount.findUnique({where:{email:data.email},include:{customer:true}});
      if(!account || !account.customer.active || (account.lockedUntil && account.lockedUntil>new Date()))return null;
      if(!await passwordMatches(data.password,account.passwordHash)){
        const failures=account.failedLogins+1;
        await tx.customerAccount.update({where:{id:account.id},data:{failedLogins:failures,lockedUntil:failures>=5?new Date(Date.now()+15*60000):null}});
        return null;
      }
      await tx.customerAccount.update({where:{id:account.id},data:{failedLogins:0,lockedUntil:null}});
      return account.id;
    });
    if(!result)return denied();
    await createCustomerSession(result);
    return Response.json({success:true});
  } catch(e) {
    if(e instanceof Error && e.message==="EXISTING_CUSTOMER")return Response.json({message:"Bu bilgilerle kayıt oluşturulamıyor. Mevcut hesabınızla giriş yapın veya mağazayla iletişime geçin."},{status:409});
    return membershipError(e);
  }
}
export async function PATCH(request:Request) {
  if(!sameOrigin(request))return Response.json({message:"Geçersiz istek kaynağı."},{status:403});
  try {
    const customer=await currentCustomer();
    if(!customer)return denied();
    const parsed=address.safeParse(await request.json());
    if(!parsed.success)return Response.json({message:"Adres bilgilerini kontrol edin."},{status:400});
    await prisma.$transaction(async tx=>{
      await tx.customer.update({where:{id:customer.id},data:{fullName:parsed.data.fullName}});
      const existing=await tx.address.findFirst({where:{customerId:customer.id},orderBy:{isDefault:"desc"}});
      const data={...parsed.data,phone:customer.phone,isDefault:true};
      if(existing)await tx.address.update({where:{id:existing.id},data});
      else await tx.address.create({data:{...data,customerId:customer.id}});
    });
    return Response.json({success:true});
  }catch(e){return membershipError(e);}
}
export async function DELETE(request:Request) {
  if(!sameOrigin(request))return Response.json({message:"Geçersiz istek kaynağı."},{status:403});
  try{await endCustomerSession();return Response.json({success:true});}catch(e){return membershipError(e);}
}
