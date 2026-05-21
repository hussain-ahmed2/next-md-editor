"use client";

import { LayoutGrid, Edit3, Eye } from "lucide-react";
import { useUIStore } from "@/store/uiStore";

export function MobileBottomBar() {
  const activeTab = useUIStore((s) => s.mobileTab);
  const onTabChange = useUIStore((s) => s.setMobileTab);

  return (
    <div
      style={{
        width: "100%",
        height: 42,
        background: "var(--bg-surface)",
        borderTop: "1px solid var(--border-subtle)",
        display: "flex",
        justifyContent: "space-around",
        alignItems: "center",
        boxShadow: "0 -2px 10px rgba(0, 0, 0, 0.05)",
        zIndex: 9999,
        flexShrink: 0,
      }}
    >
      {/* Blocks Tab */}
      <button
        onClick={() => onTabChange("blocks")}
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 2,
          border: "none",
          background: "transparent",
          color: activeTab === "blocks" ? "var(--accent)" : "var(--text-secondary)",
          cursor: "pointer",
          transition: "all 0.2s ease",
          padding: "2px 0",
          height: "100%",
        }}
      >
        <LayoutGrid
          size={14}
          style={{
            transform: activeTab === "blocks" ? "scale(1.08)" : "scale(1)",
            transition: "transform 0.2s ease",
          }}
        />
        <span style={{ fontSize: 9.5, fontWeight: 600, letterSpacing: "0.01em" }}>Blocks</span>
      </button>

      {/* Canvas Tab */}
      <button
        onClick={() => onTabChange("editor")}
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 2,
          border: "none",
          background: "transparent",
          color: activeTab === "editor" ? "var(--accent)" : "var(--text-secondary)",
          cursor: "pointer",
          transition: "all 0.2s ease",
          padding: "2px 0",
          height: "100%",
        }}
      >
        <Edit3
          size={14}
          style={{
            transform: activeTab === "editor" ? "scale(1.08)" : "scale(1)",
            transition: "transform 0.2s ease",
          }}
        />
        <span style={{ fontSize: 9.5, fontWeight: 600, letterSpacing: "0.01em" }}>Canvas</span>
      </button>

      {/* Preview Tab */}
      <button
        onClick={() => onTabChange("preview")}
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 2,
          border: "none",
          background: "transparent",
          color: activeTab === "preview" ? "var(--accent)" : "var(--text-secondary)",
          cursor: "pointer",
          transition: "all 0.2s ease",
          padding: "2px 0",
          height: "100%",
        }}
      >
        <Eye
          size={14}
          style={{
            transform: activeTab === "preview" ? "scale(1.08)" : "scale(1)",
            transition: "transform 0.2s ease",
          }}
        />
        <span style={{ fontSize: 9.5, fontWeight: 600, letterSpacing: "0.01em" }}>Preview</span>
      </button>
    </div>
  );
}
