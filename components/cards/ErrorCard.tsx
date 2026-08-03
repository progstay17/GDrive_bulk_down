"use client";

import React, { useState } from "react";

interface ErrorCardProps {
  summary: string;
  details?: string;
  onRetry: () => void;
}

export default function ErrorCard({
  summary,
  details,
  onRetry,
}: ErrorCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-red-50/50 dark:bg-red-950/10 border border-red-200 dark:border-red-900/50 rounded-2xl p-6 shadow-sm transition-colors duration-300">
      <div className="flex items-start gap-4">
        <div className="p-2 bg-red-500/10 text-red-600 dark:text-red-400 rounded-xl border border-red-500/20 shrink-0">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Download Encountered an Error
          </h3>
          <p className="text-xs text-red-700 dark:text-red-400 mt-1 font-semibold">
            {summary}
          </p>

          {details && (
            <div className="mt-3">
              <button
                onClick={() => setExpanded(!expanded)}
                className="text-xs font-semibold text-slate-500 dark:text-navy-400 hover:text-slate-800 dark:hover:text-navy-200 flex items-center gap-1 focus:outline-none"
                type="button"
              >
                <span>{expanded ? "Hide technical logs" : "Show technical logs"}</span>
                <svg
                  className={`w-3.5 h-3.5 transform transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {expanded && (
                <pre className="mt-2 p-3 bg-slate-900 text-slate-100 font-mono text-[11px] rounded-xl overflow-x-auto max-h-[150px] leading-relaxed border border-slate-800">
                  {details}
                </pre>
              )}
            </div>
          )}

          <div className="mt-4 flex items-center gap-3">
            <button
              onClick={onRetry}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold text-xs py-2 px-4 rounded-lg transition shadow-sm hover:shadow"
              type="button"
            >
              Retry Download
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
