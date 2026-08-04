import { NextResponse } from "next/server";
import { GOOGLE_NATIVE_MAPPING } from "@/lib/gdrive";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Helper for exponential backoff/retry logic on Google Drive API 429 status code
async function fetchWithRetry(url: string, options: RequestInit, retries = 3, delay = 1000): Promise<Response> {
  const response = await fetch(url, options);
  if (response.status === 429 && retries > 0) {
    console.warn(`Google Drive API returned 429 (Rate Limit Exceeded). Retrying in ${delay}ms... (${retries} retries left)`);
    await new Promise((resolve) => setTimeout(resolve, delay));
    return fetchWithRetry(url, options, retries - 1, delay * 2);
  }
  return response;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing file ID parameter." }, { status: 400 });
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

    // 1. Fetch file metadata
    const metaUrl = `https://www.googleapis.com/drive/v3/files/${id}?fields=name,mimeType,size${
      accessToken ? "" : `&key=${apiKey}`
    }`;
    const metaHeaders: Record<string, string> = {};
    if (accessToken) {
      metaHeaders["Authorization"] = `Bearer ${accessToken}`;
    }

    const metaRes = await fetchWithRetry(metaUrl, { headers: metaHeaders });
    if (!metaRes.ok) {
      const status = metaRes.status;
      let errMsg = `Metadata fetch failed with status ${status}`;
      try {
        const errJson = await metaRes.json();
        if (errJson?.error?.message) {
          errMsg = errJson.error.message;
        }
      } catch {
        // Ignore json parse error
      }
      return NextResponse.json({ error: errMsg }, { status });
    }

    const metadata = await metaRes.json();
    const fileName = metadata.name || "unnamed_file";
    const mimeType = metadata.mimeType || "";

    // Validation
    if (mimeType === "application/vnd.google-apps.folder") {
      return NextResponse.json({ error: "Folder download is not supported." }, { status: 400 });
    }

    if (mimeType.startsWith("application/vnd.google-apps.") && !GOOGLE_NATIVE_MAPPING[mimeType]) {
      return NextResponse.json(
        { error: `Google Native format "${mimeType}" is not supported.` },
        { status: 400 }
      );
    }

    // 2. Fetch/export content
    let downloadUrl = "";
    let finalFileName = fileName;

    const nativeMapping = GOOGLE_NATIVE_MAPPING[mimeType];
    if (nativeMapping) {
      const exportMime = nativeMapping.mimeType;
      const ext = nativeMapping.extension;
      if (!finalFileName.toLowerCase().endsWith(ext)) {
        finalFileName = finalFileName + ext;
      }
      downloadUrl = `https://www.googleapis.com/drive/v3/files/${id}/export?mimeType=${encodeURIComponent(
        exportMime
      )}${accessToken ? "" : `&key=${apiKey}`}`;
    } else {
      downloadUrl = `https://www.googleapis.com/drive/v3/files/${id}?alt=media${
        accessToken ? "" : `&key=${apiKey}`
      }`;
    }

    const downloadHeaders: Record<string, string> = {};
    if (accessToken) {
      downloadHeaders["Authorization"] = `Bearer ${accessToken}`;
    }

    const downloadRes = await fetchWithRetry(downloadUrl, { headers: downloadHeaders });
    if (!downloadRes.ok) {
      const status = downloadRes.status;
      let errMsg = `Download failed with status ${status}`;
      try {
        const errJson = await downloadRes.json();
        if (errJson?.error?.message) {
          errMsg = errJson.error.message;
        }
      } catch {
        // Ignore JSON parse error
      }
      return NextResponse.json({ error: errMsg }, { status });
    }

    const fileBuffer = await downloadRes.arrayBuffer();

    return new Response(fileBuffer, {
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `attachment; filename="${finalFileName.replace(/"/g, '\\"')}"`,
      },
    });
  } catch (error: unknown) {
    console.error("Error in download-single endpoint:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
