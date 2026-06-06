import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#0d1117",
          color: "#f0f6fc",
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans', Helvetica, Arial, sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Accent line */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: 6,
            background: "#238636",
          }}
        />

        {/* Grid pattern */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            opacity: 0.03,
            backgroundImage:
              "linear-gradient(#f0f6fc 1px, transparent 1px), linear-gradient(90deg, #f0f6fc 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 20,
            marginBottom: 16,
          }}
        >
          {/* Logo mark */}
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 12,
              background: "#238636",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 28,
              fontWeight: 700,
              color: "#fff",
            }}
          >
            M
          </div>
          <div
            style={{
              fontSize: 42,
              fontWeight: 700,
              letterSpacing: "-0.02em",
              color: "#f0f6fc",
            }}
          >
            next-md-editor
          </div>
        </div>

        <div
          style={{
            fontSize: 20,
            color: "#8b949e",
            textAlign: "center",
            maxWidth: 600,
            lineHeight: 1.5,
          }}
        >
          Block-based visual markdown editor with GitHub-styled preview
        </div>

        {/* Bottom bar */}
        <div
          style={{
            position: "absolute",
            bottom: 32,
            display: "flex",
            gap: 24,
            fontSize: 14,
            color: "#3d444d",
          }}
        >
          <span>React 19</span>
          <span>Next.js 16</span>
          <span>Turborepo</span>
          <span>GFM</span>
        </div>
      </div>
    ),
    { ...size },
  );
}
