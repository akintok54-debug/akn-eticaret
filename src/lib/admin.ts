import { createHash, createHmac, timingSafeEqual } from "node:crypto";

export function adminCredentialsMatch(user: string, password: string): boolean {
  if (!process.env.ADMIN_USER || !process.env.ADMIN_PASSWORD || process.env.ADMIN_PASSWORD.length < 16) return false;
  const digest = (value: string) => createHash("sha256").update(value).digest();
  return timingSafeEqual(digest(JSON.stringify([user,password])), digest(JSON.stringify([process.env.ADMIN_USER,process.env.ADMIN_PASSWORD])));
}
export function adminToken() {
  const expires = String(Date.now() + 8 * 60 * 60 * 1000);
  return `${expires}.${createHmac("sha256", process.env.ADMIN_PASSWORD!).update(`akn-admin-v2:${expires}`).digest("hex")}`;
}
export function isAdmin(request: Request): boolean {
  const password = process.env.ADMIN_PASSWORD;
  if (!process.env.ADMIN_USER || !password || password.length < 16) return false;
  const entries = (request.headers.get("cookie") ?? "").split(";").map(v=>v.trim());
  if (entries.some(v=>v.startsWith("akn-customer=") && v.slice(13))) return false;
  const token = entries.find(v=>v.startsWith("akn-admin="))?.slice(10);
  if (!token || !/^\d{13}\.[a-f0-9]{64}$/.test(token)) return false;
  const [expires, signature] = token.split(".");
  if (Number(expires) <= Date.now()) return false;
  const expected = createHmac("sha256", password).update(`akn-admin-v2:${expires}`).digest("hex");
  return timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}
function validRequestOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  const allowed = new Set<string>();
  try { allowed.add(new URL(request.url).origin); } catch {}
  if (process.env.SITE_URL) {
    try { allowed.add(new URL(process.env.SITE_URL).origin); } catch {}
  }
  const forwardedHost = request.headers.get("x-forwarded-host") || request.headers.get("host");
  if (forwardedHost) {
    const forwardedProto = request.headers.get("x-forwarded-proto") || "https";
    try { allowed.add(new URL(`${forwardedProto}://${forwardedHost}`).origin); } catch {}
  }
  return allowed.has(origin);
}
export function adminGuard(request: Request): Response | null {
  if (!isAdmin(request)) return Response.json({ success: false, message: "Yönetici girişi gerekli." }, { status: 401, headers: { "Cache-Control": "no-store" } });
  if (!["GET", "HEAD"].includes(request.method) && !validRequestOrigin(request)) return Response.json({ message: "İstek kaynağı doğrulanamadı." }, { status: 403 });
  return null;
}
