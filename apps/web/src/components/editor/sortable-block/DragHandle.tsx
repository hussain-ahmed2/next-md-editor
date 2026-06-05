"use client";

import { GripVertical } from "lucide-react";

interface DragHandleProps {
  handleRef: (element: HTMLDivElement | null) => void;
  hovered: boolean;
  isSelected: boolean;
}

export function DragHandle({ handleRef, hovered, isSelected }: DragHandleProps) {
  return (
    <div
      style={{
        position: "absolute",
        left: -28,
        top: 0,
        bottom: 0,
        width: 36,
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-start",
      }}
    >
      <div
        ref={handleRef}
        className="drag-handle-grip"
        title="Drag to reorder"
        style={{
          width: 20,
          height: 20,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "grab",
          color: hovered || isSelected ? "var(--text-muted)" : "transparent",
          transition: "color 0.15s",
          borderRadius: 4,
          userSelect: "none",
          touchAction: "none",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "var(--accent)")}
        onMouseLeave={(e) =>
          (e.currentTarget.style.color =
            hovered || isSelected ? "var(--text-muted)" : "transparent")
        }
      >
        <GripVertical size={16} />
      </div>
    </div>
  );
}
