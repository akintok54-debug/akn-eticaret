import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const cookieName = "akn-guest";
function sign(id: string) {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) throw new Error("SESSION_SECRET en az 32 karakter olmalı.");
  return createHmac("sha256", secret).update(id).digest("hex");
}
export async function guestSession(create = false): Promise<string | null> {
  const jar = await cookies();
  const raw = jar.get(cookieName)?.value;
  if (raw) {
    const [id, signature] = raw.split(".");
    if (/^[a-f0-9-]{36}$/.test(id) && /^[a-f0-9]{64}$/.test(signature ?? "") && timingSafeEqual(Buffer.from(signature), Buffer.from(sign(id)))) return id;
  }
  if (!create) return null;
  const id = randomUUID();
  jar.set(cookieName, `${id}.${sign(id)}`, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 30 });
  return id;
}
