import { z } from "zod";
import { adminGuard } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { customerSchema, membershipError } from "@/lib/membership";

const include = { group: true, addresses: { orderBy: [{ isDefault: "desc" as const }, { createdAt: "asc" as const }], take: 1 }, _count: { select: { orders: true } } };
const updateSchema = customerSchema.partial().extend({ id: z.string().min(1), status: z.enum(["none", "pending", "approved", "passive"]).optional() });

export async function GET(request: Request) {
  const denied = adminGuard(request); if (denied) return denied;
  try {
    const customers = await prisma.customer.findMany({ include, orderBy: { createdAt: "desc" } });
    return Response.json({ customers: customers.map(c => ({ ...c, city: c.addresses[0]?.city ?? "", district: c.addresses[0]?.district ?? "", address: c.addresses[0]?.address ?? "" })) }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return membershipError(error); }
}

async function save(request: Request, editing: boolean) {
  const denied = adminGuard(request); if (denied) return denied;
  try {
    const body = await request.json();
    const parsed = editing ? updateSchema.safeParse(body) : customerSchema.safeParse(body);
    if (!parsed.success) return Response.json({ message: "Müşteri bilgilerini ve iskonto oranını kontrol edin." }, { status: 400 });
    const { city, district, address, ...values } = parsed.data;
    const id = "id" in values ? values.id as string : undefined;
    const status = "status" in values ? values.status as string | undefined : undefined;
    const { fullName, phone, email, companyName, taxOffice, taxNumber, type, active, discountRate } = values;
    const customer = await prisma.$transaction(async tx => {
      const existing = id ? await tx.customer.findUniqueOrThrow({ where: { id }, include: { addresses: include.addresses } }) : null;
      const groupId = values.groupId === undefined ? existing?.groupId : values.groupId || null;
      if (groupId && (!existing || values.groupId !== undefined || type !== undefined || status === "approved")) {
        const group = await tx.customerGroup.findUnique({ where: { id: groupId } });
        if (!group || group.type !== (status === "approved" ? "dealer" : type ?? existing?.type) || (!group.active && existing?.groupId !== groupId)) throw new Error("GROUP");
      }
      const data = { fullName, phone, email, companyName, taxOffice, taxNumber, type: status === "approved" ? "dealer" : type, active, discountRate, groupId,
        dealerStatus: status ?? (type === "retail" ? "none" : type === "dealer" && existing?.type !== "dealer" ? "approved" : undefined) };
      const saved = existing
        ? await tx.customer.update({ where: { id }, data })
        : await tx.customer.create({ data: { ...data, fullName: fullName!, phone: phone!, type: type!, discountRate: discountRate! } });
      if (existing && email) await tx.customerAccount.updateMany({where:{customerId:saved.id},data:{email:email.toLowerCase()}});
      if (city !== undefined || district !== undefined || address !== undefined) {
        const previous = existing?.addresses[0];
        const addressData = { fullName: saved.fullName, phone: saved.phone, city: city ?? previous?.city ?? "", district: district ?? previous?.district ?? "", address: address ?? previous?.address ?? "", companyName: saved.companyName, taxOffice: saved.taxOffice, taxNumber: saved.taxNumber };
        if (previous) await tx.address.update({ where: { id: previous.id }, data: addressData });
        else if (city || district || address) await tx.address.create({ data: { ...addressData, customerId: saved.id, isDefault: true } });
      }
      return saved;
    }, { isolationLevel: "Serializable",maxWait:10000,timeout:20000 });
    return Response.json({ success: true, customer }, { status: editing ? 200 : 201 });
  } catch (error) { return membershipError(error); }
}

export async function POST(request: Request) { return save(request, false); }
export async function PATCH(request: Request) { return save(request, true); }
