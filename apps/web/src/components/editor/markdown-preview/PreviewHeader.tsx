"use client";

import React from "react";
import { Code2, Eye, FileText } from "lucide-react";

interface PreviewHeaderProps {
  fileName: string;
  blockCount: number;
  activeTab: "preview" | "raw";
  onTabChange: (tab: "preview" | "raw") => void;
}

export function PreviewHeader({
  fileName,
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
        gap: 8,
        height: "var(--tab-height)",
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
          minWidth: 0,
        }}
      >
        <FileText size={14} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {fileName}
        </span>
        <span style={{ color: "var(--border)", userSelect: "none" }}>|</span>
        <span style={{ fontSize: 11, color: "var(--text-muted)", flexShrink: 0 }}>
          {blockCount} blocks
        </span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
        <span
          style={{
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: "0.04em",
            color: "var(--text-muted)",
          }}
          title="Rendered with GitHub-Flavored Markdown styling"
        >
          GFM
        </span>
        <div className="ide-segment" role="tablist" aria-label="Preview view mode">
          <button
            role="tab"
            aria-selected={activeTab === "preview"}
            className={activeTab === "preview" ? "active" : ""}
            onClick={() => onTabChange("preview")}
          >
            <Eye size={12} /> Preview
          </button>
          <button
            role="tab"
            aria-selected={activeTab === "raw"}
            className={activeTab === "raw" ? "active" : ""}
            onClick={() => onTabChange("raw")}
          >
            <Code2 size={12} /> Code
          </button>
        </div>
      </div>
    </div>
  );
}
