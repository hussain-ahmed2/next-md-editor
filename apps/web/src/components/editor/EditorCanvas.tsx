"use client";

import { useEditorStore } from "@next-md-editor/editor-core";
import { BlockRenderer } from "./BlockRenderer";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useDroppable, useDndContext } from "@dnd-kit/core";
import { SortableBlock } from "./SortableBlock";
import { BlockRegistry } from "@next-md-editor/editor-core";
import { useMemo, useState, useEffect } from "react";

export const CANVAS_ROOT_ID = "canvas-root";
export const SIDEBAR_PLACEHOLDER_ID = "sidebar-placeholder";

export function EditorCanvas() {
  const { blocks } = useEditorStore();
  const { active, over } = useDndContext();
  const [insertIndex, setInsertIndex] = useState<number | null>(null);
  
  const { setNodeRef } = useDroppable({
    id: CANVAS_ROOT_ID,
  });

  const isDraggingSidebarItem = active && active.data.current?.isSidebarItem;

  // Calculate where to insert the placeholder
  useEffect(() => {
    if (isDraggingSidebarItem && over) {
      const overId = over.id as string;
      if (overId === CANVAS_ROOT_ID) {
        setInsertIndex(blocks.length);
      } else if (overId !== SIDEBAR_PLACEHOLDER_ID) {
        const idx = blocks.findIndex(b => b.id === overId);
        if (idx !== -1) {
          // If hovering over an item, we can insert before it.
          // dnd-kit translates items down.
          setInsertIndex(idx);
        }
      }
      // If overId === "sidebar-placeholder", do nothing (keep current insertIndex)
    } else {
      setInsertIndex(null);
    }
  }, [active, over, blocks, isDraggingSidebarItem]);

  const displayBlocks = useMemo(() => {
    if (isDraggingSidebarItem && insertIndex !== null) {
      const type = active.data.current?.type;
      const def = BlockRegistry.get(type);
      const placeholderBlock = {
        id: SIDEBAR_PLACEHOLDER_ID, // unique ID, NOT active.id
        type,
        props: { ...(def?.defaultProps ?? {}) }
      };
      
      const newBlocks = [...blocks];
      const safeIndex = Math.max(0, Math.min(insertIndex, blocks.length));
      newBlocks.splice(safeIndex, 0, placeholderBlock);
      return newBlocks;
    }
    return blocks;
  }, [blocks, isDraggingSidebarItem, insertIndex, active]);

  return (
    <main
      ref={setNodeRef}
      style={{
        flex: 1,
        overflow: "auto",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "40px 24px",
        background: "var(--bg-base)",
      }}
    >
      <div style={{ width: "100%", maxWidth: 720, minHeight: "100%" }}>
        {blocks.length === 0 && !isDraggingSidebarItem && <EmptyState />}
        
        <SortableContext
          items={blocks.map((b) => b.id)}
          strategy={verticalListSortingStrategy}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {displayBlocks.map((block) => {
              if (block.id === SIDEBAR_PLACEHOLDER_ID) {
                return (
                  <div 
                    key={SIDEBAR_PLACEHOLDER_ID} 
                    id={SIDEBAR_PLACEHOLDER_ID}
                    style={{
                      opacity: 0.4,
                      pointerEvents: "none",
                      borderRadius: "var(--radius-md)",
                      border: "1.5px dashed var(--accent)",
                      background: "var(--accent-muted)",
                      padding: "2px 0",
                    }}
                  >
                    <BlockRenderer block={block} />
                  </div>
                );
              }
              return (
                <SortableBlock key={block.id} id={block.id}>
                  <BlockRenderer block={block} />
                </SortableBlock>
              );
            })}
          </div>
        </SortableContext>
      </div>
    </main>
  );
}

function EmptyState() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "80px 40px",
        gap: 16,
        textAlign: "center",
      }}
    >
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: 20,
          background: "var(--accent-muted)",
          border: "1px solid rgba(108,126,255,0.2)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 28,
          marginBottom: 8,
        }}
      >
        ✦
      </div>
      <div
        style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)" }}
      >
        Start writing
      </div>
      <div
        style={{
          fontSize: 14,
          color: "var(--text-muted)",
          maxWidth: 300,
          lineHeight: 1.7,
        }}
      >
        Pick a block from the sidebar to begin building your document.
      </div>
    </div>
  );
}
