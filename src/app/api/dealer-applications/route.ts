import { z } from "zod";
import { adminGuard } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { membershipError, normalizePhone } from "@/lib/membership";

const schema = z.object({ id: z.string().min(1), status: z.enum(["pending", "approved", "rejected"]), reviewNote: z.string().trim().max(1000).optional().nullable() });
export async function GET(request: Request) {
  const denied = adminGuard(request); if (denied) return denied;
  try {
    const applications = await prisma.dealerApplication.findMany({ include: { customer: { select: { id: true, fullName: true, type: true, dealerStatus: true, active: true } } }, orderBy: { createdAt: "desc" } });
    return Response.json({ applications }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return membershipError(error); }
}
export async function PATCH(request: Request) {
  const denied = adminGuard(request); if (denied) return denied;
  try {
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return Response.json({ message: "Geçersiz başvuru işlemi." }, { status: 400 });
    const { id, status, reviewNote } = parsed.data;
    const application = await prisma.$transaction(async tx => {
      const existing = await tx.dealerApplication.findUniqueOrThrow({ where: { id } });
      const phone = normalizePhone(existing.phone);
      await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${phone}))::text`;
      // Re-read after the lock so a simultaneous review cannot use stale status.
      const current = await tx.dealerApplication.findUniqueOrThrow({ where: { id } });
      let customer = current.customerId
        ? await tx.customer.findUnique({ where: { id: current.customerId }, include: { group: true } })
        : await tx.customer.findUnique({ where: { phone }, include: { group: true } });
      if (status === "approved") {
        if (customer) {
          customer = await tx.customer.update({
            where: { id: customer.id },
            data: { type: "dealer", dealerStatus: "approved", ...(customer.group && customer.group.type !== "dealer" ? { groupId: null } : {}) },
            include: { group: true },
          });
        } else {
          customer = await tx.customer.create({
            data: {
              fullName: current.fullName, phone, email: current.email, companyName: current.companyName,
              taxOffice: current.taxOffice, taxNumber: current.taxNumber, type: "dealer", dealerStatus: "approved",
              addresses: current.address ? { create: { fullName: current.fullName, phone, city: current.city ?? "", district: current.district ?? "", address: current.address, isDefault: true } } : undefined,
            }, include: { group: true },
          });
        }
      } else if (customer) {
        const otherApproval = await tx.dealerApplication.count({ where: { customerId: customer.id, status: "approved", id: { not: id } } });
        // Reviewing a new application must not revoke a previously approved dealer.
        if (!otherApproval && (current.status === "approved" || customer.dealerStatus !== "approved")) {
          await tx.customer.update({ where: { id: customer.id }, data: { dealerStatus: status === "pending" ? "pending" : "none" } });
        }
      }
      return tx.dealerApplication.update({ where: { id }, data: { status, customerId: customer?.id ?? current.customerId, reviewNote: reviewNote ?? current.reviewNote, reviewedAt: status === "pending" ? null : new Date(), reviewedBy: status === "pending" ? null : "admin" } });
    });
    return Response.json({ success: true, application });
  } catch (error) { return membershipError(error); }
}
