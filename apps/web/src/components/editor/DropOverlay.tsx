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
        background: "rgba(0,0,0,0.55)",
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
          gap: 8,
          padding: "24px 40px",
          border: "1px dashed var(--accent)",
          borderRadius: "var(--radius-md)",
          background: "var(--bg-elevated)",
          color: "var(--text-primary)",
          boxShadow: "var(--shadow-md)",
        }}
      >
        <FileDown size={20} style={{ color: "var(--accent)" }} />
        <span style={{ fontSize: 13, fontWeight: 600 }}>Drop files to import</span>
        <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>
          .md files become block documents — anything else opens as text
        </span>
      </div>
    </div>
  );
}
