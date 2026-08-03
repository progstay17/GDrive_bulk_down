"use client";

import React, { useState, useMemo } from "react";
import { extractDriveIds } from "@/lib/gdrive";

interface MainClientPageProps {
  enableOAuth: boolean;
  isLoggedIn: boolean;
  userName?: string;
  userEmail?: string;
}

export default function MainClientPage({
  enableOAuth,
  isLoggedIn,
  userName,
  userEmail,
}: MainClientPageProps) {
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  // Parse extracted items in real-time
  const extractedItems = useMemo(() => {
    return extractDriveIds(inputText);
  }, [inputText]);

  // Separate files and folders
  const files = useMemo(() => {
    return extractedItems.filter((item) => !item.isFolder);
  }, [extractedItems]);

  const folders = useMemo(() => {
    return extractedItems.filter((item) => item.isFolder);
  }, [extractedItems]);

  const handleDownload = async () => {
    if (files.length === 0) return;
    setLoading(true);
    setError(null);
    setDownloadSuccess(false);

    try {
      const response = await fetch("/api/download-zip", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ rawText: inputText }),
      });

      if (!response.ok) {
        let errMsg = "Terjadi kesalahan saat mengunduh ZIP.";
        try {
          const errJson = await response.json();
          if (errJson && errJson.error) {
            errMsg = errJson.error;
          }
        } catch {
          // Fallback to generic error
        }
        throw new Error(errMsg);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "gdrive-files.zip";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      setDownloadSuccess(true);
    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      window.location.reload();
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans">
      <header className="bg-white border-b border-slate-200 py-4 px-6 shadow-sm">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <svg
              className="w-8 h-8 text-blue-600"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM17 13l-5 5-5-5h3V9h4v4h3z" />
            </svg>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                GDrive Batch Zip Downloader
              </h1>
              <p className="text-xs text-slate-500">
                Unduh banyak file Google Drive sekaligus dalam satu ZIP aman
              </p>
            </div>
          </div>

          {enableOAuth && (
            <div className="flex items-center gap-3">
              {isLoggedIn ? (
                <div className="flex items-center gap-3 bg-slate-100 py-1.5 px-3 rounded-full border border-slate-200">
                  <div className="text-right">
                    <p className="text-xs font-semibold leading-none">{userName || "User Google"}</p>
                    <p className="text-[10px] text-slate-500 leading-none mt-0.5">{userEmail}</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="bg-white hover:bg-red-50 text-red-600 border border-slate-200 text-xs font-medium py-1 px-2.5 rounded-full transition"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <a
                  href="/api/auth/login"
                  className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold py-2 px-4 rounded-full shadow-sm transition"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12.24 10.285V13.4h6.887c-.275 1.565-1.88 4.604-6.887 4.604-4.33 0-7.866-3.577-7.866-8s3.536-8 7.866-8c2.46 0 4.105 1.025 5.047 1.926l2.427-2.334C17.955 2.192 15.34 1 12.24 1 5.92 1 1 5.92 1 12s4.92 11 11.24 11c6.59 0 11.01-4.604 11.01-11 0-.743-.08-1.32-.175-1.715H12.24z" />
                  </svg>
                  Login with Google (Private Files)
                </a>
              )}
            </div>
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10 grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left pane: Instructions and status */}
        <div className="md:col-span-1 flex flex-col gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h2 className="text-base font-bold text-slate-800 mb-3">Cara Menggunakan</h2>
            <ul className="space-y-3 text-sm text-slate-600">
              <li className="flex gap-2.5">
                <span className="flex items-center justify-center bg-blue-100 text-blue-700 font-bold text-xs w-5 h-5 rounded-full shrink-0">
                  1
                </span>
                <span>Paste satu atau banyak URL file Google Drive di area input. Format bebas (dipisah spasi, baris baru, atau tab).</span>
              </li>
              <li className="flex gap-2.5">
                <span className="flex items-center justify-center bg-blue-100 text-blue-700 font-bold text-xs w-5 h-5 rounded-full shrink-0">
                  2
                </span>
                <span>Pastikan status file adalah <b>&quot;Anyone with the link&quot; (Public)</b> jika tidak menggunakan login Google.</span>
              </li>
              <li className="flex gap-2.5">
                <span className="flex items-center justify-center bg-blue-100 text-blue-700 font-bold text-xs w-5 h-5 rounded-full shrink-0">
                  3
                </span>
                <span>Klik tombol <b>Download as ZIP</b>. Sistem akan mengunduh dan menyatukannya untuk Anda.</span>
              </li>
            </ul>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h2 className="text-base font-bold text-slate-800 mb-3">Format URL yang Didukung</h2>
            <div className="space-y-2 text-xs text-slate-600">
              <code className="block bg-slate-100 p-2 rounded border border-slate-200 font-mono">
                /file/d/[ID]/view
              </code>
              <code className="block bg-slate-100 p-2 rounded border border-slate-200 font-mono">
                /open?id=[ID]
              </code>
              <code className="block bg-slate-100 p-2 rounded border border-slate-200 font-mono">
                /uc?id=[ID]
              </code>
              <code className="block bg-slate-100 p-2 rounded border border-slate-200 font-mono">
                [Raw File ID]
              </code>
              <p className="text-[11px] text-amber-600 mt-2 font-medium">
                ⚠️ URL Folder Google Drive tidak didukung dan otomatis diabaikan.
              </p>
            </div>
          </div>
        </div>

        {/* Right/Middle pane: Input and actions */}
        <div className="md:col-span-2 flex flex-col gap-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-xl flex gap-3 shadow-sm">
              <svg
                className="w-5 h-5 text-red-600 shrink-0 mt-0.5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <div>
                <p className="font-semibold text-sm">Gagal Mengunduh</p>
                <p className="text-xs mt-1 text-red-700 whitespace-pre-line">{error}</p>
              </div>
            </div>
          )}

          {downloadSuccess && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl flex gap-3 shadow-sm">
              <svg
                className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <div>
                <p className="font-semibold text-sm">Proses Selesai</p>
                <p className="text-xs mt-1 text-emerald-700">
                  Arsip ZIP Anda berhasil diunduh! Jika terdapat file yang gagal (private/tidak didukung/folder), berkas <b>_errors.txt</b> telah otomatis disertakan di dalam ZIP untuk rincian kesalahan.
                </p>
              </div>
            </div>
          )}

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <label htmlFor="links-input" className="font-bold text-slate-800 text-sm">
                Masukkan Link Google Drive Anda:
              </label>
              <button
                onClick={() => {
                  setInputText("");
                  setDownloadSuccess(false);
                  setError(null);
                }}
                disabled={!inputText || loading}
                className="text-xs text-slate-500 hover:text-slate-800 font-semibold transition disabled:opacity-50"
              >
                Clear
              </button>
            </div>

            <textarea
              id="links-input"
              rows={8}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 font-mono text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition resize-none"
              placeholder="https://drive.google.com/file/d/1abcXYZ...&#10;https://drive.google.com/open?id=2defUVW...&#10;3ghiRST... (Raw File ID)"
              value={inputText}
              onChange={(e) => {
                setInputText(e.target.value);
                setDownloadSuccess(false);
              }}
              disabled={loading}
            />

            {/* real-time preview counters */}
            <div className="flex flex-wrap gap-2 text-xs">
              <div className="bg-blue-50 text-blue-800 py-1.5 px-3 rounded-lg border border-blue-100 flex items-center gap-1.5 font-semibold">
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                Terdeteksi: {files.length} file
              </div>

              {folders.length > 0 && (
                <div className="bg-amber-50 text-amber-800 py-1.5 px-3 rounded-lg border border-amber-100 flex items-center gap-1.5 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  Folder diabaikan: {folders.length} folder
                </div>
              )}
            </div>

            <p className="text-[11px] text-slate-500 italic">
              * Jika ada file privat/tidak didukung, file tersebut akan diabaikan dan daftar detail kesalahan akan disimpan ke dalam berkas <b>_errors.txt</b> di dalam file ZIP yang diunduh.
            </p>

            {/* submit action */}
            <button
              onClick={handleDownload}
              disabled={files.length === 0 || loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Menghasilkan ZIP...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2.5"
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                    />
                  </svg>
                  Download as ZIP
                </>
              )}
            </button>
          </div>
        </div>
      </main>

      <footer className="border-t border-slate-200 mt-16 py-6 px-6 bg-white text-center text-slate-400 text-xs">
        <div className="max-w-5xl mx-auto">
          &copy; {new Date().getFullYear()} GDrive Batch Zip Downloader. Powered by Next.js &amp; Archiver.
        </div>
      </footer>
    </div>
  );
}
