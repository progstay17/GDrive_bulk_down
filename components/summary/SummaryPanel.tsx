"use client";

import React from "react";
import { useAnimatedCounter } from "../ui/useAnimatedCounter";

interface SummaryData {
  estimatedZipSize?: string;
  imagesCount?: number | string;
  videosCount?: number | string;
  documentsCount?: number | string;
  publicFilesCount?: number | string;
  privateFilesCount?: number | string;
}

interface SummaryPanelProps {
  totalLinks: number;
  validFilesCount: number;
  invalidLinksCount: number;
  duplicateLinksCount: number;
  loading: boolean;
  serverData?: SummaryData;
}

export default function SummaryPanel({
  totalLinks,
  validFilesCount,
  invalidLinksCount,
  duplicateLinksCount,
  loading,
  serverData = {},
}: SummaryPanelProps) {
  const isAnalyzing = loading;

  // Utilize our custom high performance animated counters!
  const animatedTotal = useAnimatedCounter(totalLinks, 800);
  const animatedValid = useAnimatedCounter(validFilesCount, 800);
  const animatedDuplicates = useAnimatedCounter(duplicateLinksCount, 800);
  const animatedInvalid = useAnimatedCounter(invalidLinksCount, 800);

  // Safely parse server data metrics for counters
  const animatedImages = useAnimatedCounter(
    typeof serverData.imagesCount === "number" ? serverData.imagesCount : 0,
    800
  );
  const animatedVideos = useAnimatedCounter(
    typeof serverData.videosCount === "number" ? serverData.videosCount : 0,
    800
  );
  const animatedDocs = useAnimatedCounter(
    typeof serverData.documentsCount === "number" ? serverData.documentsCount : 0,
    800
  );
  const animatedPublic = useAnimatedCounter(
    typeof serverData.publicFilesCount === "number" ? serverData.publicFilesCount : 0,
    800
  );
  const animatedPrivate = useAnimatedCounter(
    typeof serverData.privateFilesCount === "number" ? serverData.privateFilesCount : 0,
    800
  );

  const renderMetric = (
    label: string,
    value: string | number,
    requiresBackend: boolean = false
  ) => {
    return (
      <div className="flex items-center justify-between py-2.5 border-b border-slate-100 dark:border-navy-900/50 last:border-0 text-xs transition-colors duration-300">
        <span className="text-slate-500 dark:text-navy-400 font-medium">{label}</span>
        {requiresBackend && isAnalyzing && !value ? (
          <span className="h-4 w-16 bg-slate-100 dark:bg-navy-900 animate-pulse rounded" />
        ) : (
          <span className="font-semibold text-slate-800 dark:text-navy-100 tabular-nums">
            {value}
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-navy-950 rounded-2xl border border-slate-200 dark:border-navy-900 p-6 shadow-sm flex flex-col h-full justify-between transition-colors duration-300">
      <div>
        <h3 className="text-sm font-bold text-slate-800 dark:text-navy-100 uppercase tracking-wider mb-4">
          Live Summary
        </h3>

        <div className="space-y-1">
          {renderMetric("Total Links Entered", animatedTotal)}
          {renderMetric("Valid Files Detected", animatedValid)}
          {renderMetric("Duplicate Links", animatedDuplicates)}
          {renderMetric("Invalid Links / Strings", animatedInvalid)}

          <div className="my-4 border-t border-slate-200 dark:border-navy-900" />

          {renderMetric(
            "Estimated ZIP Size",
            serverData.estimatedZipSize || (isAnalyzing ? "Analyzing..." : "—"),
            true
          )}
          {renderMetric(
            "Images",
            totalLinks > 0 ? animatedImages : "—",
            true
          )}
          {renderMetric(
            "Videos",
            totalLinks > 0 ? animatedVideos : "—",
            true
          )}
          {renderMetric(
            "Documents",
            totalLinks > 0 ? animatedDocs : "—",
            true
          )}
          {renderMetric(
            "Public Files",
            isAnalyzing ? "Querying..." : totalLinks > 0 ? animatedPublic : "—",
            true
          )}
          {renderMetric(
            "Private Files",
            isAnalyzing ? "Validating..." : totalLinks > 0 ? animatedPrivate : "—",
            true
          )}
        </div>
      </div>

      {isAnalyzing && (
        <div className="mt-4 p-3 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100/50 dark:border-blue-900/40 rounded-xl flex items-center gap-2.5 transition-all">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
          </span>
          <span className="text-[11px] font-medium text-blue-700 dark:text-blue-300 animate-pulse">
            AI is checking remote items...
          </span>
        </div>
      )}
    </div>
  );
}
