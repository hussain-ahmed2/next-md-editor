"use client";

import React from "react";
import { FileText } from "lucide-react";

interface PreviewHeaderProps {
  blockCount: number;
  activeTab: "preview" | "raw";
  onTabChange: (tab: "preview" | "raw") => void;
}

export function PreviewHeader({
  blockCount,
  activeTab,
  onTabChange,
}: PreviewHeaderProps) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        height: 32,
        padding: "0 8px 0 12px",
        background: "var(--bg-surface)",
        borderBottom: "1px solid var(--border-subtle)",
        flexShrink: 0,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          fontSize: 12,
          color: "var(--text-primary)",
          fontWeight: 500,
        }}
      >
        <FileText size={14} style={{ color: "var(--text-muted)" }} />
        <span>document.md</span>
        <span style={{ color: "var(--border)", userSelect: "none" }}>|</span>
        <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{blockCount} blocks</span>
      </div>
      <div style={{ display: "flex", gap: 2 }}>
        {(["preview", "raw"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => onTabChange(tab)}
            className={"ide-btn" + (activeTab === tab ? " active" : "")}
            style={{ height: 24, padding: "0 10px", fontSize: 12, fontWeight: 600 }}
          >
            {tab === "raw" ? "Code" : "Preview"}
          </button>
        ))}
      </div>
    </div>
  );
}
