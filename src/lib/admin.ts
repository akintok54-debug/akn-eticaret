import { createHash, createHmac, timingSafeEqual } from "node:crypto";

export function adminToken() {
  const expires = String(Date.now() + 8 * 60 * 60 * 1000);
  return `${expires}.${createHmac("sha256", process.env.ADMIN_PASSWORD!).update(`akn-admin:${expires}`).digest("hex")}`;
}

export function isAdmin(request: Request): boolean {
  const user = process.env.ADMIN_USER;
  const password = process.env.ADMIN_PASSWORD;
  if (!user || !password || password.length < 16) return false;
  const token = request.headers.get("cookie")?.split(";").map(v=>v.trim()).find(v=>v.startsWith("akn-admin="))?.slice(10);
  if (token) {
    const [expires, signature] = token.split(".");
    if (/^\d{13}$/.test(expires) && Number(expires) > Date.now() && /^[a-f0-9]{64}$/.test(signature ?? "")) {
      const expected = createHmac("sha256", password).update(`akn-admin:${expires}`).digest("hex");
      if (timingSafeEqual(Buffer.from(expected), Buffer.from(signature))) return true;
    }
  }
  const supplied = request.headers.get("authorization") ?? "";
  const expected = `Basic ${Buffer.from(`${user}:${password}`).toString("base64")}`;
  return timingSafeEqual(createHash("sha256").update(supplied).digest(), createHash("sha256").update(expected).digest());
}

export function adminGuard(request: Request): Response | null {
  if (!isAdmin(request)) return Response.json({ success: false, message: "Yönetici girişi gerekli." }, { status: 401, headers: { "WWW-Authenticate": 'Basic realm="AKN Yonetim", charset="UTF-8"', "Cache-Control": "no-store" } });
  const origin = request.headers.get("origin");
  if (!["GET", "HEAD"].includes(request.method) && origin && origin !== new URL(request.url).origin && origin !== process.env.SITE_URL) return Response.json({ message: "İstek kaynağı doğrulanamadı." }, { status: 403 });
  return null;
}
