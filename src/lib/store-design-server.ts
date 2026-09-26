import { prisma } from "@/lib/prisma";
import { DESIGN_SLUG, normalizeDesign } from "@/lib/store-design";

export async function getStoreDesign() {
  try {
    const row = await prisma.integrationSetting.findUnique({ where: { slug: DESIGN_SLUG } });
    const values = row?.values as Record<string, unknown> | null;
    return normalizeDesign(values?.design);
  } catch {
    return normalizeDesign(null);
  }
}
