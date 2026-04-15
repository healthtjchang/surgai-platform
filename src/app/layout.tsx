import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { LocaleProvider } from "@/lib/locale-context";
import { AuthProvider } from "@/lib/auth-context";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#06b6d4',
};

export const metadata: Metadata = {
  title: "SurgAI 外科智慧教學平台",
  description: "AI 驅動的手術影像記錄與學習系統 — 讓每一台手術自動成為高品質教學資源",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "SurgAI",
  },
  openGraph: {
    title: "SurgAI 外科智慧教學平台",
    description: "AI 驅動的手術影像記錄與學習系統。自動轉譯、分段、標註、生成教案——醫師零負擔，學員隨時學。",
    siteName: "SurgAI",
    type: "website",
    locale: "zh_TW",
  },
  twitter: {
    card: "summary_large_image",
    title: "SurgAI 外科智慧教學平台",
    description: "AI-Powered Surgical Video Recording & Learning Platform",
  },
  other: {
    "apple-mobile-web-app-capable": "yes",
    "mobile-web-app-capable": "yes",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-TW" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <head>
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body className="min-h-full flex flex-col" style={{ background: 'var(--bg-base)', color: 'var(--foreground)' }}>
        <LocaleProvider initialLocale="zh-TW">
          <AuthProvider>
            {children}
          </AuthProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}
