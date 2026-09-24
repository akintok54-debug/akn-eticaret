import { adminGuard } from "@/lib/admin";
import { NextResponse } from "next/server";
import crypto from "crypto";

export async function GET(request: Request) {
    const denied = adminGuard(request); if (denied) return denied;
    const baseUrl = process.env.IDEASOFT_BASE_URL;
    const clientId = process.env.IDEASOFT_CLIENT_ID;
    const redirectUri = process.env.IDEASOFT_REDIRECT_URI;

    if (!baseUrl || !clientId || !redirectUri) {
        return NextResponse.json(
            {
                success: false,
                message: "IdeaSoft bağlantı ayarları eksik.",
            },
            { status: 500 }
        );
    }

    const state = crypto.randomUUID();

    const authUrl = new URL("/panel/auth", baseUrl);

    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("client_id", clientId);
    authUrl.searchParams.set("redirect_uri", redirectUri);
    authUrl.searchParams.set("state", state);

    const response = NextResponse.redirect(authUrl);

    response.cookies.set("ideasoft_oauth_state", state, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 10,
    });

    return response;
}