import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Analytics } from '@vercel/analytics/next';

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: {
    default: "AIT Drive Downloader | AI-powered bulk Google Drive downloader",
    template: "%s | AIT Drive Downloader",
  },
  description: "AI-powered bulk Google Drive downloader.",
  applicationName: "AIT Drive Downloader",
  metadataBase: new URL("https://github.com/progstay17/GDrive_bulk_down"),
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/icon.png", type: "image/png", sizes: "512x512" },
      { url: "/icon-192.png", type: "image/png", sizes: "192x192" },
    ],
    apple: [
      { url: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  openGraph: {
    title: "AIT Drive Downloader | AI-powered bulk Google Drive downloader",
    description: "AI-powered bulk Google Drive downloader.",
    url: "https://github.com/progstay17/GDrive_bulk_down",
    siteName: "AIT Drive Downloader",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/icon.png",
        width: 512,
        height: 512,
        alt: "AIT Drive Downloader",
      }
    ],
  },
  twitter: {
    card: "summary",
    title: "AIT Drive Downloader | AI-powered bulk Google Drive downloader",
    description: "AI-powered bulk Google Drive downloader.",
    images: ["/icon.png"],
  }
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FFFFFF" },
    { media: "(prefers-color-scheme: dark)", color: "#090D1A" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <Analytics />
      </body>
    </html>
  );
}
