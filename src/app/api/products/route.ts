import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const productSchema = z.object({
  erpProductId: z.string().trim().min(1).nullable().optional(),
  sku: z.string().trim().min(1, "Stok kodu zorunlu"),
  barcode: z.string().trim().min(1).nullable().optional(),
  name: z.string().trim().min(1, "Ürün adı zorunlu"),
  brand: z.string().trim().min(1, "Marka zorunlu"),
  category: z.string().trim().min(1, "Kategori zorunlu"),
  description: z.string().default(""),
  purchasePrice: z.number().min(0).default(0),
  retailPrice: z.number().min(0),
  dealerPrice: z.number().min(0),
  vatRate: z.number().min(0).max(100).default(20),
  stock: z.number().int().min(0).default(0),
  criticalStock: z.number().int().min(0).default(0),
  image: z.string().trim().nullable().optional(),
  active: z.boolean().default(true),
});

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      count: products.length,
      products,
    });
  } catch (error) {
    console.error("GET /api/products:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Ürünler alınamadı.",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = productSchema.safeParse(body);

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

    const product = await prisma.product.create({
      data: parsed.data,
    });

    return NextResponse.json(
      {
        success: true,
        product,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/products:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Ürün kaydedilemedi. SKU veya barkod daha önce kullanılmış olabilir.",
      },
      { status: 500 }
    );
  }
}