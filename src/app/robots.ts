import type { MetadataRoute } from "next";
export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/api", "/sepet", "/odeme", "/hesabim", "/siparisler"] }, sitemap: "https://www.aknmotosiklet.com/sitemap.xml" };
}
