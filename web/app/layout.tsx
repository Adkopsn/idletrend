import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://idletrend.com"),

  title: {
    default:
      "IdleTrend – Taskbar Hero Steam Market Prices & Trends",
    template: "%s | IdleTrend",
  },

  description:
    "Track Taskbar Hero Steam Market item prices, listing counts, price history, top gainers, top losers, and accumulating TBH items.",

  applicationName: "IdleTrend",

  alternates: {
    canonical: "/",
  },

  openGraph: {
    type: "website",
    url: "https://idletrend.com",
    siteName: "IdleTrend",
    title:
      "IdleTrend – Taskbar Hero Steam Market Prices & Trends",
    description:
      "Track Taskbar Hero item prices, listings, price history, gainers, losers, and Steam Market trends.",
  },

  twitter: {
    card: "summary",
    title:
      "IdleTrend – Taskbar Hero Steam Market Prices & Trends",
    description:
      "Track TBH Steam Market prices, listings, and item trends.",
  },

  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
      </body>
    </html>
  );
}