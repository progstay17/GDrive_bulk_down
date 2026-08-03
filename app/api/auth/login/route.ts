import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const enableOAuth = process.env.ENABLE_OAUTH_LOGIN === "true";
    if (!enableOAuth) {
      return NextResponse.json(
        { error: "OAuth Login tidak aktif." },
        { status: 400 }
      );
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) {
      return NextResponse.json(
        { error: "GOOGLE_CLIENT_ID belum dikonfigurasi di server." },
        { status: 500 }
      );
    }

    // Determine host dynamically
    const url = new URL(req.url);
    const protocol = req.headers.get("x-forwarded-proto") || url.protocol.replace(":", "");
    const host = req.headers.get("x-forwarded-host") || url.host;
    const redirectUri = `${protocol}://${host}/api/auth/callback`;

    const scopes = [
      "https://www.googleapis.com/auth/drive.readonly",
      "openid",
      "email",
      "profile",
    ];

    const googleAuthUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    googleAuthUrl.searchParams.set("client_id", clientId);
    googleAuthUrl.searchParams.set("redirect_uri", redirectUri);
    googleAuthUrl.searchParams.set("response_type", "code");
    googleAuthUrl.searchParams.set("scope", scopes.join(" "));
    googleAuthUrl.searchParams.set("access_type", "offline");
    googleAuthUrl.searchParams.set("prompt", "consent"); // Force consent to ensure refresh token is returned

    return NextResponse.redirect(googleAuthUrl.toString());
  } catch (err: unknown) {
    console.error("Error in login route:", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
