import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin";
export function proxy(request: NextRequest) {
  if (!isAdmin(request)) {
    const response = NextResponse.redirect(new URL("/yonetici-giris", request.url));
    response.headers.set("Cache-Control", "no-store");
    return response;
  }
  const response = NextResponse.next();
  response.headers.set("Cache-Control", "no-store");
  return response;
}
export const config = { matcher: ["/admin/:path*"] };
