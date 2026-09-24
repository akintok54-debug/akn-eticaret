import { adminGuard } from "@/lib/admin";
import { NextRequest, NextResponse } from "next/server";

async function fetchIdeaSoftPage(
    baseUrl: string,
    accessToken: string,
    page: number,
    limit: number
) {
    const url = new URL("/admin-api/products", baseUrl);

    url.searchParams.set("page", String(page));
    url.searchParams.set("limit", String(limit));

    const response = await fetch(url, {
        method: "GET",
        headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: "application/json",
        },
        cache: "no-store",
    });

    const text = await response.text();

    let data: unknown;

    try {
        data = JSON.parse(text);
    } catch {
        data = text;
    }

    if (!response.ok) {
        throw new Error(
            `IdeaSoft ürün API hatası (${response.status}).`
        );
    }

    if (!Array.isArray(data)) {
        throw new Error("IdeaSoft ürün API beklenen listeyi döndürmedi.");
    }

    return data;
}

export async function GET(request: NextRequest) {
    const denied = adminGuard(request); if (denied) return denied;
    try {
        const baseUrl = process.env.IDEASOFT_BASE_URL;

        if (!baseUrl) {
            return NextResponse.json(
                {
                    success: false,
                    message: "IDEASOFT_BASE_URL tanımlı değil.",
                },
                { status: 500 }
            );
        }

        const accessToken =
            request.cookies.get("ideasoft_access_token")?.value;

        if (!accessToken) {
            return NextResponse.json(
                {
                    success: false,
                    message:
                        "IdeaSoft bağlantısı bulunamadı. Önce IdeaSoft hesabını bağlayın.",
                },
                { status: 401 }
            );
        }

        const getAll =
            request.nextUrl.searchParams.get("all") === "1";

        const limit = 100;

        if (getAll) {
            const allProducts: unknown[] = [];
            let page = 1;

            while (true) {
                const products = await fetchIdeaSoftPage(
                    baseUrl,
                    accessToken,
                    page,
                    limit
                );

                allProducts.push(...products);

                if (products.length < limit) {
                    break;
                }

                page++;

                // Güvenlik: beklenmeyen sonsuz döngüyü engeller.
                if (page > 500) {
                    throw new Error(
                        "IdeaSoft ürün sayfalaması güvenlik sınırını aştı."
                    );
                }
            }

            return NextResponse.json({
                success: true,
                total: allProducts.length,
                pages: page,
                data: allProducts,
            });
        }

        const page = Math.max(
            1,
            Number(request.nextUrl.searchParams.get("page") || "1")
        );

        const requestedLimit = Math.min(
            100,
            Math.max(
                1,
                Number(request.nextUrl.searchParams.get("limit") || "100")
            )
        );

        const data = await fetchIdeaSoftPage(
            baseUrl,
            accessToken,
            page,
            requestedLimit
        );

        return NextResponse.json({
            success: true,
            page,
            limit: requestedLimit,
            data,
        });
    } catch (error) {
        console.error("IdeaSoft ürün çekme hatası:", error);

        return NextResponse.json(
            {
                success: false,
                message:
                    error instanceof Error
                        ? error.message
                        : "IdeaSoft bağlantısında beklenmeyen hata oluştu.",
            },
            { status: 500 }
        );
    }
}