import { ImageResponse } from "next/og";

export const alt = "Silkora — Uzbekistan, made yours";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", padding: 80, background: "#171b45", color: "#f7f6f2" }}>
      <div style={{ fontSize: 40, color: "#e8c46a" }}>✳ Silkora</div>
      <div style={{ fontSize: 84, fontWeight: 700, marginTop: 24, lineHeight: 1.05 }}>Uzbekistan, made yours</div>
      <div style={{ fontSize: 34, marginTop: 28, opacity: 0.85 }}>Discover · Plan · Book · Get around · Stay safe</div>
    </div>,
    size,
  );
}
