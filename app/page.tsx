import React from "react";
import { cookies } from "next/headers";
import MainClientPage from "./MainClientPage";

export default async function Home() {
  const enableOAuth = process.env.ENABLE_OAUTH_LOGIN === "true";

  let isLoggedIn = false;
  let userName = "";
  let userEmail = "";

  if (enableOAuth) {
    try {
      const cookieStore = cookies();
      const sessionCookie = cookieStore.get("gdrive_session")?.value;

      if (sessionCookie) {
        // Dynamically require session decrypter to keep imports robust
        const { getSessionData } = await import("@/lib/session-helper").catch(() => ({
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          getSessionData: async (_cookie?: string) => null as { name?: string; email?: string } | null,
        }));
        const data = await getSessionData(sessionCookie);
        if (data) {
          isLoggedIn = true;
          userName = data.name || "";
          userEmail = data.email || "";
        }
      }
    } catch (e) {
      console.error("Failed to parse session cookies:", e);
    }
  }

  return (
    <MainClientPage
      enableOAuth={enableOAuth}
      isLoggedIn={isLoggedIn}
      userName={userName}
      userEmail={userEmail}
    />
  );
}
