import { z } from "zod";

export const DESIGN_SLUG = "akn-admin-settings";
export const ASSET_PREFIX = "akn-design-image-";
export function safeDesignUrl(value: string) {
  if (!value) return true;
  if (/[\\\s\u0000-\u001f]/.test(value)) return false;
  if (value.startsWith("/") && !value.startsWith("//")) return true;
  try { const url = new URL(value); return url.protocol === "https:" && !url.username && !url.password; } catch { return false; }
}
const url = z.string().trim().max(2000).refine(safeDesignUrl, "Yerel bağlantı veya güvenli https:// adresi kullanın.");
export const themeSchema = z.object({
  id: z.string().regex(/^[a-zA-Z0-9-]{1,60}$/), name: z.string().trim().min(1).max(50),
  accent: z.string().regex(/^#[a-fA-F0-9]{6}$/), rounded: z.boolean(),
});
export const presetThemes = [
  { id: "AKN", name: "AKN Klasik", accent: "#e32636", rounded: false },
  { id: "GECE", name: "Lacivert Atölye", accent: "#203c68", rounded: true },
  { id: "DOGA", name: "Yeşil Rota", accent: "#176345", rounded: true },
];
export const promotionSchema = z.object({
  id: z.string().regex(/^[a-zA-Z0-9-]{1,60}$/), title: z.string().trim().min(1).max(100),
  description: z.string().trim().max(250), image: url.min(1), href: url,
  position: z.enum(["categories", "products", "bottom"]), active: z.boolean(),
});
export const designSchema = z.object({
  theme: z.string().max(60).default("AKN"), themes: z.array(themeSchema).max(8).default([]),
  productsPerPage: z.number().int().min(4).max(200).default(24),
  categoryDescription: z.boolean().default(true), brandDescription: z.boolean().default(true),
  productCode: z.boolean().default(true), stockStatus: z.boolean().default(true),
  showPrices: z.boolean().default(true), quickBuy: z.boolean().default(true),
  hero: z.object({ image: url.default("/akn-workshop.png"), heading: z.string().trim().max(120).default(""),
    description: z.string().trim().max(300).default(""), buttonText: z.string().trim().min(1).max(50).default("Ürünleri keşfet"), href: url.min(1).default("/urunler"),
  }).default({ image: "/akn-workshop.png", heading: "", description: "", buttonText: "Ürünleri keşfet", href: "/urunler" }),
  promotions: z.array(promotionSchema).max(12).default([]),
}).superRefine((value, ctx) => {
  const ids = [...presetThemes, ...value.themes].map(t => t.id);
  if (new Set(ids).size !== ids.length || !ids.includes(value.theme)) ctx.addIssue({ code: "custom", path: ["theme"], message: "Geçerli ve benzersiz bir tema seçin." });
  if (new Set(value.promotions.map(p => p.id)).size !== value.promotions.length) ctx.addIssue({ code: "custom", path: ["promotions"], message: "Tanıtım kartlarının kimlikleri benzersiz olmalı." });
});
export type StoreDesign = z.infer<typeof designSchema>;
export type Promotion = z.infer<typeof promotionSchema>;
export const defaultDesign: StoreDesign = designSchema.parse({});
export function normalizeDesign(raw: unknown): StoreDesign {
  if (!raw || typeof raw !== "object") return defaultDesign;
  const input = raw as Record<string, unknown>;
  const themes = z.array(themeSchema).max(8).safeParse(input.themes);
  const theme = [...presetThemes, ...(themes.success ? themes.data : [])].some(t => t.id === input.theme) ? input.theme : "AKN";
  const parsed = designSchema.safeParse({ ...input, theme });
  return parsed.success ? parsed.data : defaultDesign;
}
export function themeForeground(color: string) {
  const rgb = [1, 3, 5].map(i => parseInt(color.slice(i, i + 2), 16) / 255).map(c => c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722 > 0.179 ? "#111111" : "#ffffff";
}
