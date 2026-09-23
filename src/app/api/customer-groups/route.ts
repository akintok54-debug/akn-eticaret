import { z } from "zod";
import { adminGuard } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

const createSchema = z.object({
    name: z.string().trim().min(2).max(100),
    code: z.string().trim().min(2).max(50),
    description: z.string().trim().max(500).optional().nullable(),
    type: z.enum(["retail", "dealer"]),
    discountRate: z.number().min(0).max(100),
});

const updateSchema = createSchema.partial().extend({
    id: z.string().min(1),
    active: z.boolean().optional(),
});

/*
 * ÜYE / BAYİ GRUPLARINI LİSTELE
 */
export async function GET(request: Request) {
    const denied = adminGuard(request);
    if (denied) return denied;

    try {
        const groups = await prisma.customerGroup.findMany({
            include: {
                _count: {
                    select: {
                        customers: true,
                    },
                },
            },
            orderBy: [
                {
                    active: "desc",
                },
                {
                    name: "asc",
                },
            ],
        });

        return Response.json(
            { groups },
            {
                headers: {
                    "Cache-Control": "no-store",
                },
            }
        );
    } catch (error) {
        console.error("GET /api/customer-groups", error);

        return Response.json(
            {
                message: "Üye grupları alınamadı.",
            },
            {
                status: 500,
            }
        );
    }
}

/*
 * YENİ GRUP OLUŞTUR
 */
export async function POST(request: Request) {
    const denied = adminGuard(request);
    if (denied) return denied;

    try {
        const parsed = createSchema.safeParse(
            await request.json()
        );

        if (!parsed.success) {
            return Response.json(
                {
                    message: "Grup bilgilerini kontrol edin.",
                },
                {
                    status: 400,
                }
            );
        }

        const code = parsed.data.code
            .trim()
            .toUpperCase()
            .replace(/\s+/g, "-");

        const existing = await prisma.customerGroup.findFirst({
            where: {
                OR: [
                    {
                        name: parsed.data.name,
                    },
                    {
                        code,
                    },
                ],
            },
            select: {
                id: true,
            },
        });

        if (existing) {
            return Response.json(
                {
                    message:
                        "Aynı isim veya kod ile bir grup zaten bulunuyor.",
                },
                {
                    status: 409,
                }
            );
        }

        const group = await prisma.customerGroup.create({
            data: {
                name: parsed.data.name,
                code,
                description:
                    parsed.data.description || null,
                type: parsed.data.type,
                discountRate:
                    parsed.data.discountRate,
            },
        });

        return Response.json({
            success: true,
            group,
        });
    } catch (error) {
        console.error("POST /api/customer-groups", error);

        return Response.json(
            {
                message: "Üye grubu oluşturulamadı.",
            },
            {
                status: 500,
            }
        );
    }
}

/*
 * GRUBU GÜNCELLE
 */
export async function PATCH(request: Request) {
    const denied = adminGuard(request);
    if (denied) return denied;

    try {
        const parsed = updateSchema.safeParse(
            await request.json()
        );

        if (!parsed.success) {
            return Response.json(
                {
                    message: "Geçersiz grup bilgisi.",
                },
                {
                    status: 400,
                }
            );
        }

        const { id, ...values } = parsed.data;

        const data = {
            ...(values.name !== undefined
                ? {
                    name: values.name,
                }
                : {}),

            ...(values.code !== undefined
                ? {
                    code: values.code
                        .trim()
                        .toUpperCase()
                        .replace(/\s+/g, "-"),
                }
                : {}),

            ...(values.description !== undefined
                ? {
                    description:
                        values.description || null,
                }
                : {}),

            ...(values.type !== undefined
                ? {
                    type: values.type,
                }
                : {}),

            ...(values.discountRate !== undefined
                ? {
                    discountRate:
                        values.discountRate,
                }
                : {}),

            ...(values.active !== undefined
                ? {
                    active: values.active,
                }
                : {}),
        };

        const group = await prisma.customerGroup.update({
            where: {
                id,
            },
            data,
        });

        return Response.json({
            success: true,
            group,
        });
    } catch (error) {
        console.error("PATCH /api/customer-groups", error);

        return Response.json(
            {
                message: "Üye grubu güncellenemedi.",
            },
            {
                status: 500,
            }
        );
    }
}