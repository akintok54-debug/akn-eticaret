import { z } from "zod";
import { adminGuard } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

const createTicketSchema = z.object({
    customerId: z.string().min(1).optional().nullable(),
    customerName: z.string().trim().max(150).optional().nullable(),
    customerPhone: z.string().trim().max(30).optional().nullable(),
    customerEmail: z
        .string()
        .trim()
        .email()
        .max(200)
        .optional()
        .nullable(),
    subject: z.string().trim().min(2).max(200),
    category: z.string().trim().min(1).max(50).default("general"),
    priority: z.enum(["low", "normal", "high", "urgent"]).default("normal"),
    message: z.string().trim().min(1).max(5000),
});

const updateTicketSchema = z.object({
    id: z.string().min(1),
    status: z.enum(["open", "in_progress", "closed"]).optional(),
    priority: z.enum(["low", "normal", "high", "urgent"]).optional(),
    category: z.string().trim().min(1).max(50).optional(),
});

function createTicketNumber() {
    const now = new Date();

    const date = [
        now.getFullYear(),
        String(now.getMonth() + 1).padStart(2, "0"),
        String(now.getDate()).padStart(2, "0"),
    ].join("");

    const random = Math.floor(
        100000 + Math.random() * 900000
    );

    return `AKN-${date}-${random}`;
}

/*
 * DESTEK TALEPLERİNİ LİSTELE
 * Yönetim paneli içindir.
 */
export async function GET(request: Request) {
    const denied = adminGuard(request);
    if (denied) return denied;

    try {
        const tickets = await prisma.supportTicket.findMany({
            include: {
                customer: {
                    select: {
                        id: true,
                        fullName: true,
                        phone: true,
                        email: true,
                        type: true,
                        dealerStatus: true,
                    },
                },
                messages: {
                    orderBy: {
                        createdAt: "asc",
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
            take: 500,
        });

        return Response.json(
            {
                tickets,
            },
            {
                headers: {
                    "Cache-Control": "no-store",
                },
            }
        );
    } catch (error) {
        console.error(
            "GET /api/support-tickets",
            error
        );

        return Response.json(
            {
                message: "Destek talepleri alınamadı.",
            },
            {
                status: 500,
            }
        );
    }
}

/*
 * YENİ DESTEK TALEBİ OLUŞTUR
 *
 * Şimdilik adminGuard kullanıyoruz.
 * Müşteri destek formunu daha sonra ayrı public endpoint
 * üzerinden bağlayacağız.
 */
export async function POST(request: Request) {
    const denied = adminGuard(request);
    if (denied) return denied;

    try {
        const parsed = createTicketSchema.safeParse(
            await request.json()
        );

        if (!parsed.success) {
            return Response.json(
                {
                    message:
                        "Destek talebi bilgilerini kontrol edin.",
                },
                {
                    status: 400,
                }
            );
        }

        const {
            customerId,
            customerName,
            customerPhone,
            customerEmail,
            subject,
            category,
            priority,
            message,
        } = parsed.data;

        if (customerId) {
            const customer = await prisma.customer.findUnique({
                where: {
                    id: customerId,
                },
                select: {
                    id: true,
                },
            });

            if (!customer) {
                return Response.json(
                    {
                        message: "Müşteri bulunamadı.",
                    },
                    {
                        status: 404,
                    }
                );
            }
        }

        let ticketNumber = createTicketNumber();

        /*
         * Çok düşük ihtimalle aynı numara oluşursa
         * birkaç kez yeni numara üretir.
         */
        for (let attempt = 0; attempt < 5; attempt += 1) {
            const existing =
                await prisma.supportTicket.findUnique({
                    where: {
                        ticketNumber,
                    },
                    select: {
                        id: true,
                    },
                });

            if (!existing) {
                break;
            }

            ticketNumber = createTicketNumber();
        }

        const ticket = await prisma.supportTicket.create({
            data: {
                ticketNumber,

                customer: customerId
                    ? {
                        connect: {
                            id: customerId,
                        },
                    }
                    : undefined,

                customerName: customerName || null,
                customerPhone: customerPhone || null,
                customerEmail: customerEmail || null,

                subject,
                category,
                priority,
                status: "open",

                messages: {
                    create: {
                        senderType: "customer",
                        senderName:
                            customerName || "Müşteri",
                        message,
                    },
                },
            },

            include: {
                customer: {
                    select: {
                        id: true,
                        fullName: true,
                        phone: true,
                        email: true,
                    },
                },

                messages: {
                    orderBy: {
                        createdAt: "asc",
                    },
                },
            },
        });

        return Response.json(
            {
                success: true,
                ticket,
            },
            {
                status: 201,
            }
        );
    } catch (error) {
        console.error(
            "POST /api/support-tickets",
            error
        );

        return Response.json(
            {
                message: "Destek talebi oluşturulamadı.",
            },
            {
                status: 500,
            }
        );
    }
}

/*
 * DESTEK TALEBİNİ GÜNCELLE
 */
export async function PATCH(request: Request) {
    const denied = adminGuard(request);
    if (denied) return denied;

    try {
        const parsed = updateTicketSchema.safeParse(
            await request.json()
        );

        if (!parsed.success) {
            return Response.json(
                {
                    message: "Geçersiz destek talebi işlemi.",
                },
                {
                    status: 400,
                }
            );
        }

        const { id, status, priority, category } =
            parsed.data;

        const existing =
            await prisma.supportTicket.findUnique({
                where: {
                    id,
                },
                select: {
                    id: true,
                },
            });

        if (!existing) {
            return Response.json(
                {
                    message: "Destek talebi bulunamadı.",
                },
                {
                    status: 404,
                }
            );
        }

        const ticket =
            await prisma.supportTicket.update({
                where: {
                    id,
                },

                data: {
                    ...(status !== undefined
                        ? {
                            status,
                            closedAt:
                                status === "closed"
                                    ? new Date()
                                    : null,
                        }
                        : {}),

                    ...(priority !== undefined
                        ? {
                            priority,
                        }
                        : {}),

                    ...(category !== undefined
                        ? {
                            category,
                        }
                        : {}),
                },

                include: {
                    customer: {
                        select: {
                            id: true,
                            fullName: true,
                            phone: true,
                            email: true,
                        },
                    },

                    messages: {
                        orderBy: {
                            createdAt: "asc",
                        },
                    },
                },
            });

        return Response.json({
            success: true,
            ticket,
        });
    } catch (error) {
        console.error(
            "PATCH /api/support-tickets",
            error
        );

        return Response.json(
            {
                message:
                    "Destek talebi güncellenemedi.",
            },
            {
                status: 500,
            }
        );
    }
}