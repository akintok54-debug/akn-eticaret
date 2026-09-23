import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { adminGuard } from "@/lib/admin";

const attributeSchema = z.object({
    productId: z.string().min(1),
    name: z.string().trim().min(1, "Özellik adı zorunlu"),
    value: z.string().trim().min(1, "Özellik değeri zorunlu"),
    unit: z.string().trim().nullable().optional(),
    note: z.string().trim().nullable().optional(),
});

export async function GET(request: Request) {
    const denied = adminGuard(request);
    if (denied) return denied;

    try {
        const { searchParams } = new URL(request.url);
        const productId = searchParams.get("productId");

        if (!productId) {
            return NextResponse.json(
                { success: false, message: "productId zorunlu." },
                { status: 400 }
            );
        }

        const attributes = await prisma.productAttribute.findMany({
            where: { productId },
            orderBy: [{ name: "asc" }, { value: "asc" }],
        });

        return NextResponse.json({
            success: true,
            attributes,
        });
    } catch (error) {
        console.error("GET /api/product-attributes:", error);

        return NextResponse.json(
            { success: false, message: "Ek özellikler alınamadı." },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    const denied = adminGuard(request);
    if (denied) return denied;

    try {
        const body = await request.json();
        const parsed = attributeSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Özellik bilgileri geçersiz.",
                    errors: parsed.error.flatten(),
                },
                { status: 400 }
            );
        }

        const { productId, name, value, unit, note } = parsed.data;

        const product = await prisma.product.findUnique({
            where: { id: productId },
            select: { id: true },
        });

        if (!product) {
            return NextResponse.json(
                { success: false, message: "Ürün bulunamadı." },
                { status: 404 }
            );
        }

        const attribute = await prisma.productAttribute.create({
            data: {
                productId,
                name,
                value,
                unit: unit || null,
                note: note || null,
            },
        });

        return NextResponse.json(
            {
                success: true,
                attribute,
            },
            { status: 201 }
        );
    } catch (error) {
        console.error("POST /api/product-attributes:", error);

        return NextResponse.json(
            {
                success: false,
                message:
                    "Özellik kaydedilemedi. Aynı özellik daha önce eklenmiş olabilir.",
            },
            { status: 500 }
        );
    }
}

export async function DELETE(request: Request) {
    const denied = adminGuard(request);
    if (denied) return denied;

    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json(
                { success: false, message: "Kayıt ID zorunlu." },
                { status: 400 }
            );
        }

        await prisma.productAttribute.delete({
            where: { id },
        });

        return NextResponse.json({
            success: true,
            message: "Özellik silindi.",
        });
    } catch (error) {
        console.error("DELETE /api/product-attributes:", error);

        return NextResponse.json(
            { success: false, message: "Özellik silinemedi." },
            { status: 500 }
        );
    }
}