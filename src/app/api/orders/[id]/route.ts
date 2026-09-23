import { z } from "zod";
import { adminGuard } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { orderView } from "@/lib/order-view";

const schema = z.object({
    status: z.enum([
        "Taslak",
        "Yeni",
        "Hazırlanıyor",
        "Kargoda",
        "Tamamlandı",
        "İptal",
        "İade",
    ]),
    returnReason: z.string().trim().optional(),
    returnNote: z.string().trim().optional(),
});

export async function PATCH(
    request: Request,
    context: { params: Promise<{ id: string }> }
) {
    const denied = adminGuard(request);
    if (denied) return denied;

    try {
        const parsed = schema.safeParse(await request.json());

        if (!parsed.success) {
            return Response.json(
                { message: "Geçersiz sipariş bilgisi." },
                { status: 400 }
            );
        }

        if (
            parsed.data.status === "İade" &&
            !parsed.data.returnReason?.trim()
        ) {
            return Response.json(
                { message: "İade nedeni zorunludur." },
                { status: 400 }
            );
        }

        const { id } = await context.params;

        const result = await prisma.$transaction(async (tx) => {
            const order = await tx.order.findUnique({
                where: { id },
                include: { items: true },
            });

            if (!order) {
                throw new Error("NOT_FOUND");
            }

            if (order.status === parsed.data.status) {
                return order;
            }

            if (order.status === "İptal") {
                throw new Error("CANCELLED");
            }

            if (order.status === "İade") {
                throw new Error("RETURNED");
            }

            const isReturn = parsed.data.status === "İade";
            const isCancel = parsed.data.status === "İptal";

            const changed = await tx.order.updateMany({
                where: {
                    id,
                    status: order.status,
                },
                data: {
                    status: parsed.data.status,

                    returnReason: isReturn
                        ? parsed.data.returnReason?.trim() || null
                        : order.returnReason,

                    returnNote: isReturn
                        ? parsed.data.returnNote?.trim() || null
                        : order.returnNote,

                    returnedAt: isReturn
                        ? new Date()
                        : order.returnedAt,
                },
            });

            if (!changed.count) {
                throw new Error("CONFLICT");
            }

            if (isCancel || isReturn) {
                for (const item of order.items) {
                    if (!item.productId) continue;

                    await tx.product.update({
                        where: {
                            id: item.productId,
                        },
                        data: {
                            stock: {
                                increment: item.quantity,
                            },
                        },
                    });
                }
            }

            return {
                ...order,
                status: parsed.data.status,

                returnReason: isReturn
                    ? parsed.data.returnReason?.trim() || null
                    : order.returnReason,

                returnNote: isReturn
                    ? parsed.data.returnNote?.trim() || null
                    : order.returnNote,

                returnedAt: isReturn
                    ? new Date()
                    : order.returnedAt,
            };
        });

        return Response.json({
            order: orderView(result),
        });
    } catch (error) {
        let message =
            "Sipariş güncellenemedi. Yenileyip tekrar deneyin.";

        if (error instanceof Error) {
            if (error.message === "CANCELLED") {
                message = "İptal edilen sipariş yeniden değiştirilemez.";
            }

            if (error.message === "RETURNED") {
                message = "İade edilmiş sipariş yeniden değiştirilemez.";
            }

            if (error.message === "NOT_FOUND") {
                message = "Sipariş bulunamadı.";
            }
        }

        return Response.json(
            { message },
            { status: 409 }
        );
    }
}