"use client";

import React from "react";

interface ToolbarButtonProps {
  children: React.ReactNode;
  onClick: () => void;
  primary?: boolean;
  active?: boolean;
  id?: string;
  tooltip?: string;
}

export function ToolbarButton({
  children,
  onClick,
  primary,
  active,
  id,
  tooltip,
}: ToolbarButtonProps) {
  return (
    <button
      id={id}
      className="toolbar-btn"
      onClick={onClick}
      title={tooltip}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 5,
        padding: "5px 8px",
        borderRadius: "var(--radius-sm)",
        border: `1px solid ${primary ? "transparent" : active ? "var(--accent)" : "var(--border)"}`,
        background: primary
          ? "var(--accent)"
          : active
          ? "var(--accent-muted)"
          : "transparent",
        color: primary ? "#fff" : active ? "var(--accent)" : "var(--text-secondary)",
        fontSize: 12.5,
        fontWeight: 500,
        flexShrink: 0,
        cursor: "pointer",
        transition: "all 0.15s ease",
        fontFamily: "var(--font-sans)",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </button>
  );
}

export function Divider() {
  return (
    <div style={{
      width: 1,
      height: 20,
      background: "var(--border)",
      margin: "0 2px",
      flexShrink: 0,
    }} />
  );
}
