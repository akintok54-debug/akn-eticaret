import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { adminGuard } from "@/lib/admin";

type CartInput = {
  sessionId?: string;
  customerName?: string | null;
  customerPhone?: string | null;
  customerEmail?: string | null;
  checkoutStarted?: boolean;
  items?: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
    image?: string | null;
  }>;
};

export async function GET(request: Request) {
  const denied = adminGuard(request);
  if (denied) return denied;

  try {
    const carts = await prisma.shoppingCart.findMany({
      include: {
        items: true,
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

    const items = Array.isArray(data.items)
      ? data.items.filter(
        (item) =>
          item &&
          typeof item.id === "string" &&
          typeof item.name === "string" &&
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

    const status = itemCount > 0 ? "Aktif" : "Boş";
    const now = new Date();

    const updateData = {
      customerName: data.customerName || undefined,
      customerPhone: data.customerPhone || undefined,
      customerEmail: data.customerEmail || undefined,
      checkoutStarted:
        data.checkoutStarted === undefined
          ? undefined
          : Boolean(data.checkoutStarted),
      status,
      itemCount,
      total,
      lastActivityAt: now,
      items: {
        deleteMany: {},
        create: items.map((item) => ({
          productId: item.id,
          productName: item.name,
          image: item.image || null,
          price: item.price,
          quantity: item.quantity,
        })),
      },
    };

    const createData = {
      sessionId,
      customerName: data.customerName || null,
      customerPhone: data.customerPhone || null,
      customerEmail: data.customerEmail || null,
      checkoutStarted: Boolean(data.checkoutStarted),
      status,
      itemCount,
      total,
      lastActivityAt: now,
      items: {
        create: items.map((item) => ({
          productId: item.id,
          productName: item.name,
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
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        cart = await prisma.shoppingCart.update({
          where: {
            sessionId,
          },
          data: updateData,
          include: {
            items: true,
          },
        });
      } else {
        throw error;
      }
    }

    return Response.json({ cart });
  } catch (error) {
    console.error("POST /api/cart-tracking", error);

    return Response.json(
      { message: "Sepet kaydedilemedi." },
      { status: 500 }
    );
  }
}