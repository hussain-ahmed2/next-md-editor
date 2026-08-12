"use client";

import React from "react";

interface ToolbarButtonProps {
  children: React.ReactNode;
  onClick: () => void;
  primary?: boolean;
  active?: boolean;
  id?: string;
  tooltip?: string;
  onMouseDown?: (e: React.MouseEvent) => void;
}

export function ToolbarButton({
  children,
  onClick,
  primary,
  active,
  id,
  tooltip,
  onMouseDown,
}: ToolbarButtonProps) {
  const className = [
    "toolbar-btn",
    "ide-btn",
    primary ? "primary" : "",
    active ? "active" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      id={id}
      className={className}
      onClick={onClick}
      onMouseDown={onMouseDown}
      title={tooltip}
      style={{
        fontWeight: 500,
        transition: "background 0.1s ease, color 0.1s ease",
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
