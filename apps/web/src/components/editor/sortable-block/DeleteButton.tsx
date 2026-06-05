"use client";

import { X } from "lucide-react";

interface DeleteButtonProps {
  onDelete: () => void;
}

export function DeleteButton({ onDelete }: DeleteButtonProps) {
  return (
    <div
      style={{
        position: "absolute",
        right: -28,
        top: 0,
        bottom: 0,
        width: 36,
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-end",
      }}
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        title="Delete block"
        style={{
          width: 20,
          height: 20,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          color: "var(--text-muted)",
          borderRadius: 4,
          padding: 0,
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "var(--danger)")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
      >
        <X size={16} />
      </button>
    </div>
  );
}
