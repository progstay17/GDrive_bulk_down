"use client";

import React from "react";

export default function Footer() {
  return (
    <footer className="mt-20 py-8 px-6 border-t border-slate-200 dark:border-navy-900 bg-slate-50/50 dark:bg-navy-950/20 text-center text-slate-400 dark:text-navy-500 text-xs transition-colors duration-300">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          &copy; {new Date().getFullYear()} AIT Drive Downloader. All rights reserved.
        </div>
        <div className="flex items-center gap-4 text-slate-400 dark:text-navy-500 font-medium">
          <span>Powered by Next.js &amp; Archiver</span>
        </div>
      </div>
    </footer>
  );
}
