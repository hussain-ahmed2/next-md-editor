"use client";

import { useEditorStore } from "@next-md-editor/editor-core";
import { BlockRenderer } from "./BlockRenderer";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { SortableBlock } from "./SortableBlock";
import { BlockRegistry } from "@next-md-editor/editor-core";
import { useMemo } from "react";

export const CANVAS_ROOT_ID = "canvas-root";
export const SIDEBAR_PLACEHOLDER_ID = "sidebar-placeholder";

interface EditorCanvasProps {
  activeSidebarItem: { type: string; label: string } | null;
  insertIndex: number | null;
}

export function EditorCanvas({ activeSidebarItem, insertIndex }: EditorCanvasProps) {
  const { blocks } = useEditorStore();
  
  const { setNodeRef } = useDroppable({
    id: CANVAS_ROOT_ID,
  });

  const isDraggingSidebarItem = !!activeSidebarItem;

  const displayBlocks = useMemo(() => {
    if (isDraggingSidebarItem && insertIndex !== null && activeSidebarItem) {
      const type = activeSidebarItem.type;
      const def = BlockRegistry.get(type);
      const placeholderBlock = {
        id: `placeholder-${type}`,
        type,
        props: { ...(def?.defaultProps ?? {}) }
      };
      
      const newBlocks = [...blocks];
      const safeIndex = Math.max(0, Math.min(insertIndex, blocks.length));
      newBlocks.splice(safeIndex, 0, placeholderBlock);
      return newBlocks;
    }
    return blocks;
  }, [blocks, isDraggingSidebarItem, insertIndex, activeSidebarItem]);

  const sortableItems = useMemo(() => {
    return displayBlocks.map(b => b.id);
  }, [displayBlocks]);

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
          items={sortableItems}
          strategy={verticalListSortingStrategy}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {displayBlocks.map((block) => {
              const isPlaceholder = isDraggingSidebarItem && block.id === `placeholder-${block.type}`;
              return (
                <SortableBlock 
                  key={block.id} 
                  id={block.id}
                  isPlaceholder={isPlaceholder}
                >
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
