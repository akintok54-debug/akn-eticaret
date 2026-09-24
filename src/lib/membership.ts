import { z } from "zod";

export function normalizePhone(value: string) {
  const digits = value.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("90")) return `0${digits.slice(2)}`;
  if (digits.length === 10 && digits.startsWith("5")) return `0${digits}`;
  return digits;
}

export const customerSchema = z.object({
  fullName: z.string().trim().min(2).max(200),
  phone: z.string().trim().regex(/^\+?[0-9 ()-]{10,20}$/).transform(normalizePhone).refine(value => /^\d{10,15}$/.test(value)),
  email: z.union([z.email().max(200), z.literal("")]).optional().nullable(),
  companyName: z.string().trim().max(200).optional().nullable(),
  taxOffice: z.string().trim().max(200).optional().nullable(),
  taxNumber: z.union([z.string().regex(/^\d{10,11}$/), z.literal("")]).optional().nullable(),
  type: z.enum(["retail", "dealer"]),
  groupId: z.string().max(100).optional().nullable(),
  discountRate: z.number().min(0).max(100),
  active: z.boolean(),
  city: z.string().trim().max(100).optional(),
  district: z.string().trim().max(100).optional(),
  address: z.string().trim().max(1000).optional(),
});

export function membershipError(error: unknown) {
  if (error instanceof SyntaxError) return Response.json({ message: "Geçersiz JSON." }, { status: 400 });
  const code = error && typeof error === "object" && "code" in error ? error.code : undefined;
  if (code === "P2002") return Response.json({ message: "Aynı telefon, ad veya kod zaten kayıtlı." }, { status: 409 });
  if (code === "P2025") return Response.json({ message: "Kayıt bulunamadı." }, { status: 404 });
  if (code === "P2003") return Response.json({ message: "İlişkili kayıt bulunamadı." }, { status: 400 });
  if (code === "P2034") return Response.json({ message: "Kayıt başka bir işlemde değişti. Lütfen tekrar deneyin." }, { status: 409 });
  if (error instanceof Error && error.message === "GROUP") return Response.json({ message: "Müşteri tipine uygun aktif bir grup seçin." }, { status: 400 });
  return Response.json({ message: "İşlem tamamlanamadı. Lütfen tekrar deneyin." }, { status: 503 });
}
