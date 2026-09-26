import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/admin";

export default async function AdminGuard() {
  const h = await headers();
  const cookie = h.get("cookie") ?? "";
  const authorization = h.get("authorization") ?? "";
  const req = new Request("http://localhost", {
    headers: { cookie, authorization },
  });
  if (!isAdmin(req)) {
    redirect("/");
  }
  return null;
}
