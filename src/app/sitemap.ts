import type { MetadataRoute } from "next";
export default function sitemap(): MetadataRoute.Sitemap {
  return ["", "/urunler", "/kategoriler", "/markalar"].map(path=>({url:`https://www.aknmotosiklet.com${path}`}));
}
