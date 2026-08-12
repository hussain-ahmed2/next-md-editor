import React from "react";
import { useDraggable } from "@dnd-kit/react";
import type { Block } from "@next-md-editor/types";
import { BlockRenderer } from "./BlockRenderer";

import { GripVertical } from "lucide-react";

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
        paddingLeft: "32px",
        border: "1px solid var(--border-subtle)",
        borderRadius: "var(--radius-md)",
        marginBottom: 8,
        background: "var(--bg-base)",
        userSelect: "none",
        touchAction: "none",
        transition: "background 0.12s ease, border-color 0.12s ease, opacity 0.12s ease",
        position: "relative",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "var(--bg-hover)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "var(--bg-base)";
      }}
    >
      <div
        style={{
          position: "absolute",
          left: "8px",
          top: "50%",
          transform: "translateY(-50%)",
          color: "var(--text-muted)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <GripVertical size={14} />
      </div>
      <div style={{ pointerEvents: "none" }}>
        <BlockRenderer block={block} />
      </div>
    </div>
  );
}
