"use client";

import React from "react";

export type TimelineStage = "idle" | "analyze" | "permissions" | "metadata" | "packaging" | "compression" | "ready";

interface ProgressTimelineProps {
  currentStage: TimelineStage;
}

interface StageConfig {
  key: TimelineStage;
  label: string;
  description: string;
}

const STAGES: StageConfig[] = [
  {
    key: "analyze",
    label: "Analyze",
    description: "Validating input URLs and extracting file identifiers locally.",
  },
  {
    key: "permissions",
    label: "Permissions",
    description: "Verifying Google Drive API access & validating scopes.",
  },
  {
    key: "metadata",
    label: "Metadata",
    description: "Fetching filenames, MIME-types, and sizing details from Google.",
  },
  {
    key: "packaging",
    label: "Packaging",
    description: "Aggregating individual files into server streams.",
  },
  {
    key: "compression",
    label: "Compression",
    description: "Compressing the payloads into high-level ZIP structures.",
  },
  {
    key: "ready",
    label: "Ready",
    description: "Package compression finalized. Asset is ready for transfer.",
  },
];

export default function ProgressTimeline({ currentStage }: ProgressTimelineProps) {
  const getStageIndex = (stage: TimelineStage) => {
    if (stage === "idle") return -1;
    return STAGES.findIndex((s) => s.key === stage);
  };

  const currentIndex = getStageIndex(currentStage);

  return (
    <div className="bg-white dark:bg-navy-950 rounded-2xl border border-slate-200 dark:border-navy-900 p-6 shadow-sm transition-colors duration-300">
      <h3 className="text-sm font-bold text-slate-800 dark:text-navy-100 uppercase tracking-wider mb-6">
        Progress Timeline
      </h3>

      <div className="relative pl-6 space-y-6">
        {/* Connection line */}
        <div className="absolute top-1.5 bottom-1.5 left-[11px] w-[2px] bg-slate-100 dark:bg-navy-900" />

        {STAGES.map((stage, index) => {
          const isCompleted = index < currentIndex;
          const isActive = index === currentIndex;

          let dotClass = "";
          let textClass = "";

          if (isCompleted) {
            dotClass = "bg-blue-600 border-blue-600 text-white ring-4 ring-blue-500/10";
            textClass = "text-slate-900 dark:text-navy-100";
          } else if (isActive) {
            dotClass = "bg-white dark:bg-navy-950 border-blue-600 text-blue-600 ring-4 ring-blue-500/20";
            textClass = "text-blue-600 dark:text-blue-400 font-medium";
          } else {
            dotClass = "bg-slate-50 dark:bg-navy-900 border-slate-200 dark:border-navy-800 text-slate-300 dark:text-navy-700";
            textClass = "text-slate-400 dark:text-navy-600";
          }

          return (
            <div key={stage.key} className="relative flex gap-4 items-start group">
              {/* Dot indicator */}
              <span
                className={`absolute left-[-21px] top-1.5 w-[12px] h-[12px] rounded-full border-2 transition-all duration-300 ${dotClass}`}
              />

              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className={`text-sm font-semibold transition-colors duration-300 ${textClass}`}>
                    {stage.label}
                  </h4>
                  {isActive && (
                    <span className="flex h-1.5 w-1.5 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-blue-500"></span>
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-navy-400 mt-1 leading-relaxed">
                  {stage.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
