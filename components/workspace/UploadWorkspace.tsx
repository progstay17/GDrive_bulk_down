"use client";

import React, { useState, DragEvent } from "react";
import AIStatus from "./AIStatus";
import { TimelineStage } from "../timeline/ProgressTimeline";

interface UploadWorkspaceProps {
  inputText: string;
  setInputText: (val: string) => void;
  loading: boolean;
  onDownload: () => void;
  detectedFilesCount: number;
  ignoredFoldersCount: number;
  currentStage: TimelineStage;
}

export default function UploadWorkspace({
  inputText,
  setInputText,
  loading,
  onDownload,
  detectedFilesCount,
  ignoredFoldersCount,
  currentStage,
}: UploadWorkspaceProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isPasted, setIsPasted] = useState(false);
  const [isDropped, setIsDropped] = useState(false);

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);

    // Smooth drop confirmation pulse
    setIsDropped(true);
    setTimeout(() => setIsDropped(false), 800);

    const text = e.dataTransfer.getData("text");
    if (text) {
      setInputText(inputText ? `${inputText}\n${text}` : text);
    }
  };

  const handleClear = () => {
    setInputText("");
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
  };

  const handlePaste = () => {
    // Subtle temporary paste pulse trigger
    setIsPasted(true);
    setTimeout(() => setIsPasted(false), 600);
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative w-full rounded-2xl border p-6 transition-all duration-500 ease-out ${
        isDragOver
          ? "border-blue-500 bg-blue-50/30 dark:bg-blue-950/5 shadow-lg scale-[1.01] -translate-y-0.5"
          : isDropped
          ? "border-emerald-500 bg-emerald-50/10 dark:bg-emerald-950/5 shadow-md"
          : "border-slate-200 dark:border-navy-900 bg-white dark:bg-navy-950 shadow-sm hover:border-blue-500/30 dark:hover:border-blue-500/30 hover:shadow-md"
      }`}
    >
      {/* Workspace Header with AI Status integration */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
        <label
          htmlFor="links-input"
          className="text-sm font-bold text-slate-800 dark:text-navy-100 flex items-center gap-2"
        >
          <span>Upload Workspace</span>
          <span className="text-xs font-normal text-slate-400 dark:text-navy-500 hidden sm:inline">
            (Paste, drag & drop, or input file IDs)
          </span>
        </label>

        {/* Dynamic AI Status with smooth layout styling */}
        <div className="flex items-center gap-3 justify-between sm:justify-end">
          <AIStatus currentStage={currentStage} />
          {inputText && (
            <button
              onClick={handleClear}
              disabled={loading}
              className="text-xs font-semibold text-slate-400 dark:text-navy-500 hover:text-red-500 dark:hover:text-red-400 active:scale-95 transition-all disabled:opacity-50"
              type="button"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      <div className="relative">
        <textarea
          id="links-input"
          rows={8}
          onPaste={handlePaste}
          className={`w-full bg-slate-50 dark:bg-navy-900/40 border border-slate-200 dark:border-navy-800/80 rounded-xl p-4 font-mono text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all duration-300 resize-none text-slate-800 dark:text-navy-100 placeholder-slate-400 dark:placeholder-navy-600 disabled:opacity-60 ${
            isPasted ? "ring-4 ring-blue-500/20 bg-blue-50/10 dark:bg-blue-950/5" : ""
          }`}
          placeholder="Paste Google Drive URLs here...&#10;e.g., https://drive.google.com/file/d/1abcXYZ.../view"
          value={inputText}
          onChange={handleTextChange}
          disabled={loading}
        />

        {!inputText && (
          <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center text-center p-4">
            <svg
              className="w-8 h-8 text-slate-300 dark:text-navy-700 mb-2 transition-transform duration-300 group-hover:scale-110"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.5"
                d="M9 13h6m-3-3v6m-9 1V4a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"
              />
            </svg>
            <p className="text-xs text-slate-400 dark:text-navy-500">
              Drag & drop links or text files here
            </p>
          </div>
        )}
      </div>

      {/* Counters & Info */}
      <div className="flex flex-wrap items-center justify-between gap-4 mt-4 pt-4 border-t border-slate-100 dark:border-navy-900/50 text-xs">
        <div className="flex items-center gap-3">
          <span className="text-slate-500 dark:text-navy-400">
            Characters: <strong className="text-slate-700 dark:text-navy-200 font-medium">{inputText.length}</strong>
          </span>
          <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-navy-800" />
          <span className="text-slate-500 dark:text-navy-400">
            Detected:{" "}
            <strong className="text-blue-600 dark:text-blue-400 font-semibold">
              {detectedFilesCount} {detectedFilesCount === 1 ? "file" : "files"}
            </strong>
          </span>
        </div>

        {ignoredFoldersCount > 0 && (
          <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-semibold animate-pulse">
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>{ignoredFoldersCount} folders ignored</span>
          </div>
        )}
      </div>

      <div className="mt-6">
        <button
          onClick={onDownload}
          disabled={detectedFilesCount === 0 || loading}
          className="w-full bg-blue-600 hover:bg-blue-700 active:scale-[0.98] disabled:bg-slate-100 dark:disabled:bg-navy-900/50 disabled:text-slate-400 dark:disabled:text-navy-600 text-white font-bold py-3.5 px-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 flex items-center justify-center gap-2 focus:outline-none focus:ring-4 focus:ring-blue-500/20 disabled:scale-100 disabled:cursor-not-allowed group"
          type="button"
        >
          {loading ? (
            <>
              <svg
                className="animate-spin h-5 w-5 text-current"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              <span>Assembling ZIP Package...</span>
            </>
          ) : (
            <>
              <svg
                className="w-5 h-5 text-white/90 group-hover:translate-y-0.5 transition-transform duration-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2.5"
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
              <span>Download ZIP Package</span>
            </>
          )}
        </button>
        <p className="text-[11px] text-slate-400 dark:text-navy-500 text-center mt-3 leading-relaxed">
          Google-native formats are exported instantly to DOCX/XLSX/PPTX formats.
        </p>
      </div>
    </div>
  );
}
