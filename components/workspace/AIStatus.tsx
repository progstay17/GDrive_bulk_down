"use client";

import React, { useMemo } from "react";
import { TimelineStage } from "../timeline/ProgressTimeline";

interface AIStatusProps {
  currentStage: TimelineStage;
}

export default function AIStatus({ currentStage }: AIStatusProps) {
  const statusConfig = useMemo(() => {
    switch (currentStage) {
      case "analyze":
        return {
          text: "Analyzing Links",
          colorClass: "text-blue-500 dark:text-blue-400 bg-blue-500/10 border-blue-500/20",
          pingClass: "bg-blue-500",
        };
      case "permissions":
        return {
          text: "Checking Permissions",
          colorClass: "text-indigo-500 dark:text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
          pingClass: "bg-indigo-500",
        };
      case "metadata":
        return {
          text: "Checking Metadata",
          colorClass: "text-violet-500 dark:text-violet-400 bg-violet-500/10 border-violet-500/20",
          pingClass: "bg-violet-500",
        };
      case "packaging":
        return {
          text: "Packaging Files",
          colorClass: "text-purple-500 dark:text-purple-400 bg-purple-500/10 border-purple-500/20",
          pingClass: "bg-purple-500",
        };
      case "compression":
        return {
          text: "Generating ZIP",
          colorClass: "text-amber-500 dark:text-amber-400 bg-amber-500/10 border-amber-500/20",
          pingClass: "bg-amber-500",
        };
      case "ready":
        return {
          text: "Mission Complete",
          colorClass: "text-emerald-500 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
          pingClass: "bg-emerald-500",
        };
      default:
        return {
          text: "AI Ready",
          colorClass: "text-slate-500 dark:text-navy-400 bg-slate-500/10 border-slate-500/20 dark:border-navy-800",
          pingClass: "bg-slate-400 dark:bg-navy-500",
        };
    }
  }, [currentStage]);

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold tracking-wide transition-all duration-500 ${statusConfig.colorClass}`}
    >
      <span className="flex h-2 w-2 relative">
        {currentStage !== "idle" && currentStage !== "ready" && (
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${statusConfig.pingClass}`} />
        )}
        <span className={`relative inline-flex rounded-full h-2 w-2 ${statusConfig.pingClass}`} />
      </span>
      <span className="font-mono text-[11px] uppercase">{statusConfig.text}</span>
    </div>
  );
}
