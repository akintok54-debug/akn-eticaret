import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const updateSchema = z.object({
  erpProductId: z.string().trim().min(1).nullable().optional(),
  sku: z.string().trim().min(1).optional(),
  barcode: z.string().trim().min(1).nullable().optional(),
  name: z.string().trim().min(1).optional(),
  brand: z.string().trim().min(1).optional(),
  category: z.string().trim().min(1).optional(),
  description: z.string().optional(),
  purchasePrice: z.number().min(0).optional(),
  retailPrice: z.number().min(0).optional(),
  dealerPrice: z.number().min(0).optional(),
  vatRate: z.number().min(0).max(100).optional(),
  stock: z.number().int().min(0).optional(),
  criticalStock: z.number().int().min(0).optional(),
  image: z.string().trim().nullable().optional(),
  active: z.boolean().optional(),
});

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(
  _request: Request,
  context: RouteContext
) {
  try {
    const { id } = await context.params;

    const product = await prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      return NextResponse.json(
        {
          success: false,
          message: "Ürün bulunamadı.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      product,
    });
  } catch (error) {
    console.error("GET /api/products/[id]:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Ürün alınamadı.",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    const body = await request.json();

    const parsed = updateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Ürün bilgileri geçersiz.",
          errors: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const existing = await prisma.product.findUnique({
      where: { id },
      select: { id: true },
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

    const product = await prisma.product.update({
      where: { id },
      data: parsed.data,
    });

    return NextResponse.json({
      success: true,
      product,
    });
  } catch (error) {
    console.error("PATCH /api/products/[id]:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Ürün güncellenemedi. SKU veya barkod çakışıyor olabilir.",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  context: RouteContext
) {
  try {
    const { id } = await context.params;

    const existing = await prisma.product.findUnique({
      where: { id },
      select: { id: true },
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

    await prisma.product.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Ürün silindi.",
    });
  } catch (error) {
    console.error("DELETE /api/products/[id]:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Ürün silinemedi.",
      },
      { status: 500 }
    );
  }
}