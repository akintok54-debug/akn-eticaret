import { z } from "zod";
import { adminGuard } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { membershipError } from "@/lib/membership";

const schema = z.object({
  name: z.string().trim().min(2).max(100), code: z.string().trim().min(2).max(50).transform(v => v.toLocaleUpperCase("tr-TR").replace(/\s+/g, "-")),
  description: z.string().trim().max(500).optional().nullable(), type: z.enum(["retail", "dealer"]),
  discountRate: z.number().min(0).max(100), active: z.boolean().optional(),
});
export async function GET(request: Request) {
  const denied = adminGuard(request); if (denied) return denied;
  try {
    const groups = await prisma.customerGroup.findMany({ include: { _count: { select: { customers: true } } }, orderBy: [{ active: "desc" }, { name: "asc" }] });
    return Response.json({ groups }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) { return membershipError(e); }
}
export async function POST(request: Request) {
  const denied = adminGuard(request); if (denied) return denied;
  try {
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return Response.json({ message: "Grup bilgilerini kontrol edin." }, { status: 400 });
    const group = await prisma.customerGroup.create({ data: parsed.data });
    return Response.json({ success: true, group }, { status: 201 });
  } catch (e) { return membershipError(e); }
}
export async function PATCH(request: Request) {
  const denied = adminGuard(request); if (denied) return denied;
  try {
    const parsed = schema.partial().extend({ id: z.string().min(1) }).safeParse(await request.json());
    if (!parsed.success) return Response.json({ message: "Grup bilgilerini kontrol edin." }, { status: 400 });
    const { id, ...data } = parsed.data;
    const group = await prisma.$transaction(async tx => {
      const existing = await tx.customerGroup.findUniqueOrThrow({ where: { id } });
      if (data.type && data.type !== existing.type && await tx.customer.count({ where: { groupId: id } })) throw new Error("GROUP_IN_USE");
      return tx.customerGroup.update({ where: { id }, data });
    }, { isolationLevel: "Serializable",maxWait:10000,timeout:20000 });
    return Response.json({ success: true, group });
  } catch (e) {
    if (e instanceof Error && e.message === "GROUP_IN_USE") return Response.json({ message: "Üyesi olan grubun tipi değiştirilemez. Önce müşterileri uygun gruba taşıyın." }, { status: 409 });
    return membershipError(e);
  }
}
