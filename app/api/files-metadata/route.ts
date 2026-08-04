import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { fileIds } = await req.json();
    if (!Array.isArray(fileIds) || fileIds.length === 0) {
      return NextResponse.json({ files: [] });
    }

    const apiKey = process.env.DRIVE_API_KEY;
    const enableOAuth = process.env.ENABLE_OAUTH_LOGIN === "true";

    let accessToken: string | undefined = undefined;
    try {
      const { cookies } = await import("next/headers");
      const cookieStore = cookies();
      const sessionCookie = cookieStore.get("gdrive_session")?.value;
      if (sessionCookie && enableOAuth) {
        const { getSessionToken } = await import("@/lib/session-helper").catch(() => ({
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          getSessionToken: async (_cookie?: string) => undefined as string | undefined
        }));
        accessToken = await getSessionToken(sessionCookie);
      }
    } catch {
      // Ignore session errors
    }

    if (!apiKey && !accessToken) {
      return NextResponse.json(
        {
          error: "DRIVE_API_KEY belum dikonfigurasi di server, dan Anda tidak sedang dalam sesi login Google.",
        },
        { status: 500 }
      );
    }

    // Fetch metadata for all files in parallel
    const filesMetadata = await Promise.all(
      fileIds.map(async (id) => {
        try {
          const metaUrl = `https://www.googleapis.com/drive/v3/files/${id}?fields=id,name,mimeType,size${
            accessToken ? "" : `&key=${apiKey}`
          }`;
          const headers: Record<string, string> = {};
          if (accessToken) {
            headers["Authorization"] = `Bearer ${accessToken}`;
          }

          const res = await fetch(metaUrl, { headers });
          if (!res.ok) {
            throw new Error(`Failed to fetch metadata (Status: ${res.status})`);
          }

          const data = await res.json();
          const sizeStr = data.size || "0";
          const size = parseInt(sizeStr, 10);

          return {
            id,
            name: data.name || "unnamed_file",
            mimeType: data.mimeType || "",
            size: isNaN(size) ? 0 : size,
          };
        } catch (err: unknown) {
          return {
            id,
            name: "unresolved_name",
            mimeType: "",
            size: 0,
            error: err instanceof Error ? err.message : String(err),
          };
        }
      })
    );

    return NextResponse.json({ files: filesMetadata });
  } catch (error: unknown) {
    console.error("Error in files-metadata endpoint:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
