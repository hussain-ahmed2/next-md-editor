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
        background: "#161b22",
        borderBottom: "1px solid #30363d",
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
          color: "#c9d1d9",
          fontWeight: 500,
        }}
      >
        <FileText size={14} style={{ color: "#7d8590" }} />
        <span>document.md</span>
        <span style={{ color: "#484f58", userSelect: "none" }}>|</span>
        <span style={{ fontSize: 11.5, color: "#8b949e" }}>{blockCount} blocks</span>
      </div>
      <div
        style={{
          display: "flex",
          border: "1px solid #30363d",
          borderRadius: 6,
          overflow: "hidden",
          background: "#0d1117",
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
              background: activeTab === tab ? "#21262d" : "transparent",
              color: activeTab === tab ? "#c9d1d9" : "#8b949e",
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
