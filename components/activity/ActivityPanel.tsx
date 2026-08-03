"use client";

import React from "react";

export interface ActivityEvent {
  id: string;
  type: "info" | "success" | "warning" | "error";
  title: string;
  description: string;
  timestamp: string;
}

interface ActivityPanelProps {
  events: ActivityEvent[];
}

export default function ActivityPanel({ events }: ActivityPanelProps) {
  const getIcon = (type: ActivityEvent["type"]) => {
    switch (type) {
      case "success":
        return (
          <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-900/30">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        );
      case "warning":
        return (
          <div className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border border-amber-200/50 dark:border-amber-900/30">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
        );
      case "error":
        return (
          <div className="p-1.5 rounded-lg bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 border border-red-200/50 dark:border-red-900/30">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 border border-blue-200/50 dark:border-blue-900/30">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
    }
  };

  return (
    <div className="bg-white dark:bg-navy-950 rounded-2xl border border-slate-200 dark:border-navy-900 p-6 shadow-sm transition-colors duration-300">
      <h3 className="text-sm font-bold text-slate-800 dark:text-navy-100 uppercase tracking-wider mb-4">
        Activity Workspace Log
      </h3>

      {events.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center text-slate-400 dark:text-navy-600">
          <svg className="w-8 h-8 opacity-60 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="text-xs">No workspace activities reported yet.</span>
        </div>
      ) : (
        <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
          {events.map((event) => (
            <div key={event.id} className="flex gap-3 items-start text-xs border-b border-slate-50 dark:border-navy-900/40 pb-3 last:border-0 last:pb-0">
              {getIcon(event.type)}

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-slate-800 dark:text-navy-100 truncate">
                    {event.title}
                  </span>
                  <span className="text-[10px] text-slate-400 dark:text-navy-500 whitespace-nowrap">
                    {event.timestamp}
                  </span>
                </div>
                <p className="text-slate-500 dark:text-navy-400 mt-1 truncate">
                  {event.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
