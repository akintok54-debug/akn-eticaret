import { currentCustomer, sameOrigin } from "@/lib/customer-session";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { adminGuard, isAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { membershipError } from "@/lib/membership";

const priority = z.enum(["low", "normal", "high", "urgent"]);
const createSchema = z.object({
  customerId: z.string().min(1).optional().nullable(), customerName: z.string().trim().max(150).optional().nullable(),
  customerPhone: z.string().trim().max(30).optional().nullable(), customerEmail: z.union([z.email().max(200), z.literal("")]).optional().nullable(),
  subject: z.string().trim().min(2).max(200), category: z.string().trim().min(1).max(50).default("general"),
  priority: priority.default("normal"), message: z.string().trim().min(1).max(5000),
});
const updateSchema = z.object({
  id: z.string().min(1), status: z.enum(["open", "in_progress", "closed"]).optional(), priority: priority.optional(),
  category: z.string().trim().min(1).max(50).optional(), message: z.string().trim().min(1).max(5000).optional(),
}).refine(v => v.status !== undefined || v.priority !== undefined || v.category !== undefined || v.message !== undefined);
const include = { customer: { select: { id: true, fullName: true, phone: true, email: true, type: true, dealerStatus: true } }, messages: { orderBy: { createdAt: "asc" as const } } };

export async function GET(request: Request) {
  if (!isAdmin(request)) return customerSupport(request);
  const denied = adminGuard(request); if (denied) return denied;
  try {
    const tickets = await prisma.supportTicket.findMany({ include, orderBy: { updatedAt: "desc" } });
    return Response.json({ tickets }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) { return membershipError(e); }
}
export async function POST(request: Request) {
  if (!isAdmin(request)) return customerSupport(request);
  const denied = adminGuard(request); if (denied) return denied;
  try {
    const parsed = createSchema.safeParse(await request.json());
    if (!parsed.success) return Response.json({ message: "Destek talebi bilgilerini kontrol edin." }, { status: 400 });
    const { message, ...data } = parsed.data;
    const customer = data.customerId ? await prisma.customer.findUniqueOrThrow({ where: { id: data.customerId } }) : null;
    const ticket = await prisma.supportTicket.create({
      data: { ...data, customerName: customer?.fullName ?? data.customerName, customerPhone: customer?.phone ?? data.customerPhone, customerEmail: customer?.email ?? data.customerEmail,
        ticketNumber: "AKN-" + randomUUID().slice(0, 13).toUpperCase(),
        messages: { create: { senderType: "admin", senderName: "Yönetici", message } } }, include,
    });
    return Response.json({ success: true, ticket }, { status: 201 });
  } catch (e) { return membershipError(e); }
}
export async function PATCH(request: Request) {
  if (!isAdmin(request)) return customerSupport(request);
  const denied = adminGuard(request); if (denied) return denied;
  try {
    const parsed = updateSchema.safeParse(await request.json());
    if (!parsed.success) return Response.json({ message: "Geçersiz destek talebi işlemi." }, { status: 400 });
    const { id, message, status, ...data } = parsed.data;
    const ticket = await prisma.supportTicket.update({
      where: { id }, data: { ...data, ...(status ? { status, closedAt: status === "closed" ? new Date() : null } : {}),
        ...(message ? { messages: { create: { senderType: "admin", senderName: "Yönetici", message } } } : {}) }, include,
    });
    return Response.json({ success: true, ticket });
  } catch (e) { return membershipError(e); }
}

async function customerSupport(request:Request) {
  if(request.method!=="GET"&&!sameOrigin(request))return Response.json({message:"Geçersiz istek kaynağı."},{status:403});
  try {
    const customer=await currentCustomer();
    if(!customer)return Response.json({message:"Üye girişi gerekli."},{status:401});
    if(request.method==="GET"){
      const tickets=await prisma.supportTicket.findMany({where:{customerId:customer.id},include:{messages:{orderBy:{createdAt:"asc"}}},orderBy:{updatedAt:"desc"},take:100});
      return Response.json({tickets},{headers:{"Cache-Control":"no-store"}});
    }
    if(request.method==="POST"){
      const parsed=createSchema.pick({subject:true,message:true}).safeParse(await request.json());
      if(!parsed.success)return Response.json({message:"Konu ve mesajı kontrol edin."},{status:400});
      const ticket=await prisma.supportTicket.create({data:{ticketNumber:"AKN-"+randomUUID().slice(0,13).toUpperCase(),customerId:customer.id,customerName:customer.fullName,customerPhone:customer.phone,customerEmail:customer.email,subject:parsed.data.subject,messages:{create:{senderType:"customer",senderName:customer.fullName,message:parsed.data.message}}},include:{messages:true}});
      return Response.json({ticket},{status:201});
    }
    const parsed=z.object({id:z.string().min(1),message:z.string().trim().min(1).max(5000)}).safeParse(await request.json());
    if(!parsed.success)return Response.json({message:"Mesajınızı kontrol edin."},{status:400});
    const ticket=await prisma.supportTicket.update({where:{id:parsed.data.id,customerId:customer.id},data:{status:"open",closedAt:null,messages:{create:{senderType:"customer",senderName:customer.fullName,message:parsed.data.message}}},include:{messages:true}});
    return Response.json({ticket});
  }catch(e){return membershipError(e);}
}
