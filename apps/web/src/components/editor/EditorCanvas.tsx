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
  
  const sortableItems = useMemo(() => {
    const ids = blocks.map((b) => b.id);
    if (isDraggingSidebarItem) {
      ids.push(active.id as string);
    }
    return ids;
  }, [blocks, active, isDraggingSidebarItem]);

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
            {blocks.map((block) => (
              <SortableBlock key={block.id} id={block.id}>
                <BlockRenderer block={block} />
              </SortableBlock>
            ))}
            
            {/* Render a placeholder at the end of the list for dnd-kit to measure and shift */}
            {isDraggingSidebarItem && (
              <SortableBlock 
                key={active.id as string} 
                id={active.id as string} 
                isPlaceholder={true}
              >
                {(() => {
                  const type = active.data.current?.type;
                  const def = BlockRegistry.get(type);
                  const placeholderBlock = {
                    id: active.id as string,
                    type,
                    props: { ...(def?.defaultProps ?? {}) }
                  };
                  return <BlockRenderer block={placeholderBlock} />;
                })()}
              </SortableBlock>
            )}
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
