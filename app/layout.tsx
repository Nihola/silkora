import type { Metadata, Viewport } from "next";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  openGraph: { type: "website", siteName: "Silkora", title: "Silkora — Uzbekistan, made yours", description: "Discover, plan, book, get around and stay safe in Uzbekistan.", locale: "en_US" },
  twitter: { card: "summary_large_image", title: "Silkora — Uzbekistan, made yours", description: "Discover, plan, book, get around and stay safe in Uzbekistan." },
  title: "Silkora — Uzbekistan, made yours",
  description: "Discover, plan, and enjoy your journey through Uzbekistan.",
  applicationName: "Silkora",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Silkora" },
};
export const viewport: Viewport = { themeColor: "#171b45", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
