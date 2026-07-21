"use client";

import { FileDown } from "lucide-react";

/** Full-window overlay shown while OS files are dragged over the app. */
export function DropOverlay({ visible }: { visible: boolean }) {
  if (!visible) return null;
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 2000,
        background: "color-mix(in srgb, var(--bg-base) 70%, transparent)",
        backdropFilter: "blur(2px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 12,
          padding: "40px 64px",
          border: "2px dashed var(--accent)",
          borderRadius: "var(--radius-lg)",
          background: "var(--bg-surface)",
          color: "var(--text-primary)",
          boxShadow: "var(--shadow-lg)",
        }}
      >
        <FileDown size={36} style={{ color: "var(--accent)" }} />
        <span style={{ fontSize: 15, fontWeight: 600 }}>Drop files to import</span>
        <span style={{ fontSize: 12.5, color: "var(--text-secondary)" }}>
          .md files become block documents — anything else opens as text
        </span>
      </div>
    </div>
  );
}
