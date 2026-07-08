import React from "react";
import { useDraggable } from "@dnd-kit/react";
import type { Block } from "@next-md-editor/types";
import { BlockRenderer } from "./BlockRenderer";

export function AiDraggableBlock({ block }: { block: Block }) {
  const { ref, isDragging } = useDraggable({
    id: `ai-drag-${block.id}`,
    data: {
      isSidebarItem: true,
      type: block.type,
      block,
    },
  });

  return (
    <div
      ref={ref as React.Ref<HTMLDivElement>}
      title="Drag me into the editor"
      style={{
        opacity: isDragging ? 0.4 : 1,
        cursor: "grab",
        padding: "8px 12px",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-md)",
        marginBottom: 8,
        background: "var(--bg-base)",
        userSelect: "none",
        transition: "all 0.15s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "var(--accent)";
        e.currentTarget.style.background = "var(--bg-hover)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "var(--border)";
        e.currentTarget.style.background = "var(--bg-base)";
      }}
    >
      <div style={{ pointerEvents: "none" }}>
        <BlockRenderer block={block} />
      </div>
    </div>
  );
}
