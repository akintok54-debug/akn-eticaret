import { currentCustomer } from "@/lib/customer-session";
import { unitPrice } from "@/lib/pricing";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { adminGuard } from "@/lib/admin";
import { membershipError, normalizePhone } from "@/lib/membership";
import { guestSession } from "@/lib/guest-session";

const schema = z.object({
  sessionId: z.uuid(),
  customerName: z.string().trim().max(200).optional(),
  customerPhone: z.string().trim().max(30).optional(),
  customerEmail: z.string().trim().max(200).optional(),
  checkoutStarted: z.boolean().optional(), completed: z.boolean().optional(),
  orderId: z.string().max(100).optional(), orderNumber: z.string().max(100).optional(),
  items: z.array(z.object({
    id: z.string().min(1).max(100), name: z.string().min(1).max(500), price: z.number().finite().nonnegative(),
    quantity: z.number().int().min(1).max(999), image: z.string().max(2000).nullable().optional(),
  })).max(200).optional(),
});
export async function GET(request: Request) {
  const denied = adminGuard(request); if (denied) return denied;
  try {
    const now = new Date();
    const stale = { completedAt: null, itemCount: { gt: 0 }, lastActivityAt: { lte: new Date(now.getTime() - 30 * 60 * 1000) }, abandonedAt: null };
    await prisma.$transaction([
      prisma.shoppingCart.updateMany({ where: { ...stale, checkoutStarted: false }, data: { status: "Terk Edildi", abandonedAt: now } }),
      prisma.shoppingCart.updateMany({ where: { ...stale, checkoutStarted: true }, data: { status: "Ödeme Terk", abandonedAt: now } }),
    ]);
    const carts = await prisma.shoppingCart.findMany({ include: { items: true, customer: { select: { fullName: true, phone: true, email: true } }, reminders: { orderBy: { createdAt: "desc" } } }, orderBy: { lastActivityAt: "desc" }, take: 500 });
    return Response.json({ carts }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) { return membershipError(e); }
}
export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin || (origin !== new URL(request.url).origin && origin !== process.env.SITE_URL))
    return Response.json({ message: "Geçersiz istek kaynağı." }, { status: 403 });
  try {
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return Response.json({ message: "Geçersiz sepet bilgisi." }, { status: 400 });
    const data = parsed.data;
    const buyer = await currentCustomer();
    // Never trust a browser-supplied customerId or a claimed completed order.
    const guest = data.completed ? await guestSession() : null;
    const order = data.completed && (guest || buyer) && data.orderId
      ? await prisma.order.findFirst({ where: { id: data.orderId, OR: [...(guest ? [{guestSessionId:guest}] : []), ...(buyer ? [{customerId:buyer.id}] : [])] } }) : null;
    if (data.completed && !order) return Response.json({ message: "Sipariş doğrulanamadı." }, { status: 403 });
    await prisma.$transaction(async tx => {
      await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${data.sessionId}))::text`;
      const existing = await tx.shoppingCart.findUnique({ where: { sessionId: data.sessionId } });
      if (existing?.completedAt) return;
      if (!existing && !data.items?.length) return;
      const now = new Date();
      const contactPhone = data.customerPhone ? normalizePhone(data.customerPhone) : undefined;
      const customer = contactPhone ? await tx.customer.findUnique({ where: { phone: contactPhone }, select: { id: true } }) : null;
      const quantities = new Map<string, number>();
      for (const item of data.items ?? []) quantities.set(item.id, (quantities.get(item.id) ?? 0) + item.quantity);
      if ([...quantities.values()].some(quantity => quantity > 999)) throw new Error("INVALID_ITEMS");
      const products = data.items ? await tx.product.findMany({ where: { id: { in: [...quantities.keys()] } }, select: { id: true, name: true, retailPrice: true, dealerPrice: true, image: true } }) : [];
      if (data.items && products.length !== quantities.size) throw new Error("INVALID_ITEMS");
      const items = products.map(product => ({ productId: product.id, productName: product.name, price: unitPrice(product,buyer), image: product.image, quantity: quantities.get(product.id)! }));
      const count = data.items ? items.reduce((sum, item) => sum + item.quantity, 0) : existing?.itemCount ?? 0;
      const total = data.items ? items.reduce((sum, item) => sum + Math.round(item.price * 100) * item.quantity, 0) / 100 : existing?.total ?? 0;
      const values = {
        customerId: order?.customerId ?? buyer?.id ?? customer?.id ?? (contactPhone ? null : undefined),
        customerName: order?.customerName ?? (data.customerName || buyer?.fullName || undefined),
        customerPhone: order?.customerPhone ?? contactPhone ?? buyer?.phone,
        customerEmail: order?.customerEmail ?? (data.customerEmail || buyer?.email || undefined),
        checkoutStarted: !!(order || data.checkoutStarted || existing?.checkoutStarted),
        checkoutStartedAt: existing?.checkoutStartedAt ?? (data.checkoutStarted || order ? now : null),
        status: order ? "Tamamlandı" : count ? "Aktif" : "Boş",
        itemCount: count, total,
        lastActivityAt: now,
        abandonedAt: null,
        recoveredAt: existing?.abandonedAt ? now : existing?.recoveredAt,
        ...(order ? { completedAt: now, orderId: order.id, orderNumber: order.orderNumber } : {}),
      };
      if (existing) {
        await tx.shoppingCart.update({ where: { id: existing.id }, data: { ...values, ...(data.items ? { items: { deleteMany: {}, create: items } } : {}) } });
      } else {
        await tx.shoppingCart.create({ data: { sessionId: data.sessionId, ...values, items: { create: items } } });
      }
    },{maxWait:10000,timeout:20000});
    // Tracking is write-only publicly; never return customer or reminder records.
    return Response.json({ success: true }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    if (e instanceof Error && e.message === "INVALID_ITEMS") return Response.json({ message: "Sepet ürünlerini kontrol edin." }, { status: 400 });
    return membershipError(e);
  }
}

export async function PATCH(request: Request) {
  const denied = adminGuard(request); if (denied) return denied;
  try {
    const parsed = z.object({
      id: z.string().min(1), channel: z.enum(["email", "sms", "phone", "whatsapp"]),
      status: z.enum(["pending", "sent", "failed"]), recipient: z.string().trim().min(3).max(200),
      message: z.string().trim().min(1).max(2000), error: z.string().trim().max(1000).optional(),
    }).safeParse(await request.json());
    if (!parsed.success) return Response.json({ message: "Hatırlatma bilgilerini kontrol edin." }, { status: 400 });
    const { id, ...data } = parsed.data;
    const cart = await prisma.shoppingCart.update({
      where: { id }, data: {
        reminders: { create: { ...data, sentAt: data.status === "sent" ? new Date() : null } },
        ...(data.status === "sent" ? { reminderSentAt: new Date(), reminderCount: { increment: 1 } } : {}),
      }, include: { items: true, reminders: { orderBy: { createdAt: "desc" } }, customer: { select: { fullName: true, phone: true, email: true } } },
    });
    return Response.json({ success: true, cart });
  } catch (e) { return membershipError(e); }
}
