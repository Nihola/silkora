import type { MetadataRoute } from "next";
export default function manifest(): MetadataRoute.Manifest {
  return { name: "Silkora — Uzbekistan travel companion", short_name: "Silkora", description: "Discover, plan, and enjoy your journey through Uzbekistan.", start_url: "/en", display: "standalone", background_color: "#f7f6f2", theme_color: "#171b45", icons: [
    { src: "/icon-192.svg", sizes: "192x192", type: "image/svg+xml", purpose: "any" },
    { src: "/icon-512.svg", sizes: "512x512", type: "image/svg+xml", purpose: "maskable" },
  ] };
}
