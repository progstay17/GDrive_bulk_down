"use client";

import React from "react";

interface SuccessCardProps {
  totalFiles: number;
  zipSize?: string;
  onDownloadAgain: () => void;
  downloadUrl?: string;
}

export default function SuccessCard({
  totalFiles,
  zipSize = "Calculating...",
  onDownloadAgain,
  downloadUrl,
}: SuccessCardProps) {
  const handleDownload = () => {
    if (downloadUrl) {
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = "gdrive-files.zip";
      document.body.appendChild(a);
      a.click();
      a.remove();
    } else {
      onDownloadAgain();
    }
  };

  return (
    <div className="bg-emerald-50/50 dark:bg-emerald-950/10 border border-emerald-200 dark:border-emerald-900/50 rounded-2xl p-6 shadow-sm transition-colors duration-300">
      <div className="flex items-start gap-4">
        <div className="p-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl border border-emerald-500/20 shrink-0">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>

        <div className="flex-1">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            ZIP Archive Built Successfully
          </h3>
          <p className="text-xs text-slate-500 dark:text-navy-400 mt-1 leading-relaxed">
            Your custom package has been packed. Unresolved files, private items, or folders are safely cataloged in the <code className="font-semibold bg-emerald-500/10 px-1 py-0.5 rounded">_errors.txt</code> log within the archive.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 my-4 p-4 rounded-xl bg-white dark:bg-navy-950 border border-slate-100 dark:border-navy-900/50">
            <div>
              <span className="block text-[10px] text-slate-400 dark:text-navy-500 uppercase tracking-wider font-semibold">
                Total Files Packed
              </span>
              <span className="text-lg font-bold text-slate-800 dark:text-navy-100">
                {totalFiles}
              </span>
            </div>
            <div>
              <span className="block text-[10px] text-slate-400 dark:text-navy-500 uppercase tracking-wider font-semibold">
                Archived ZIP Size
              </span>
              <span className="text-lg font-bold text-slate-800 dark:text-navy-100">
                {zipSize}
              </span>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <span className="block text-[10px] text-slate-400 dark:text-navy-500 uppercase tracking-wider font-semibold">
                Package Status
              </span>
              <span className="text-xs inline-flex items-center gap-1.5 font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Ready to stream
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleDownload}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs py-2 px-4 rounded-lg transition shadow-sm hover:shadow"
              type="button"
            >
              Download ZIP
            </button>
            <button
              onClick={onDownloadAgain}
              className="bg-slate-100 dark:bg-navy-900 hover:bg-slate-200 dark:hover:bg-navy-850 text-slate-700 dark:text-navy-200 font-semibold text-xs py-2 px-4 rounded-lg transition border border-slate-200 dark:border-navy-800"
              type="button"
            >
              Repack Package
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
