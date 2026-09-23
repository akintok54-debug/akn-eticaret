import { NextRequest, NextResponse } from "next/server";
import { adminGuard, adminToken } from "@/lib/admin";

export function proxy(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/admin")) {
    const denied = adminGuard(request); if (denied) return denied;
    const response = NextResponse.next();
    response.cookies.set("akn-admin", adminToken(), { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/", maxAge: 8 * 60 * 60 });
    response.headers.set("Cache-Control", "no-store");
    return response;
  }
  return NextResponse.next();
}
export const config = { matcher: ["/admin/:path*"] };
