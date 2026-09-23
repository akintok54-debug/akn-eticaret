import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type IdeaSoftProduct = {
    id: number;
    name?: string;
    fullName?: string;
    sku?: string;
    barcode?: string | null;
    stockAmount?: number;
    price1?: number;
    buyingPrice?: number;
    tax?: number;
    status?: number;
    brand?: {
        name?: string;
    } | null;
    categories?: Array<{
        name?: string;
    }>;
    images?: Array<{
        originalUrl?: string;
        thumbUrl?: string;
    }>;
};

function normalizeImage(url?: string) {
    if (!url) return null;
    return url.startsWith("//") ? `https:${url}` : url;
}

async function fetchPage(
    baseUrl: string,
    accessToken: string,
    page: number
): Promise<IdeaSoftProduct[]> {
    const url = new URL("/admin-api/products", baseUrl);

    url.searchParams.set("page", String(page));
    url.searchParams.set("limit", "100");

    const response = await fetch(url, {
        headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: "application/json",
        },
        cache: "no-store",
    });

    if (!response.ok) {
        throw new Error(
            `IdeaSoft ürünleri alınamadı. HTTP ${response.status}`
        );
    }

    const data = await response.json();

    if (!Array.isArray(data)) {
        throw new Error("IdeaSoft beklenen ürün listesini döndürmedi.");
    }

    return data;
}

export async function POST(request: NextRequest) {
    try {
        const baseUrl = process.env.IDEASOFT_BASE_URL;
        const accessToken =
            request.cookies.get("ideasoft_access_token")?.value;

        if (!baseUrl) {
            return NextResponse.json(
                {
                    success: false,
                    message: "IDEASOFT_BASE_URL tanımlı değil.",
                },
                { status: 500 }
            );
        }

        if (!accessToken) {
            return NextResponse.json(
                {
                    success: false,
                    message: "IdeaSoft bağlantısı bulunamadı.",
                },
                { status: 401 }
            );
        }

        let page = 1;
        let added = 0;
        let updated = 0;
        let skipped = 0;
        let total = 0;

        while (true) {
            const products = await fetchPage(
                baseUrl,
                accessToken,
                page
            );

            if (products.length === 0) break;

            for (const product of products) {
                const sku = product.sku?.trim();

                if (!sku) {
                    skipped++;
                    continue;
                }

                total++;

                const barcode = product.barcode?.trim() || null;

                const image = normalizeImage(
                    product.images?.[0]?.originalUrl ||
                    product.images?.[0]?.thumbUrl
                );

                const retailPrice = Math.max(
                    0,
                    Number(product.price1 || 0)
                );

                const purchasePrice = Math.max(
                    0,
                    Number(product.buyingPrice || 0)
                );

                const stock = Math.max(
                    0,
                    Math.trunc(Number(product.stockAmount || 0))
                );

                const data = {
                    erpProductId: String(product.id),
                    sku,
                    barcode,
                    name:
                        product.name?.trim() ||
                        product.fullName?.trim() ||
                        sku,
                    brand: product.brand?.name?.trim() || "Markasız",
                    category:
                        product.categories?.[0]?.name?.trim() ||
                        "Kategorisiz",
                    description: "",
                    purchasePrice,
                    retailPrice,
                    dealerPrice: retailPrice,
                    vatRate: Math.max(
                        0,
                        Math.min(100, Number(product.tax || 0))
                    ),
                    stock,
                    criticalStock: 0,
                    image,
                    active: product.status === 1,
                    lastErpSyncAt: new Date(),
                };

                const existing = await prisma.product.findUnique({
                    where: { sku },
                    select: { id: true },
                });

                if (existing) {
                    await prisma.product.update({
                        where: { id: existing.id },
                        data,
                    });

                    updated++;
                } else {
                    await prisma.product.create({
                        data,
                    });

                    added++;
                }
            }

            if (products.length < 100) break;

            page++;

            if (page > 500) {
                throw new Error(
                    "IdeaSoft sayfalama güvenlik sınırını aştı."
                );
            }
        }

        return NextResponse.json({
            success: true,
            total,
            added,
            updated,
            skipped,
            pages: page,
            message: `${added} ürün eklendi, ${updated} ürün güncellendi.`,
        });
    } catch (error) {
        console.error("IdeaSoft ürün aktarım hatası:", error);

        return NextResponse.json(
            {
                success: false,
                message:
                    error instanceof Error
                        ? error.message
                        : "IdeaSoft ürün aktarımı başarısız oldu.",
            },
            { status: 500 }
        );
    }
}