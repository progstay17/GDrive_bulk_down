import { getIronSession } from "iron-session";
import { cookies } from "next/headers";

export interface SessionData {
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: number; // timestamp in ms
  name?: string;
  email?: string;
}

const SESSION_SECRET =
  process.env.SESSION_SECRET || "fallback_secret_must_be_at_least_32_chars_long_gdrive_downloader";

export const sessionOptions = {
  password: SESSION_SECRET,
  cookieName: "gdrive_session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
  },
};

/**
 * Retrieves the current session object.
 */
export async function getSession() {
  const cookieStore = cookies();
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions);
  return session;
}

/**
 * Retrieves the active access token, refreshing it if expired and refresh token is available.
 */
export async function getSessionToken(): Promise<string | undefined> {
  try {
    const session = await getSession();
    if (!session.accessToken) return undefined;

    // If token is expired or expiring in less than 5 minutes (300 seconds), try to refresh
    const isExpired =
      session.expiresAt && Date.now() + 300 * 1000 >= session.expiresAt;

    if (isExpired && session.refreshToken) {
      console.log("Access token is expired or expiring soon, attempting to refresh...");
      const newTokens = await refreshGoogleAccessToken(session.refreshToken);
      if (newTokens) {
        session.accessToken = newTokens.accessToken;
        session.expiresAt = newTokens.expiresAt;
        await session.save();
        console.log("Access token refreshed successfully.");
        return newTokens.accessToken;
      } else {
        console.warn("Failed to refresh access token, using existing token as fallback.");
      }
    }

    return session.accessToken;
  } catch (err) {
    console.error("Error in getSessionToken:", err);
    return undefined;
  }
}

/**
 * Retrieves basic logged-in user profile info.
 */
export async function getSessionData(): Promise<{ name?: string; email?: string } | null> {
  try {
    const session = await getSession();
    if (!session.accessToken) return null;
    return {
      name: session.name,
      email: session.email,
    };
  } catch {
    return null;
  }
}

interface RefreshedTokens {
  accessToken: string;
  expiresAt: number;
}

/**
 * Makes a request to Google OAuth token endpoint to refresh the access token.
 */
async function refreshGoogleAccessToken(refreshToken: string): Promise<RefreshedTokens | null> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.error("Google OAuth client ID or client secret is not configured.");
    return null;
  }

  try {
    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("Google token refresh API error:", errText);
      return null;
    }

    const data = await res.json();
    const expiresIn = data.expires_in || 3600; // default 1 hour
    return {
      accessToken: data.access_token,
      expiresAt: Date.now() + expiresIn * 1000,
    };
  } catch (err) {
    console.error("Exception in refreshGoogleAccessToken:", err);
    return null;
  }
}
