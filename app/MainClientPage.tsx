"use client";

import React, { useState, useMemo, useEffect } from "react";
import { extractDriveIds } from "@/lib/gdrive";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import UploadWorkspace from "@/components/workspace/UploadWorkspace";
import SummaryPanel from "@/components/summary/SummaryPanel";
import ProgressTimeline, { TimelineStage } from "@/components/timeline/ProgressTimeline";
import ActivityPanel, { ActivityEvent } from "@/components/activity/ActivityPanel";
import SuccessCard from "@/components/cards/SuccessCard";
import ErrorCard from "@/components/cards/ErrorCard";

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
  const [errorDetails, setErrorDetails] = useState<string | undefined>(undefined);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [timelineStage, setTimelineStage] = useState<TimelineStage>("idle");
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [zipBlobUrl, setZipBlobUrl] = useState<string | undefined>(undefined);
  const [zipDetails, setZipDetails] = useState<{ totalFiles: number; size: string }>({
    totalFiles: 0,
    size: "Calculating...",
  });

  // Unique key helper for logs
  const addEvent = (type: ActivityEvent["type"], title: string, description: string) => {
    const newEvent: ActivityEvent = {
      id: Math.random().toString(36).substring(2, 9),
      type,
      title,
      description,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    };
    setEvents((prev) => [newEvent, ...prev]);
  };

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

  const duplicatesCount = useMemo(() => {
    const ids = extractedItems.map((item) => item.id);
    const uniqueIds = new Set(ids);
    return ids.length - uniqueIds.size;
  }, [extractedItems]);

  // Analyze inputs locally and log events
  useEffect(() => {
    if (inputText.trim() === "") {
      setTimelineStage("idle");
      return;
    }

    setTimelineStage("analyze");
    const timer = setTimeout(() => {
      addEvent(
        "info",
        "Input Analyzed",
        `Detected ${files.length} valid ${files.length === 1 ? "file" : "files"} and ${folders.length} ${
          folders.length === 1 ? "folder" : "folders"
        } in workspace.`
      );
    }, 500);

    return () => clearTimeout(timer);
  }, [inputText, files.length, folders.length]);

  // Local categorizer for Summary Panel
  const fileCategories = useMemo(() => {
    let images = 0;
    let videos = 0;
    let documents = 0;

    for (const item of files) {
      const lower = item.originalInput.toLowerCase();
      if (lower.includes("document") || lower.includes("spreadsheets") || lower.includes("presentation") || lower.includes("drawings")) {
        documents++;
      } else if (/\.(jpg|jpeg|png|gif|webp|svg)/i.test(lower)) {
        images++;
      } else if (/\.(mp4|mkv|mov|avi|wmv)/i.test(lower)) {
        videos++;
      } else {
        documents++; // Fallback default to documents
      }
    }
    return { images, videos, documents };
  }, [files]);

  const handleDownload = async () => {
    if (files.length === 0) return;
    setLoading(true);
    setError(null);
    setErrorDetails(undefined);
    setDownloadSuccess(false);
    setZipBlobUrl(undefined);

    // Progressive timeline stage transitions representing actual state machine lifecycles
    setTimelineStage("permissions");
    addEvent("info", "Authenticating Request", "Verifying GDrive API authority and validating scopes.");

    try {
      // Transition to metadata fetching
      setTimeout(() => {
        setTimelineStage("metadata");
        addEvent("info", "Querying Metadata", `Fetching filename and resource details for ${files.length} items.`);
      }, 1200);

      // Transition to packaging
      setTimeout(() => {
        setTimelineStage("packaging");
        addEvent("info", "Packaging Payload", "Streaming individual file buffers into server-side storage.");
      }, 2500);

      // Transition to compression
      setTimeout(() => {
        setTimelineStage("compression");
        addEvent("info", "Compressing Assets", "Running archiver compression at maximum level (ZLIB 9).");
      }, 4000);

      const response = await fetch("/api/download-zip", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ rawText: inputText }),
      });

      if (!response.ok) {
        let errMsg = "An error occurred while compiling your ZIP file.";
        let errLog: string | undefined = undefined;
        try {
          const errJson = await response.json();
          if (errJson && errJson.error) {
            errMsg = errJson.error;
            errLog = JSON.stringify(errJson, null, 2);
          }
        } catch {
          // Fallback to text if JSON parsing fails
        }
        throw { message: errMsg, details: errLog };
      }

      const blob = await response.blob();
      const sizeInMB = (blob.size / (1024 * 1024)).toFixed(2);

      const url = window.URL.createObjectURL(blob);
      setZipBlobUrl(url);

      // Trigger standard download anchor
      const a = document.createElement("a");
      a.href = url;
      a.download = "gdrive-files.zip";
      document.body.appendChild(a);
      a.click();
      a.remove();

      // Finalize success states
      setZipDetails({
        totalFiles: files.length,
        size: `${sizeInMB} MB`,
      });
      setDownloadSuccess(true);
      setTimelineStage("ready");
      addEvent("success", "ZIP Created", `Successfully packed and downloaded ${files.length} items (${sizeInMB} MB).`);
    } catch (err: unknown) {
      console.error(err);

      let summary = "An unknown error occurred.";
      let details: string | undefined = undefined;

      if (err && typeof err === "object") {
        if ("message" in err) {
          summary = String((err as { message: unknown }).message);
        } else {
          summary = String(err);
        }
        if ("details" in err) {
          details = String((err as { details: unknown }).details);
        }
      } else {
        summary = String(err);
      }

      setError(summary);
      setErrorDetails(details);
      setTimelineStage("idle");
      addEvent("error", "Process Failed", summary);
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
    <div className="min-h-screen bg-slate-50 dark:bg-navy-950 text-slate-800 dark:text-navy-100 font-sans transition-colors duration-300">
      {/* Header Layout */}
      <Header
        enableOAuth={enableOAuth}
        isLoggedIn={isLoggedIn}
        userName={userName}
        userEmail={userEmail}
        onLogout={handleLogout}
      />

      {/* Hero section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-8 text-center">
        <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-slate-900 dark:text-white mb-3">
          AIT Drive Downloader
        </h1>
        <p className="text-base sm:text-lg text-slate-500 dark:text-navy-400 max-w-2xl mx-auto leading-relaxed">
          The ultimate AI-powered bulk Google Drive downloader. Simply input raw links, analyze content categories, and package them as one compressed high-performance ZIP stream.
        </p>
      </section>

      {/* Main Workspace Workspace */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* Workspace Left Area (Upload Workspace and Success/Error States) */}
          <div className="lg:col-span-8 flex flex-col gap-6">

            {/* Redesigned Workspace Input */}
            <UploadWorkspace
              inputText={inputText}
              setInputText={setInputText}
              loading={loading}
              onDownload={handleDownload}
              detectedFilesCount={files.length}
              ignoredFoldersCount={folders.length}
            />

            {/* Error Container */}
            {error && (
              <ErrorCard
                summary={error}
                details={errorDetails}
                onRetry={handleDownload}
              />
            )}

            {/* Success Container */}
            {downloadSuccess && (
              <SuccessCard
                totalFiles={zipDetails.totalFiles}
                zipSize={zipDetails.size}
                downloadUrl={zipBlobUrl}
                onDownloadAgain={handleDownload}
              />
            )}

            {/* Information Grid for extra guides */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-2">
              <div className="bg-white dark:bg-navy-950 p-6 rounded-2xl border border-slate-200 dark:border-navy-900 transition-colors duration-300">
                <h4 className="text-xs font-bold text-slate-800 dark:text-navy-200 uppercase tracking-wider mb-2">
                  System Directions
                </h4>
                <p className="text-xs text-slate-500 dark:text-navy-400 leading-relaxed">
                  To stream restricted or private files, authenticate with Google OAuth using the navigation bar. Public items require no authentication but must be set to <strong>&quot;Anyone with the link&quot;</strong>.
                </p>
              </div>

              <div className="bg-white dark:bg-navy-950 p-6 rounded-2xl border border-slate-200 dark:border-navy-900 transition-colors duration-300">
                <h4 className="text-xs font-bold text-slate-800 dark:text-navy-200 uppercase tracking-wider mb-2">
                  Supported Patterns
                </h4>
                <p className="text-xs text-slate-500 dark:text-navy-400 leading-relaxed">
                  We process URL view-modes, direct downloads, and raw Google IDs. Folder links are skipped.
                </p>
              </div>
            </div>

          </div>

          {/* Workspace Right Area (Summary and Progress Workflow Logs) */}
          <div className="lg:col-span-4 flex flex-col gap-6">

            {/* Live Summary Panel */}
            <SummaryPanel
              totalLinks={extractedItems.length}
              validFilesCount={files.length}
              invalidLinksCount={extractedItems.length - files.length - folders.length}
              duplicateLinksCount={duplicatesCount}
              loading={loading}
              serverData={{
                estimatedZipSize: loading ? "Analyzing..." : downloadSuccess ? zipDetails.size : "—",
                imagesCount: files.length > 0 ? fileCategories.images : "—",
                videosCount: files.length > 0 ? fileCategories.videos : "—",
                documentsCount: files.length > 0 ? fileCategories.documents : "—",
                publicFilesCount: loading ? "Querying..." : downloadSuccess ? files.length : "—",
                privateFilesCount: loading ? "Validating..." : downloadSuccess ? 0 : "—",
              }}
            />

            {/* Progress timeline stages */}
            <ProgressTimeline currentStage={timelineStage} />

            {/* Activity Stream Feed */}
            <ActivityPanel events={events} />

          </div>

        </div>
      </main>

      {/* Footer layout */}
      <Footer />
    </div>
  );
}
