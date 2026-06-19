"use client";

import { useDragOperation } from "@dnd-kit/react";
import { useEditorStore } from "@next-md-editor/editor-core";
import { BlockRenderer } from "@/components/editor/BlockRenderer";

// No props — all state comes from the library and store directly.
export function DragOverlayContent() {
  const { source } = useDragOperation();
  const blocks = useEditorStore((s) => s.blocks);
  const selectedBlockIds = useEditorStore((s) => s.selectedBlockIds);

  // Library clears source when idle — overlay renders nothing
  if (!source) return null;

  // ── Sidebar item overlay ──────────────────────────────────────────────────
  if (source.data?.isSidebarItem === true) {
    const label = source.data.label as string;
    const icon = source.data.icon as React.ReactNode;
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "8px 14px 8px 10px",
          background: "var(--bg-elevated)",
          border: "1px solid var(--accent)",
          borderRadius: "var(--radius-lg)",
          boxShadow: "0 8px 24px rgba(0,0,0,0.18), 0 0 0 1px var(--accent)",
          transform: "rotate(-3deg)",
          cursor: "grabbing",
          pointerEvents: "none",
          userSelect: "none",
          width: "max-content",
        }}
      >
        <span
          style={{
            width: 30,
            height: 30,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "var(--radius-sm)",
            background: "var(--accent-muted)",
            color: "var(--accent)",
          }}
        >
          {icon}
        </span>
        <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", lineHeight: 1.2 }}>
            {label}
          </span>
          <span style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.2 }}>
            Drop to insert
          </span>
        </div>
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            color: "white",
            background: "var(--accent)",
            borderRadius: "var(--radius-full)",
            padding: "1px 7px",
            lineHeight: "16px",
            marginLeft: 2,
          }}
        >
          +
        </span>
      </div>
    );
  }

  // ── Canvas block overlay ──────────────────────────────────────────────────
  const activeId = source.id as string;
  const activeBlock = blocks.find((b) => b.id === activeId);
  const isMultiDrag =
    selectedBlockIds.includes(activeId) && selectedBlockIds.length > 1;

  return activeBlock ? (
    <div
      style={{
        borderRadius: "var(--radius-md)",
        border: "1px solid var(--accent)",
        background: "var(--bg-elevated)",
        boxShadow: "var(--shadow-lg)",
        padding: "8px 12px",
        cursor: "grabbing",
        opacity: 0.9,
      }}
    >
      <div style={{ position: "relative" }}>
        <BlockRenderer block={activeBlock} />
        {isMultiDrag && (
          <div
            style={{
              position: "absolute",
              top: -10,
              right: -10,
              background: "var(--accent)",
              color: "white",
              fontSize: 12,
              fontWeight: "bold",
              width: 24,
              height: 24,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "var(--shadow-sm)",
              zIndex: 10,
            }}
          >
            {selectedBlockIds.length}
          </div>
        )}
      </div>
    </div>
  ) : null;
}
