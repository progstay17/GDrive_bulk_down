import { NextResponse } from "next/server";
import { getSession } from "@/lib/session-helper";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const error = url.searchParams.get("error");

    if (error) {
      return NextResponse.redirect(new URL(`/?error=${encodeURIComponent(error)}`, req.url));
    }

    if (!code) {
      return NextResponse.redirect(new URL("/?error=No+authorization+code+provided", req.url));
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return NextResponse.json(
        { error: "Google Client ID or Secret is not configured." },
        { status: 500 }
      );
    }

    // Reconstruct the exact same redirect URI dynamically
    const protocol = req.headers.get("x-forwarded-proto") || url.protocol.replace(":", "");
    const host = req.headers.get("x-forwarded-host") || url.host;
    const redirectUri = `${protocol}://${host}/api/auth/callback`;

    // Exchange authorization code for tokens
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code: code,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      console.error("Google token exchange error:", errText);
      return NextResponse.redirect(new URL("/?error=Failed+to+exchange+authorization+code", req.url));
    }

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;
    const refreshToken = tokenData.refresh_token;
    const expiresIn = tokenData.expires_in || 3600;
    const expiresAt = Date.now() + expiresIn * 1000;

    // Fetch user profile info
    const profileRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    let name = "Google User";
    let email = "";

    if (profileRes.ok) {
      try {
        const profileData = await profileRes.json();
        name = profileData.name || profileData.given_name || "Google User";
        email = profileData.email || "";
      } catch {
        // Fallback if JSON parsing fails
      }
    }

    // Save tokens and user info in session
    const session = await getSession();
    session.accessToken = accessToken;
    if (refreshToken) {
      session.refreshToken = refreshToken;
    }
    session.expiresAt = expiresAt;
    session.name = name;
    session.email = email;
    await session.save();

    return NextResponse.redirect(new URL("/", req.url));
  } catch (err: unknown) {
    console.error("Error in OAuth callback route:", err);
    return NextResponse.redirect(new URL("/?error=Internal+server+error+during+OAuth+callback", req.url));
  }
}
