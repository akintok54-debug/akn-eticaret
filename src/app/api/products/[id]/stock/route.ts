import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const stockSchema = z.object({
  amount: z.number().int(),
});

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(
  request: Request,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    const body = await request.json();

    const parsed = stockSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Stok miktarı geçersiz.",
        },
        { status: 400 }
      );
    }

    const existing = await prisma.product.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          message: "Ürün bulunamadı.",
        },
        { status: 404 }
      );
    }

    const newStock = existing.stock + parsed.data.amount;

    if (newStock < 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Stok sıfırın altına düşemez.",
          currentStock: existing.stock,
        },
        { status: 409 }
      );
    }

    const product = await prisma.product.update({
      where: { id },
      data: {
        stock: newStock,
      },
    });

    return NextResponse.json({
      success: true,
      previousStock: existing.stock,
      newStock: product.stock,
      product,
    });
  } catch (error) {
    console.error("PATCH /api/products/[id]/stock:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Stok güncellenemedi.",
      },
      { status: 500 }
    );
  }
}