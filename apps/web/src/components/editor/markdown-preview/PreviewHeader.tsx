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
        padding: "8px 14px",
        background: "var(--bg-surface)",
        borderBottom: "1px solid var(--border)",
        height: 44,
        flexShrink: 0,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          fontSize: 12.5,
          color: "var(--text-primary)",
          fontWeight: 500,
        }}
      >
        <FileText size={14} style={{ color: "var(--text-muted)" }} />
        <span>document.md</span>
        <span style={{ color: "var(--border)", userSelect: "none" }}>|</span>
        <span style={{ fontSize: 11.5, color: "var(--text-secondary)" }}>{blockCount} blocks</span>
      </div>
      <div
        style={{
          display: "flex",
          border: "1px solid var(--border)",
          borderRadius: 6,
          overflow: "hidden",
          background: "var(--bg-base)",
          padding: 2,
        }}
      >
        {(["preview", "raw"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => onTabChange(tab)}
            style={{
              padding: "3px 12px",
              fontSize: 12,
              fontWeight: 600,
              borderRadius: 4,
              border: "none",
              background: activeTab === tab ? "var(--bg-elevated)" : "transparent",
              color: activeTab === tab ? "var(--text-primary)" : "var(--text-muted)",
              cursor: "pointer",
              transition: "all 0.1s ease",
              textTransform: "capitalize",
            }}
          >
            {tab === "raw" ? "Code" : "Preview"}
          </button>
        ))}
      </div>
    </div>
  );
}
