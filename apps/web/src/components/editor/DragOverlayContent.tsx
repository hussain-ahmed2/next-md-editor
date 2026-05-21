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
    return (
      <div
        style={{
          padding: "8px 16px",
          background: "var(--accent)",
          color: "white",
          borderRadius: "var(--radius-md)",
          fontSize: 13,
          fontWeight: 600,
          boxShadow: "var(--shadow-lg)",
          cursor: "grabbing",
          pointerEvents: "none",
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        Adding {source.data.label as string}...
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
