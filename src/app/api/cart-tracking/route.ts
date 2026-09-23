import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { adminGuard } from "@/lib/admin";

type CartInput = {
  sessionId?: string;

  customerId?: string | null;
  customerName?: string | null;
  customerPhone?: string | null;
  customerEmail?: string | null;

  checkoutStarted?: boolean;
  completed?: boolean;

  orderId?: string | null;
  orderNumber?: string | null;

  reminderSent?: boolean;

  items?: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
    image?: string | null;
  }>;
};

const cleanText = (value: unknown) => {
  if (typeof value !== "string") return undefined;

  const cleaned = value.trim();
  return cleaned || undefined;
};

/*
 * YÖNETİM PANELİ SEPET LİSTESİ
 *
 * Liste alınmadan önce 30 dakikadan uzun süredir
 * hareket görmeyen sepetlerin durumunu otomatik günceller.
 */
export async function GET(request: Request) {
  const denied = adminGuard(request);
  if (denied) return denied;

  try {
    const now = new Date();

    const abandonedLimit = new Date(
      now.getTime() - 30 * 60 * 1000
    );

    /*
     * Ödeme ekranına geçmeden terk edilen sepetler.
     */
    await prisma.shoppingCart.updateMany({
      where: {
        completedAt: null,
        checkoutStarted: false,
        itemCount: {
          gt: 0,
        },
        lastActivityAt: {
          lte: abandonedLimit,
        },
        abandonedAt: null,
      },
      data: {
        status: "Terk Edildi",
        abandonedAt: now,
      },
    });

    /*
     * Ödeme ekranına ulaşmış fakat sipariş vermeden
     * 30 dakika boyunca hareket görmemiş sepetler.
     */
    await prisma.shoppingCart.updateMany({
      where: {
        completedAt: null,
        checkoutStarted: true,
        itemCount: {
          gt: 0,
        },
        lastActivityAt: {
          lte: abandonedLimit,
        },
        abandonedAt: null,
      },
      data: {
        status: "Ödeme Terk",
        abandonedAt: now,
      },
    });

    const carts = await prisma.shoppingCart.findMany({
      include: {
        items: true,
        customer: true,
        reminders: true,
      },
      orderBy: {
        lastActivityAt: "desc",
      },
      take: 500,
    });

    return Response.json(
      { carts },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error("GET /api/cart-tracking", error);

    return Response.json(
      { message: "Sepetler alınamadı." },
      { status: 500 }
    );
  }
}

/*
 * SEPET HAREKETLERİ
 *
 * Sepete ürün ekleme,
 * ödeme ekranına geçme,
 * müşteri bilgileri,
 * geri kazanılma,
 * siparişe dönüşme
 * işlemlerini kaydeder.
 */
export async function POST(request: Request) {
  try {
    const data = (await request.json()) as CartInput;

    if (!data.sessionId?.trim()) {
      return Response.json(
        { message: "sessionId zorunlu." },
        { status: 400 }
      );
    }

    const sessionId = data.sessionId.trim();
    const now = new Date();

    /*
     * items gönderilmemişse mevcut ürünlere dokunmuyoruz.
     *
     * Böylece ödeme ve sipariş durumları güncellenirken
     * eski sepet ürünleri silinmez.
     */
    const hasItems = Array.isArray(data.items);

    const items = hasItems
      ? data.items!.filter(
        (item) =>
          item &&
          typeof item.id === "string" &&
          item.id.trim().length > 0 &&
          typeof item.name === "string" &&
          item.name.trim().length > 0 &&
          Number.isFinite(item.price) &&
          item.price >= 0 &&
          Number.isInteger(item.quantity) &&
          item.quantity > 0 &&
          item.quantity <= 999
      )
      : [];

    const itemCount = items.reduce(
      (sum, item) => sum + item.quantity,
      0
    );

    const total = items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    /*
     * Mevcut sepet durumunu öğreniyoruz.
     */
    const existing = await prisma.shoppingCart.findUnique({
      where: {
        sessionId,
      },
      select: {
        id: true,
        status: true,
        checkoutStarted: true,
        checkoutStartedAt: true,
        abandonedAt: true,
        recoveredAt: true,
        completedAt: true,
        orderId: true,
        orderNumber: true,
        reminderCount: true,
      },
    });

    const customerId = cleanText(data.customerId);
    const customerName = cleanText(data.customerName);
    const customerPhone = cleanText(data.customerPhone);
    const customerEmail = cleanText(data.customerEmail);

    const orderId = cleanText(data.orderId);
    const orderNumber = cleanText(data.orderNumber);

    const completed = data.completed === true;

    /*
     * Daha önce terk edilmiş bir sepet tekrar hareket görürse
     * geri kazanılmış kabul edilir.
     */
    const recovered =
      Boolean(existing?.abandonedAt) &&
      !existing?.completedAt &&
      !completed;

    let status: string | undefined;

    if (completed) {
      status = "Tamamlandı";
    } else if (recovered) {
      status = "Aktif";
    } else if (hasItems) {
      status = itemCount > 0 ? "Aktif" : "Boş";
    }

    const updateData: Prisma.ShoppingCartUpdateInput = {
      lastActivityAt: now,
    };

    /*
     * Müşteri bağlantısı
     */
    if (customerId !== undefined) {
      updateData.customer = customerId
        ? {
          connect: {
            id: customerId,
          },
        }
        : {
          disconnect: true,
        };
    }

    /*
     * Müşteri iletişim bilgileri
     */
    if (customerName !== undefined) {
      updateData.customerName = customerName;
    }

    if (customerPhone !== undefined) {
      updateData.customerPhone = customerPhone;
    }

    if (customerEmail !== undefined) {
      updateData.customerEmail = customerEmail;
    }

    /*
     * Genel durum
     */
    if (status !== undefined) {
      updateData.status = status;
    }

    /*
     * Ödeme ekranına geçiş
     */
    if (data.checkoutStarted !== undefined) {
      updateData.checkoutStarted =
        Boolean(data.checkoutStarted);

      if (
        data.checkoutStarted === true &&
        !existing?.checkoutStartedAt
      ) {
        updateData.checkoutStartedAt = now;
      }
    }

    /*
     * Terk edilmiş sepet geri döndü.
     */
    if (recovered) {
      updateData.recoveredAt = now;
      updateData.abandonedAt = null;
    }

    /*
     * Sepet gerçek siparişe dönüştü.
     */
    if (completed) {
      updateData.status = "Tamamlandı";
      updateData.completedAt = now;
      updateData.abandonedAt = null;
    }

    /*
     * Oluşan sipariş bağlantısı
     */
    if (orderId !== undefined) {
      updateData.orderId = orderId;
    }

    if (orderNumber !== undefined) {
      updateData.orderNumber = orderNumber;
    }

    /*
     * Sepet hatırlatma kaydı
     */
    if (data.reminderSent === true) {
      updateData.reminderSentAt = now;

      updateData.reminderCount = {
        increment: 1,
      };
    }

    /*
     * Yeni ürün listesi gönderilmişse
     * sepet içeriğini yenile.
     */
    if (hasItems) {
      updateData.itemCount = itemCount;
      updateData.total = total;

      updateData.items = {
        deleteMany: {},

        create: items.map((item) => ({
          productId: item.id.trim(),
          productName: item.name.trim(),
          image: item.image || null,
          price: item.price,
          quantity: item.quantity,
        })),
      };
    }

    /*
     * Sepet ilk defa oluşturuluyorsa kullanılacak kayıt.
     */
    const createData: Prisma.ShoppingCartCreateInput = {
      sessionId,

      customer: customerId
        ? {
          connect: {
            id: customerId,
          },
        }
        : undefined,

      customerName: customerName ?? null,
      customerPhone: customerPhone ?? null,
      customerEmail: customerEmail ?? null,

      status:
        completed
          ? "Tamamlandı"
          : itemCount > 0
            ? "Aktif"
            : "Boş",

      checkoutStarted:
        Boolean(data.checkoutStarted),

      checkoutStartedAt:
        data.checkoutStarted === true
          ? now
          : null,

      itemCount,
      total,

      completedAt:
        completed
          ? now
          : null,

      orderId:
        orderId ?? null,

      orderNumber:
        orderNumber ?? null,

      reminderSentAt:
        data.reminderSent === true
          ? now
          : null,

      reminderCount:
        data.reminderSent === true
          ? 1
          : 0,

      lastActivityAt: now,

      items: {
        create: items.map((item) => ({
          productId: item.id.trim(),
          productName: item.name.trim(),
          image: item.image || null,
          price: item.price,
          quantity: item.quantity,
        })),
      },
    };

    let cart;

    try {
      cart = await prisma.shoppingCart.upsert({
        where: {
          sessionId,
        },

        create: createData,

        update: updateData,

        include: {
          items: true,
          customer: true,
          reminders: true,
        },
      });
    } catch (error) {
      /*
       * Aynı tarayıcıdan aynı anda iki ilk kayıt gelirse
       * unique sessionId yarışını güvenli biçimde çözer.
       */
      if (
        error instanceof
        Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        cart = await prisma.shoppingCart.update({
          where: {
            sessionId,
          },

          data: updateData,

          include: {
            items: true,
            customer: true,
            reminders: true,
          },
        });
      } else {
        throw error;
      }
    }

    return Response.json({ cart });
  } catch (error) {
    console.error(
      "POST /api/cart-tracking",
      error
    );

    return Response.json(
      {
        message: "Sepet kaydedilemedi.",
      },
      {
        status: 500,
      }
    );
  }
}