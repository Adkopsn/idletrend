import type { Metadata } from "next";
import {
  Geist,
  Geist_Mono,
} from "next/font/google";
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
  metadataBase: new URL(
    "https://idletrend.com"
  ),

  title: {
    default:
      "IdleTrend – Taskbar Hero Steam Market Takibi",
    template: "%s | IdleTrend",
  },

  description:
    "Taskbar Hero Steam Market item fiyatlarını, ilan sayılarını, yükselenleri, düşenleri ve fiyat geçmişini takip edin.",

  applicationName: "IdleTrend",

  keywords: [
    "IdleTrend",
    "Taskbar Hero",
    "Taskbar Hero market",
    "Taskbar Hero Steam Market",
    "Steam Market fiyatları",
    "Steam item fiyat takibi",
    "Steam market tracker",
  ],

  authors: [
    {
      name: "IdleTrend",
      url: "https://idletrend.com",
    },
  ],

  creator: "IdleTrend",
  publisher: "IdleTrend",

  alternates: {
    canonical: "/",
  },

  icons: {
    icon: [
      {
        url: "/icon.png",
        type: "image/png",
      },
    ],
    shortcut: "/icon.png",
    apple: "/icon.png",
  },

  openGraph: {
    type: "website",
    url: "https://idletrend.com",
    siteName: "IdleTrend",
    title:
      "IdleTrend – Taskbar Hero Steam Market Takibi",
    description:
      "Taskbar Hero item fiyatlarını, ilan sayılarını ve piyasa hareketlerini takip edin.",
    images: [
      {
        url: "/icon.png",
        width: 512,
        height: 512,
        alt: "IdleTrend logo",
      },
    ],
  },

  twitter: {
    card: "summary",
    title:
      "IdleTrend – Taskbar Hero Steam Market Takibi",
    description:
      "Taskbar Hero Steam Market fiyat ve ilan takip platformu.",
    images: ["/icon.png"],
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
      lang="tr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
      </body>
    </html>
  );
}