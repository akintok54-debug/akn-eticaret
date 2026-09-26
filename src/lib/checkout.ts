import { z } from "zod";
import { isValidTurkishIban } from "./bank.ts";

const text = z.string().trim().min(2).max(200);

export const checkoutSchema = z.object({
  checkoutKey: z.uuid(),
  couponCode: z.string().trim().max(50).optional(),
  cartSessionId: z.uuid().optional(),
  expectedTotal: z.number().finite().nonnegative(),
  customer: z.object({
    fullName: text,
    phone: z.string().trim().regex(/^\+?[0-9 ()-]{10,20}$/),
    email: z.email().max(200),
  }),
  delivery: z.object({
    city: text,
    district: text,
    address: z.string().trim().min(10).max(1000),
  }),
  invoice: z.object({
    type: z.enum(["individual", "corporate"]),
    companyName: z.string().max(200).default(""),
    taxOffice: z.string().max(200).default(""),
    taxNumber: z.string().max(11).default(""),
  }).refine(
    v => v.type !== "corporate" || (
      v.companyName.trim().length > 1 &&
      v.taxOffice.trim().length > 1 &&
      /^\d{10,11}$/.test(v.taxNumber)
    ),
    "Kurumsal fatura bilgileri eksik.",
  ),
  paymentMethod: z.enum(["transfer", "sipay"]),
  legal: z.object({
    preInformationAccepted: z.boolean(),
    distanceSalesAccepted: z.boolean(),
    b2bTermsAccepted: z.boolean(),
    kvkkNoticeRead: z.literal(true),
  }),
  items: z.array(z.object({
    productId: z.string().min(1).max(100),
    quantity: z.number().int().min(1).max(999),
  })).min(1).max(100),
});

export function checkoutSettings() {
  const shipping = Number(process.env.SHIPPING_PRICE ?? 99);
  const threshold = Number(process.env.FREE_SHIPPING_THRESHOLD ?? 2000);
  const bankName = process.env.BANK_ACCOUNT_NAME ?? "";
  const iban = process.env.BANK_IBAN ?? "";
  let validDatabase = false;
  try {
    validDatabase = ["postgres:", "postgresql:"].includes(new URL(process.env.DATABASE_URL ?? "").protocol);
  } catch {
    /* Missing or invalid database keeps checkout closed. */
  }
  const enabled = process.env.CHECKOUT_ENABLED === "true" &&
    validDatabase &&
    !!bankName.trim() &&
    isValidTurkishIban(iban) &&
    Number.isFinite(shipping) &&
    shipping >= 0 &&
    Number.isFinite(threshold) &&
    threshold >= 0;
  return {
    enabled,
    shipping: Number.isFinite(shipping) ? shipping : 99,
    threshold: Number.isFinite(threshold) ? threshold : 2000,
    bankName: enabled ? bankName : "",
    iban: enabled ? iban : "",
  };
}

export function shippingCost(subtotal: number, settings = checkoutSettings()) {
  return subtotal >= settings.threshold ? 0 : settings.shipping;
}
