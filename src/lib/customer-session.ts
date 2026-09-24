import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

const scrypt = promisify(scryptCallback);
const cookieName = "akn-customer";
const digest = (token: string) => createHash("sha256").update(token).digest("hex");
export async function passwordHash(password: string) {
  const salt = randomBytes(16).toString("hex");
  const key = await scrypt(password, salt, 64) as Buffer;
  return salt + ":" + key.toString("hex");
}
export async function passwordMatches(password: string, hash: string) {
  const [salt, stored] = hash.split(":");
  if (!/^[a-f0-9]{32}$/.test(salt) || !/^[a-f0-9]{128}$/.test(stored ?? "")) return false;
  const key = await scrypt(password, salt, 64) as Buffer;
  return timingSafeEqual(key, Buffer.from(stored, "hex"));
}
export function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  return !!origin && (origin === new URL(request.url).origin || origin === process.env.SITE_URL);
}
export async function currentCustomer() {
  const raw = (await cookies()).get(cookieName)?.value;
  if (!raw || !/^[a-f0-9]{64}$/.test(raw)) return null;
  const session = await prisma.customerSession.findUnique({where:{id:digest(raw)},include:{account:{include:{customer:{include:{group:true,addresses:{orderBy:{isDefault:"desc"}}}}}}}});
  if (!session || session.expiresAt <= new Date() || !session.account.customer.active) return null;
  return session.account.customer;
}
export async function createCustomerSession(accountId: string) {
  const token = randomBytes(32).toString("hex");
  await prisma.customerSession.create({data:{id:digest(token),accountId,expiresAt:new Date(Date.now()+7*86400000)}});
  const jar=await cookies();
  jar.delete("akn-admin");
  jar.set(cookieName,token,{httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"lax",path:"/",maxAge:7*86400});
}
export async function endCustomerSession() {
  const jar=await cookies(), raw=jar.get(cookieName)?.value;
  if(raw) await prisma.customerSession.deleteMany({where:{id:digest(raw)}});
  jar.delete(cookieName);
}
