"use client";

import React from "react";
import ThemeToggle from "../ui/ThemeToggle";

interface HeaderProps {
  enableOAuth: boolean;
  isLoggedIn: boolean;
  userName?: string;
  userEmail?: string;
  onLogout: () => void;
}

export default function Header({
  enableOAuth,
  isLoggedIn,
  userName,
  userEmail,
  onLogout,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-white/80 dark:bg-navy-950/80 border-b border-slate-200/80 dark:border-navy-900/80 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand / Logo */}
        <div className="flex items-center gap-2">
          <span className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white font-sans">
            AIT
          </span>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400">
            Drive
          </span>
        </div>

        {/* Right Nav Options */}
        <div className="flex items-center gap-4">
          {/* GitHub Link */}
          <a
            href="https://github.com/progstay17/GDrive_bulk_down"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 text-slate-600 dark:text-navy-300 hover:text-blue-600 dark:hover:text-blue-400 transition"
            aria-label="View source on GitHub"
          >
            <svg
              viewBox="0 0 24 24"
              className="w-5 h-5 fill-current"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0012 2z" />
            </svg>
          </a>

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* OAuth block */}
          {enableOAuth && (
            <div className="flex items-center gap-2 border-l border-slate-200 dark:border-navy-800 pl-4">
              {isLoggedIn ? (
                <div className="flex items-center gap-3">
                  <div className="hidden sm:block text-right">
                    <p className="text-xs font-semibold text-slate-800 dark:text-navy-100 leading-none">
                      {userName || "Google User"}
                    </p>
                    <p className="text-[10px] text-slate-500 dark:text-navy-400 leading-none mt-1">
                      {userEmail}
                    </p>
                  </div>
                  <button
                    onClick={onLogout}
                    className="bg-red-50 dark:bg-red-950/20 hover:bg-red-100 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/50 text-xs font-semibold py-1.5 px-3 rounded-lg transition"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <a
                  href="/api/auth/login"
                  className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold py-2 px-3 rounded-lg shadow-sm hover:shadow transition"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M12.24 10.285V13.4h6.887c-.275 1.565-1.88 4.604-6.887 4.604-4.33 0-7.866-3.577-7.866-8s3.536-8 7.866-8c2.46 0 4.105 1.025 5.047 1.926l2.427-2.334C17.955 2.192 15.34 1 12.24 1 5.92 1 12s4.92 11 11.24 11c6.59 0 11.01-4.604 11.01-11 0-.743-.08-1.32-.175-1.715H12.24z" />
                  </svg>
                  <span className="hidden sm:inline">Google Auth</span>
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
