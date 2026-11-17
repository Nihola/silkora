import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Silkora — Uzbekistan, made yours",
  description: "Discover, plan, and enjoy your journey through Uzbekistan.",
  applicationName: "Silkora",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Silkora" },
};
export const viewport: Viewport = { themeColor: "#171b45" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
