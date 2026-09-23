import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { adminGuard } from "@/lib/admin";

const compatibilitySchema = z.object({
    productId: z.string().min(1),
    make: z.string().trim().min(1, "Motosiklet markası zorunlu"),
    model: z.string().trim().min(1, "Model zorunlu"),
    yearFrom: z.number().int().min(1900).max(2100).nullable().optional(),
    yearTo: z.number().int().min(1900).max(2100).nullable().optional(),
    engine: z.string().trim().nullable().optional(),
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
                {
                    success: false,
                    message: "productId zorunlu.",
                },
                { status: 400 }
            );
        }

        const compatibilities =
            await prisma.productCompatibility.findMany({
                where: {
                    productId,
                },
                orderBy: [
                    { make: "asc" },
                    { model: "asc" },
                    { yearFrom: "asc" },
                ],
            });

        return NextResponse.json({
            success: true,
            compatibilities,
        });
    } catch (error) {
        console.error("GET /api/product-compatibilities:", error);

        return NextResponse.json(
            {
                success: false,
                message: "Uyumluluk bilgileri alınamadı.",
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
        const parsed = compatibilitySchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Uyumluluk bilgileri geçersiz.",
                    errors: parsed.error.flatten(),
                },
                { status: 400 }
            );
        }

        const {
            productId,
            make,
            model,
            yearFrom,
            yearTo,
            engine,
            note,
        } = parsed.data;

        if (
            yearFrom != null &&
            yearTo != null &&
            yearFrom > yearTo
        ) {
            return NextResponse.json(
                {
                    success: false,
                    message:
                        "Başlangıç yılı bitiş yılından büyük olamaz.",
                },
                { status: 400 }
            );
        }

        const product = await prisma.product.findUnique({
            where: {
                id: productId,
            },
            select: {
                id: true,
            },
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

        const compatibility =
            await prisma.productCompatibility.create({
                data: {
                    productId,
                    make,
                    model,
                    yearFrom: yearFrom ?? null,
                    yearTo: yearTo ?? null,
                    engine: engine || null,
                    note: note || null,
                },
            });

        return NextResponse.json(
            {
                success: true,
                compatibility,
            },
            { status: 201 }
        );
    } catch (error) {
        console.error("POST /api/product-compatibilities:", error);

        return NextResponse.json(
            {
                success: false,
                message:
                    "Uyumluluk kaydedilemedi. Aynı kayıt daha önce eklenmiş olabilir.",
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
                {
                    success: false,
                    message: "Kayıt ID zorunlu.",
                },
                { status: 400 }
            );
        }

        await prisma.productCompatibility.delete({
            where: {
                id,
            },
        });

        return NextResponse.json({
            success: true,
            message: "Uyumluluk kaydı silindi.",
        });
    } catch (error) {
        console.error("DELETE /api/product-compatibilities:", error);

        return NextResponse.json(
            {
                success: false,
                message: "Uyumluluk kaydı silinemedi.",
            },
            { status: 500 }
        );
    }
}