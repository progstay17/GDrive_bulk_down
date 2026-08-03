import { NextResponse } from "next/server";
import * as archiver from "archiver";
import { Readable } from "stream";
import { extractDriveIds, GOOGLE_NATIVE_MAPPING } from "@/lib/gdrive";

// Configured to 60 seconds to match the Hobby plan's max limit safely.
// For Vercel Pro users, this can be increased up to 300 seconds if needed.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Handle CommonJS / ESM Interop for archiver
function createArchiverInstance(format: string, options: Record<string, unknown>) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const archiverFunc = (archiver as any).default || archiver;
  return archiverFunc(format, options);
}

export async function POST(req: Request) {
  try {
    // 1. Parse request body
    let rawText = "";
    const contentType = req.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const json = await req.json();
      rawText = json.rawText || "";
    } else {
      rawText = await req.text();
    }

    // 2. Extract file/folder IDs
    const extracted = extractDriveIds(rawText);
    if (extracted.length === 0) {
      return NextResponse.json(
        { error: "Input tidak mengandung ID atau link Google Drive yang valid." },
        { status: 400 }
      );
    }

    // 3. Check for API Key (and OAuth preparation)
    const apiKey = process.env.DRIVE_API_KEY;
    const enableOAuth = process.env.ENABLE_OAUTH_LOGIN === "true";

    // Attempt to retrieve OAuth access token from cookies if OAuth is enabled
    let accessToken: string | undefined = undefined;
    // We will inspect cookies for "gdrive_session" in Phase 2
    try {
      const { cookies } = await import("next/headers");
      const cookieStore = cookies();
      const sessionCookie = cookieStore.get("gdrive_session")?.value;
      if (sessionCookie && enableOAuth) {
        // We will decrypt/parse it in Phase 2
        const { getSessionToken } = await import("@/lib/session-helper").catch(() => ({
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          getSessionToken: async (_cookie?: string) => undefined as string | undefined
        }));
        accessToken = await getSessionToken(sessionCookie);
      }
    } catch {
      // Ignore cookie errors or missing files for Phase 1
    }

    // If API Key is missing and we don't have OAuth session, return a clear error
    if (!apiKey && !accessToken) {
      return NextResponse.json(
        {
          error: "DRIVE_API_KEY belum dikonfigurasi di server, dan Anda tidak sedang dalam sesi login Google.",
        },
        { status: 500 }
      );
    }

    // 4. Initialize Archiver ZIP stream
    const archive = createArchiverInstance("zip", { zlib: { level: 9 } });

    // Handle archiver errors
    archive.on("error", (err: Error) => {
      console.error("Archiver error:", err);
    });

    const errorsLog: string[] = [];
    const usedNames = new Set<string>();

    const getUniqueFilename = (originalName: string): string => {
      const name = originalName || "unnamed_file";
      if (!usedNames.has(name)) {
        usedNames.add(name);
        return name;
      }

      const dotIndex = name.lastIndexOf(".");
      let base = name;
      let ext = "";
      if (dotIndex > 0) {
        base = name.slice(0, dotIndex);
        ext = name.slice(dotIndex);
      } else if (dotIndex === 0) {
        base = "";
        ext = name;
      }

      let counter = 1;
      let newName = `${base}_${counter}${ext}`;
      while (usedNames.has(newName)) {
        counter++;
        newName = `${base}_${counter}${ext}`;
      }

      usedNames.add(newName);
      return newName;
    };

    // 5. Start background processing of files and streaming to client
    (async () => {
      try {
        for (const item of extracted) {
          const { id, isFolder } = item;

          // Handle folder scenario (explicitly unsupported)
          if (isFolder) {
            errorsLog.push(`[${id}] (nama: folder) — Error: ini folder, bukan file — belum didukung`);
            continue;
          }

          let fileName = "unresolved_name";
          try {
            // A. Fetch Metadata
            const metaUrl = `https://www.googleapis.com/drive/v3/files/${id}?fields=name,mimeType,size${
              accessToken ? "" : `&key=${apiKey}`
            }`;
            const metaHeaders: Record<string, string> = {};
            if (accessToken) {
              metaHeaders["Authorization"] = `Bearer ${accessToken}`;
            }

            const metaRes = await fetch(metaUrl, { headers: metaHeaders });
            if (!metaRes.ok) {
              const status = metaRes.status;
              let errMsg = `Metadata fetch failed with status ${status}`;
              try {
                const errJson = await metaRes.json();
                if (errJson?.error?.message) {
                  errMsg = errJson.error.message;
                }
              } catch {
                // Ignore json parse failure
              }

              if (status === 403 || status === 404) {
                if (enableOAuth && !accessToken) {
                  throw new Error("File private, coba login dulu menggunakan akun Google");
                } else {
                  throw new Error("File private atau tidak ditemukan (pastikan sharing link \"Anyone with the link\")");
                }
              }
              throw new Error(errMsg);
            }

            const metadata = await metaRes.json();
            fileName = metadata.name || "unnamed_file";
            const mimeType = metadata.mimeType || "";

            // B. Validate MimeType
            if (mimeType === "application/vnd.google-apps.folder") {
              throw new Error("ini folder, bukan file — belum didukung");
            }

            if (mimeType.startsWith("application/vnd.google-apps.") && !GOOGLE_NATIVE_MAPPING[mimeType]) {
              throw new Error(`Format native Google "${mimeType}" belum didukung`);
            }

            // C. Download / Export content
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

            const downloadRes = await fetch(downloadUrl, { headers: downloadHeaders });
            if (!downloadRes.ok) {
              const status = downloadRes.status;
              let errMsg = `Download failed with status ${status}`;
              try {
                const errJson = await downloadRes.json();
                if (errJson?.error?.message) {
                  errMsg = errJson.error.message;
                }
              } catch {
                // Ignore json parse failure
              }
              throw new Error(errMsg);
            }

            const arrayBuffer = await downloadRes.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            const uniqueName = getUniqueFilename(finalFileName);

            archive.append(buffer, { name: uniqueName });
          } catch (fileErr: unknown) {
            const displayFileName = fileName !== "unresolved_name" ? ` (nama: ${fileName})` : "";
            const message = fileErr instanceof Error ? fileErr.message : String(fileErr);
            errorsLog.push(`[${id}]${displayFileName} — Error: ${message}`);
          }
        }

        // D. Append _errors.txt if any errors occurred
        if (errorsLog.length > 0) {
          const errorText = errorsLog.join("\n") + "\n";
          archive.append(errorText, { name: "_errors.txt" });
        }

        await archive.finalize();
      } catch (err) {
        console.error("Error writing files to archive:", err);
        archive.destroy();
      }
    })();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const webStream = Readable.toWeb(archive as any) as ReadableStream;
    return new Response(webStream, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": 'attachment; filename="gdrive-files.zip"',
      },
    });
  } catch (error: unknown) {
    console.error("General error in download route:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
