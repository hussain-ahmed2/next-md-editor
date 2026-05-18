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
import { useMemo } from "react";

export function EditorCanvas() {
  const { blocks } = useEditorStore();
  const { active, over } = useDndContext();
  
  const { setNodeRef } = useDroppable({
    id: "canvas-root",
  });

  const displayBlocks = useMemo(() => {
    if (active && active.data.current?.isSidebarItem && over) {
      const type = active.data.current.type;
      const def = BlockRegistry.get(type);
      const placeholderBlock = {
        id: active.id as string,
        type,
        props: { ...(def?.defaultProps ?? {}) }
      };

      const overIndex = blocks.findIndex((b) => b.id === over.id);
      if (overIndex !== -1) {
        // Find if we should insert before or after based on mouse position?
        // Actually, just inserting at overIndex is what dnd-kit expects for the active item
        // when hovering over another item to shift it.
        const newBlocks = [...blocks];
        
        // dnd-kit provides rects. We can check if dragging below the over item's center
        const activeRect = active.rect.current.translated;
        const overRect = over.rect;
        
        let insertIndex = overIndex;
        if (activeRect && overRect) {
          const isBelowOverItem =
            activeRect.top + activeRect.height / 2 >
            overRect.top + overRect.height / 2;
          if (isBelowOverItem) {
            insertIndex = overIndex + 1;
          }
        }
        
        newBlocks.splice(insertIndex, 0, placeholderBlock);
        return newBlocks;
      } else if (over.id === "canvas-root") {
        return [...blocks, placeholderBlock];
      }
    }
    return blocks;
  }, [blocks, active, over]);

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
        {displayBlocks.length === 0 && <EmptyState />}
        
        <SortableContext
          items={displayBlocks.map((b) => b.id)}
          strategy={verticalListSortingStrategy}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {displayBlocks.map((block) => {
              const isPlaceholder = active?.id === block.id && active?.data.current?.isSidebarItem;
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
