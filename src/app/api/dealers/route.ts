import { z } from "zod";
import { prisma } from "@/lib/prisma";

const text = z.string().trim().min(2).max(200);

const schema = z.object({
    fullName: text,
    phone: z.string().regex(/^\+?[0-9 ()-]{10,20}$/),
    email: z.email().max(200),
    companyName: text,
    taxOffice: text,
    taxNumber: z.string().regex(/^\d{10,11}$/),
    city: text,
    district: text,
    address: z.string().trim().min(10).max(1000),
});

export async function POST(request: Request) {
    const origin = request.headers.get("origin");

    if (
        !origin ||
        (origin !== new URL(request.url).origin &&
            origin !== process.env.SITE_URL)
    ) {
        return Response.json(
            { message: "Geçersiz istek." },
            { status: 403 }
        );
    }

    try {
        const parsed = schema.safeParse(await request.json());

        if (!parsed.success) {
            return Response.json(
                { message: "Lütfen başvuru bilgilerinizi kontrol edin." },
                { status: 400 }
            );
        }

        const {
            city,
            district,
            address,
            ...data
        } = parsed.data;

        const phone = data.phone.replace(/[^0-9]/g, "");

        const result = await prisma.$transaction(async (tx) => {
            let customer = await tx.customer.findUnique({
                where: { phone },
            });

            if (!customer) {
                customer = await tx.customer.create({
                    data: {
                        fullName: data.fullName,
                        phone,
                        email: data.email,
                        type: "dealer",
                        dealerStatus: "pending",
                        companyName: data.companyName,
                        taxOffice: data.taxOffice,
                        taxNumber: data.taxNumber,

                        addresses: {
                            create: {
                                fullName: data.fullName,
                                phone,
                                city,
                                district,
                                address,
                            },
                        },
                    },
                });
            } else {
                customer = await tx.customer.update({
                    where: {
                        id: customer.id,
                    },
                    data: {
                        fullName: data.fullName,
                        email: data.email,
                        type: "dealer",
                        dealerStatus:
                            customer.dealerStatus === "approved"
                                ? "approved"
                                : "pending",
                        companyName: data.companyName,
                        taxOffice: data.taxOffice,
                        taxNumber: data.taxNumber,
                    },
                });
            }

            const existingApplication =
                await tx.dealerApplication.findFirst({
                    where: {
                        customerId: customer.id,
                        status: "pending",
                    },
                    orderBy: {
                        createdAt: "desc",
                    },
                });

            let application;

            if (existingApplication) {
                application = await tx.dealerApplication.update({
                    where: {
                        id: existingApplication.id,
                    },
                    data: {
                        fullName: data.fullName,
                        phone,
                        email: data.email,
                        companyName: data.companyName,
                        taxOffice: data.taxOffice,
                        taxNumber: data.taxNumber,
                        city,
                        district,
                        address,
                    },
                });
            } else {
                application = await tx.dealerApplication.create({
                    data: {
                        customerId: customer.id,
                        fullName: data.fullName,
                        phone,
                        email: data.email,
                        companyName: data.companyName,
                        taxOffice: data.taxOffice,
                        taxNumber: data.taxNumber,
                        city,
                        district,
                        address,
                        status: "pending",
                    },
                });
            }

            return {
                customerId: customer.id,
                applicationId: application.id,
            };
        });

        return Response.json({
            success: true,
            message: "Bayi başvurunuz başarıyla alındı.",
            ...result,
        });
    } catch (error) {
        console.error("Dealer application error:", error);

        return Response.json(
            {
                message:
                    "Başvuru şu anda kaydedilemiyor. Lütfen daha sonra deneyin.",
            },
            { status: 503 }
        );
    }
}