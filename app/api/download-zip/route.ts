import { NextResponse } from "next/server";
import archiver from "archiver";
import { Readable } from "stream";
import pLimit from "p-limit";
import { extractDriveIds, GOOGLE_NATIVE_MAPPING } from "@/lib/gdrive";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// How many files to download from Google Drive concurrently. Higher = faster,
// but raises the chance of hitting Google's rate limit. Start conservative;
// lower this if 403s start showing up in _errors.txt for a batch that used
// to work fine sequentially.
const CONCURRENCY = 5;


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
    // level 0 = store only, no compression. For batches dominated by already-
    // compressed media (mp3/m4a/mp4), level 9 burns a lot of CPU time for
    // near-zero size savings — this is purely a speed win for this use case.
    const archive = archiver("zip", { zlib: { level: 0 } });

    // Handle archiver errors
    archive.on("error", (err: Error) => {
      console.error("Archiver error:", err);
    });

    // Wait for archiver to actually finish processing an entry before moving on.
    // archive.append() is fire-and-forget internally — without this, a failure
    // mid-stream (network hiccup, bad encoding, etc.) silently corrupts the zip
    // instead of being caught and logged to _errors.txt.
    function appendAndWait(
      source: Readable | Buffer | string,
      name: string
    ): Promise<void> {
      return new Promise((resolve, reject) => {
        const onEntry = (entry: { name: string }) => {
          if (entry.name === name) {
            archive.off("entry", onEntry);
            archive.off("error", onError);
            resolve();
          }
        };
        const onError = (err: Error) => {
          archive.off("entry", onEntry);
          archive.off("error", onError);
          reject(err);
        };
        archive.on("entry", onEntry);
        archive.on("error", onError);
        archive.append(source, { name });
      });
    }

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
        const limit = pLimit(CONCURRENCY);

        await Promise.all(
          extracted.map((item) =>
            limit(async () => {
              const { id, isFolder } = item;

              // Handle folder scenario (explicitly unsupported)
              if (isFolder) {
                errorsLog.push(`[${id}] (nama: folder) — Error: ini folder, bukan file — belum didukung`);
                return;
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

                if (!downloadRes.body) {
                  throw new Error("Response body kosong dari Google Drive API");
                }

                // Filename dedup MUST happen synchronously right before appending,
                // never earlier — this is the only point in the parallel pipeline
                // where two concurrent tasks could race on the same name, and
                // getUniqueFilename() itself is synchronous so this is safe.
                const uniqueName = getUniqueFilename(finalFileName);

                // Stream directly instead of buffering the whole file into memory
                // first — avoids high RAM usage and lets large files start writing
                // into the zip immediately instead of waiting for the full
                // download to finish.
                const nodeStream = Readable.fromWeb(
                  downloadRes.body as unknown as import("stream/web").ReadableStream
                );

                // appendAndWait still serializes actual writes into the archive
                // one at a time internally (archiver itself is not safe for
                // concurrent .append() calls), but multiple files' network
                // downloads now happen concurrently while only the final
                // append-to-zip step is effectively queued.
                await appendAndWait(nodeStream, uniqueName);
              } catch (fileErr: unknown) {
                const displayFileName = fileName !== "unresolved_name" ? ` (nama: ${fileName})` : "";
                const message = fileErr instanceof Error ? fileErr.message : String(fileErr);
                errorsLog.push(`[${id}]${displayFileName} — Error: ${message}`);
              }
            })
          )
        );

        // D. Append _errors.txt if any errors occurred
        if (errorsLog.length > 0) {
          const errorText = errorsLog.join("\n") + "\n";
          await appendAndWait(errorText, "_errors.txt");
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
