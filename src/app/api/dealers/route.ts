import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { normalizePhone, membershipError } from "@/lib/membership";

const text = z.string().trim().min(2).max(200);
const schema = z.object({
  fullName: text, phone: z.string().regex(/^\+?[0-9 ()-]{10,20}$/).transform(normalizePhone).refine(value => /^\d{10,15}$/.test(value)),
  email: z.email().max(200), companyName: text, taxOffice: text,
  taxNumber: z.string().regex(/^\d{10,11}$/), city: text, district: text,
  address: z.string().trim().min(10).max(1000),
});

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin || (origin !== new URL(request.url).origin && origin !== process.env.SITE_URL))
    return Response.json({ message: "Geçersiz istek." }, { status: 403 });
  try {
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return Response.json({ message: "Lütfen başvuru bilgilerinizi kontrol edin." }, { status: 400 });
    const data = parsed.data;
    await prisma.$transaction(async tx => {
      // Public submissions never overwrite an existing customer's identity or status.
      // A transaction-level phone lock prevents duplicate concurrent applications.
      await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${data.phone}))::text`;
      const customer = await tx.customer.findUnique({ where: { phone: data.phone } });
      const previous = await tx.dealerApplication.findFirst({
        where: { OR: [{ phone: data.phone }, ...(customer ? [{ customerId: customer.id }] : [])], status: { in: ["pending", "approved"] } },
      });
      if (previous || customer?.dealerStatus === "approved") return;
      await tx.dealerApplication.create({ data: { ...data, customerId: customer?.id, status: "pending" } });
    });
    // Do not disclose whether the phone already belongs to a customer.
    return Response.json({ success: true, message: "Bayi başvurunuz alındı. İnceleme sonucunda sizinle iletişime geçilecektir." });
  } catch (error) { return membershipError(error); }
}
