import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/admin";
import ClientLayout from "./layout-client";

export default async function AdminServerLayout({ children }: { children: React.ReactNode }) {
  const h = await headers();
  const req = new Request("http://localhost", {
    headers: { cookie: h.get("cookie") ?? "", authorization: h.get("authorization") ?? "" },
  });
  if (!isAdmin(req)) redirect("/yonetici-giris");
  return <ClientLayout>{children}</ClientLayout>;
}
