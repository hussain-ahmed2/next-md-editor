"use client";

import { LayoutGrid, Edit3, Eye, FolderTree } from "lucide-react";
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
        zIndex: 9999,
        flexShrink: 0,
      }}
    >
      {/* Files Tab */}
      <button
        onClick={() => onTabChange("files")}
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 2,
          border: "none",
          background: activeTab === "files" ? "var(--accent-muted)" : "transparent",
          color: activeTab === "files" ? "var(--accent)" : "var(--text-secondary)",
          cursor: "pointer",
          transition: "background 0.1s, color 0.1s",
          padding: "2px 0",
          height: "100%",
        }}
      >
        <FolderTree size={14} />
        <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.01em" }}>Files</span>
      </button>

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
          background: activeTab === "blocks" ? "var(--accent-muted)" : "transparent",
          color: activeTab === "blocks" ? "var(--accent)" : "var(--text-secondary)",
          cursor: "pointer",
          transition: "background 0.1s, color 0.1s",
          padding: "2px 0",
          height: "100%",
        }}
      >
        <LayoutGrid size={14} />
        <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.01em" }}>Blocks</span>
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
          background: activeTab === "editor" ? "var(--accent-muted)" : "transparent",
          color: activeTab === "editor" ? "var(--accent)" : "var(--text-secondary)",
          cursor: "pointer",
          transition: "background 0.1s, color 0.1s",
          padding: "2px 0",
          height: "100%",
        }}
      >
        <Edit3 size={14} />
        <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.01em" }}>Canvas</span>
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
          background: activeTab === "preview" ? "var(--accent-muted)" : "transparent",
          color: activeTab === "preview" ? "var(--accent)" : "var(--text-secondary)",
          cursor: "pointer",
          transition: "background 0.1s, color 0.1s",
          padding: "2px 0",
          height: "100%",
        }}
      >
        <Eye size={14} />
        <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.01em" }}>Preview</span>
      </button>
    </div>
  );
}
