import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { adminGuard } from "@/lib/admin";

const variantSchema = z.object({
    productId: z.string().trim().min(1, "Ürün seçimi zorunlu"),
    erpVariantId: z.string().trim().min(1).nullable().optional(),
    sku: z.string().trim().min(1, "SKU zorunlu"),
    barcode: z.string().trim().min(1).nullable().optional(),
    name: z.string().trim().nullable().optional(),
    color: z.string().trim().nullable().optional(),
    size: z.string().trim().nullable().optional(),
    purchasePrice: z.number().min(0).nullable().optional(),
    retailPrice: z.number().min(0).nullable().optional(),
    dealerPrice: z.number().min(0).nullable().optional(),
    stock: z.number().int().min(0).default(0),
    image: z.string().trim().nullable().optional(),
    active: z.boolean().default(true),
});

const updateSchema = variantSchema.partial().extend({
    id: z.string().trim().min(1),
});

export async function GET(request: Request) {
    const denied = adminGuard(request);
    if (denied) return denied;

    try {
        const url = new URL(request.url);
        const productId = url.searchParams.get("productId");

        const variants = await prisma.productVariant.findMany({
            where: productId ? { productId } : {},
            include: {
                product: {
                    select: {
                        id: true,
                        name: true,
                        sku: true,
                        image: true,
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        return NextResponse.json({
            success: true,
            count: variants.length,
            variants,
        });
    } catch (error) {
        console.error("GET /api/variants:", error);

        return NextResponse.json(
            {
                success: false,
                message: "Varyantlar alınamadı.",
            },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    const denied = adminGuard(request);
    if (denied) return denied;

    try {
        const body = await request.json();
        const parsed = variantSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Varyant bilgileri geçersiz.",
                    errors: parsed.error.flatten(),
                },
                { status: 400 }
            );
        }

        const product = await prisma.product.findUnique({
            where: { id: parsed.data.productId },
            select: { id: true },
        });

        if (!product) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Seçilen ürün bulunamadı.",
                },
                { status: 404 }
            );
        }

        const variant = await prisma.productVariant.create({
            data: parsed.data,
        });

        return NextResponse.json(
            {
                success: true,
                variant,
            },
            { status: 201 }
        );
    } catch (error) {
        console.error("POST /api/variants:", error);

        return NextResponse.json(
            {
                success: false,
                message:
                    "Varyant kaydedilemedi. SKU veya barkod daha önce kullanılmış olabilir.",
            },
            { status: 500 }
        );
    }
}

export async function PATCH(request: Request) {
    const denied = adminGuard(request);
    if (denied) return denied;

    try {
        const body = await request.json();
        const parsed = updateSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Varyant bilgileri geçersiz.",
                    errors: parsed.error.flatten(),
                },
                { status: 400 }
            );
        }

        const { id, ...data } = parsed.data;

        const variant = await prisma.productVariant.update({
            where: { id },
            data,
        });

        return NextResponse.json({
            success: true,
            variant,
        });
    } catch (error) {
        console.error("PATCH /api/variants:", error);

        return NextResponse.json(
            {
                success: false,
                message:
                    "Varyant güncellenemedi. SKU veya barkod başka bir varyantta kullanılıyor olabilir.",
            },
            { status: 500 }
        );
    }
}

export async function DELETE(request: Request) {
    const denied = adminGuard(request);
    if (denied) return denied;

    try {
        const url = new URL(request.url);
        const id = url.searchParams.get("id");

        if (!id) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Varyant ID zorunlu.",
                },
                { status: 400 }
            );
        }

        await prisma.productVariant.delete({
            where: { id },
        });

        return NextResponse.json({
            success: true,
            message: "Varyant silindi.",
        });
    } catch (error) {
        console.error("DELETE /api/variants:", error);

        return NextResponse.json(
            {
                success: false,
                message: "Varyant silinemedi.",
            },
            { status: 500 }
        );
    }
}