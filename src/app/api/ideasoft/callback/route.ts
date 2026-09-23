import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    const baseUrl = process.env.IDEASOFT_BASE_URL;
    const clientId = process.env.IDEASOFT_CLIENT_ID;
    const clientSecret = process.env.IDEASOFT_CLIENT_SECRET;
    const redirectUri = process.env.IDEASOFT_REDIRECT_URI;

    if (!baseUrl || !clientId || !clientSecret || !redirectUri) {
        return NextResponse.json(
            {
                success: false,
                message: "IdeaSoft bağlantı ayarları eksik.",
            },
            { status: 500 }
        );
    }

    const code = request.nextUrl.searchParams.get("code");
    const state = request.nextUrl.searchParams.get("state");

    const savedState =
        request.cookies.get("ideasoft_oauth_state")?.value;

    if (!code) {
        return NextResponse.json(
            {
                success: false,
                message: "IdeaSoft yetkilendirme kodu gelmedi.",
            },
            { status: 400 }
        );
    }

    if (!state || !savedState || state !== savedState) {
        return NextResponse.json(
            {
                success: false,
                message: "IdeaSoft OAuth state doğrulaması başarısız.",
            },
            { status: 400 }
        );
    }

    const tokenUrl = new URL("/oauth/v2/token", baseUrl);

    const body = new URLSearchParams({
        grant_type: "authorization_code",
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        code,
    });

    const tokenResponse = await fetch(tokenUrl, {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Accept: "application/json",
        },
        body,
        cache: "no-store",
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok || !tokenData.access_token) {
        console.error("IdeaSoft token hatası:", tokenData);

        return NextResponse.json(
            {
                success: false,
                message: "IdeaSoft access token alınamadı.",
            },
            { status: 500 }
        );
    }

    const response = NextResponse.redirect(
        new URL(
            "/admin/entegrasyonlar?ideasoft=connected",
            request.url
        )
    );

    response.cookies.set(
        "ideasoft_access_token",
        tokenData.access_token,
        {
            httpOnly: true,
            sameSite: "lax",
            secure: false,
            path: "/",
            maxAge: Number(tokenData.expires_in || 3600),
        }
    );

    if (tokenData.refresh_token) {
        response.cookies.set(
            "ideasoft_refresh_token",
            tokenData.refresh_token,
            {
                httpOnly: true,
                sameSite: "lax",
                secure: false,
                path: "/",
                maxAge: 60 * 60 * 24 * 30,
            }
        );
    }

    response.cookies.delete("ideasoft_oauth_state");

    return response;
}