"use client";

import { Trash2 } from "lucide-react";

interface DeleteButtonProps {
  onDelete: () => void;
}

export function DeleteButton({ onDelete }: DeleteButtonProps) {
  return (
    <div
      className="canvas-delete"
      style={{
        position: "absolute",
        right: -30,
        top: 0,
        bottom: 0,
        width: 36,
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "flex-end",
        paddingTop: 6,
      }}
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        title="Delete block"
        style={{
          width: 24,
          height: 24,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          color: "var(--text-muted)",
          borderRadius: "var(--radius-sm)",
          transition: "color 0.15s, background 0.15s",
          padding: 0,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = "var(--danger)";
          e.currentTarget.style.background = "var(--danger-muted)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = "var(--text-muted)";
          e.currentTarget.style.background = "transparent";
        }}
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}
