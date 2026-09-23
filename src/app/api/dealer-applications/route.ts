import { z } from "zod";
import { adminGuard } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

const updateSchema = z.object({
    id: z.string().min(1),
    status: z.enum(["pending", "approved", "rejected"]),
    reviewNote: z.string().trim().max(1000).optional().nullable(),
});

/*
 * BAYİ BAŞVURULARINI LİSTELE
 */
export async function GET(request: Request) {
    const denied = adminGuard(request);
    if (denied) return denied;

    try {
        const applications =
            await prisma.dealerApplication.findMany({
                include: {
                    customer: {
                        select: {
                            id: true,
                            fullName: true,
                            phone: true,
                            email: true,
                            type: true,
                            dealerStatus: true,
                            groupId: true,
                        },
                    },
                },
                orderBy: {
                    createdAt: "desc",
                },
                take: 500,
            });

        return Response.json(
            { applications },
            {
                headers: {
                    "Cache-Control": "no-store",
                },
            }
        );
    } catch (error) {
        console.error(
            "GET /api/dealer-applications",
            error
        );

        return Response.json(
            {
                message:
                    "Bayi başvuruları alınamadı.",
            },
            {
                status: 500,
            }
        );
    }
}

/*
 * BAYİ BAŞVURUSUNU ONAYLA / REDDET
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
                    message: "Geçersiz işlem.",
                },
                {
                    status: 400,
                }
            );
        }

        const {
            id,
            status,
            reviewNote,
        } = parsed.data;

        const result = await prisma.$transaction(
            async (tx) => {
                const application =
                    await tx.dealerApplication.findUnique({
                        where: {
                            id,
                        },
                    });

                if (!application) {
                    throw new Error(
                        "APPLICATION_NOT_FOUND"
                    );
                }

                /*
                 * Başvuru durumunu güncelle.
                 */
                const updatedApplication =
                    await tx.dealerApplication.update({
                        where: {
                            id,
                        },
                        data: {
                            status,
                            reviewNote:
                                reviewNote || null,
                            reviewedAt:
                                status === "pending"
                                    ? null
                                    : new Date(),
                            reviewedBy:
                                status === "pending"
                                    ? null
                                    : "admin",
                        },
                    });

                /*
                 * Başvuru bir müşteri kaydına bağlıysa
                 * müşteri bayi durumunu da senkron tut.
                 */
                if (application.customerId) {
                    if (status === "approved") {
                        await tx.customer.update({
                            where: {
                                id: application.customerId,
                            },
                            data: {
                                type: "dealer",
                                dealerStatus: "approved",
                            },
                        });
                    }

                    if (status === "rejected") {
                        await tx.customer.update({
                            where: {
                                id: application.customerId,
                            },
                            data: {
                                dealerStatus: "none",
                            },
                        });
                    }

                    if (status === "pending") {
                        await tx.customer.update({
                            where: {
                                id: application.customerId,
                            },
                            data: {
                                type: "dealer",
                                dealerStatus: "pending",
                            },
                        });
                    }
                }

                return updatedApplication;
            }
        );

        return Response.json({
            success: true,
            application: result,
        });
    } catch (error) {
        console.error(
            "PATCH /api/dealer-applications",
            error
        );

        if (
            error instanceof Error &&
            error.message ===
            "APPLICATION_NOT_FOUND"
        ) {
            return Response.json(
                {
                    message:
                        "Bayi başvurusu bulunamadı.",
                },
                {
                    status: 404,
                }
            );
        }

        return Response.json(
            {
                message:
                    "Bayi başvurusu güncellenemedi.",
            },
            {
                status: 500,
            }
        );
    }
}