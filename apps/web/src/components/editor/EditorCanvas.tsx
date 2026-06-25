"use client";

import { useEditorStore } from "@next-md-editor/editor-core";
import { useUIStore } from "@/store/uiStore";
import { BlockRenderer } from "./BlockRenderer";
import { useDroppable, useDragOperation, useDragDropMonitor, useDragDropManager } from "@dnd-kit/react";
import type { DragOverEvent } from "@dnd-kit/react";
import { SortableBlock } from "./SortableBlock";
import { BlockRegistry } from "@next-md-editor/editor-core";
import { useState, useRef, useMemo, useCallback, useEffect } from "react";
import { EmptyState } from "./EmptyState";

export const CANVAS_ROOT_ID = "canvas-root";

function assignRef<T>(ref: React.Ref<T> | undefined, value: T | null) {
  if (!ref) return;
  if (typeof ref === "function") {
    ref(value);
  } else if (ref && "current" in ref) {
    (ref as React.MutableRefObject<T | null>).current = value;
  }
}

export function EditorCanvas({ scrollRef }: { scrollRef?: React.Ref<HTMLDivElement> }) {
  const blocks = useEditorStore((s) => s.blocks);
  const previewRatio = useUIStore((s) => s.previewRatio);
  const isMobile = useUIStore((s) => s.isMobile);
  const manager = useDragDropManager();

  // Keep a stable ref so the memoized monitor handlers always see current blocks
  // without needing to be re-created (which would cause re-subscription churn)
  const blocksRef = useRef(blocks);
  useEffect(() => {
    blocksRef.current = blocks;
  }, [blocks]);

  // Droppable canvas root — the whole canvas is a valid drop target
  const { ref: droppableRef } = useDroppable({ id: CANVAS_ROOT_ID });

  const setRef = useCallback((node: HTMLDivElement | null) => {
    (droppableRef as (el: Element | null) => void)(node);
    assignRef(scrollRef, node);
  }, [droppableRef, scrollRef]);

  // ── Reactive drag state from library (no manual state needed) ─────────────
  const { source } = useDragOperation();
  const isSidebarDrag = source?.data?.isSidebarItem === true;
  const activeSidebarItem = isSidebarDrag
    ? (source!.data as { type: string; label: string })
    : null;

  // Local state for the visual insert indicator — computed by the monitor below
  const [insertIndex, setInsertIndex] = useState<number | null>(null);
  const selectedBlockIds = useEditorStore((s) => s.selectedBlockIds);
  const focusedBlockId = selectedBlockIds.length > 0 ? selectedBlockIds[selectedBlockIds.length - 1] : null;

  // ── useDragDropMonitor: react to drag events without prop drilling ─────────
  // handlers is memoized with [manager] deps so it stays stable.
  // blocksRef provides always-fresh blocks data inside the stable closures.
  const monitorHandlers = useMemo(
    () => ({
      onDragOver({ operation }: DragOverEvent) {
        const s = operation.source;
        const t = operation.target;
        if (!s?.data?.isSidebarItem || !t || !manager) return;

        const currentBlocks = blocksRef.current;
        const targetId = t.id as string;
        const cursorY = operation.position.current.y;

        if (targetId === CANVAS_ROOT_ID) {
          if (currentBlocks.length === 0) {
            setInsertIndex(0);
          } else {
            let found = false;
            for (let i = 0; i < currentBlocks.length; i++) {
              const droppable = manager.registry.droppables.get(currentBlocks[i].id);
              const rect =
                droppable?.shape?.boundingRectangle ??
                droppable?.element?.getBoundingClientRect();
              if (rect && cursorY < rect.top + rect.height / 2) {
                setInsertIndex(i);
                found = true;
                break;
              }
            }
            if (!found) setInsertIndex(currentBlocks.length);
          }
        } else if (!targetId.startsWith("placeholder-")) {
          const idx = currentBlocks.findIndex((b) => b.id === targetId);
          if (idx !== -1) {
            let newIdx = idx;
            const rect = t.shape?.boundingRectangle ?? t.element?.getBoundingClientRect();
            if (rect) {
              if (cursorY > rect.top + rect.height / 2) newIdx++;
            }
            setInsertIndex(newIdx);
          }
        }
        // If hovering over own placeholder → keep current insertIndex (no flicker)
      },

      onDragEnd() {
        setInsertIndex(null);
      },
    }),
    [manager],
  );

  useDragDropMonitor(monitorHandlers);

  // ── Build display list — splice placeholder at insert position ─────────────
  const displayBlocks = useMemo(() => {
    if (isSidebarDrag && insertIndex !== null && activeSidebarItem) {
      const type = activeSidebarItem.type;
      const def = BlockRegistry.get(type);
      const placeholder = {
        id: `placeholder-${type}`,
        type,
        props: { ...(def?.defaultProps ?? {}) },
      };
      const next = [...blocks];
      const safeIdx = Math.max(0, Math.min(insertIndex, blocks.length));
      next.splice(safeIdx, 0, placeholder);
      return next;
    }
    return blocks;
  }, [blocks, isSidebarDrag, insertIndex, activeSidebarItem]);

  return (
    <main
      ref={setRef}
      className="editor-canvas-container"
      style={{
        flex: `${Math.round((1 - previewRatio) * 100)} 1 0`,
        overflow: "auto",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: isMobile ? "32px 16px" : "60px 48px",
        background: "var(--bg-base)",
      }}
    >
      {/* paddingBottom mirrors the top 60px so the last block has identical breathing room */}
      <div style={{ width: "100%", maxWidth: 720, paddingBottom: 60 }}>
        {blocks.length === 0 && !isSidebarDrag && <EmptyState />}

        {/* No SortableContext — each useSortable registers with the manager directly */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {displayBlocks.map((block, blockIdx) => {
            const isPlaceholder =
              isSidebarDrag && block.id === `placeholder-${block.type}`;
            return (
              <SortableBlock
                key={block.id}
                id={block.id}
                block={block}
                isPlaceholder={isPlaceholder}
                index={blockIdx}
                showToolbar={block.id === focusedBlockId}
              >
                <BlockRenderer block={block} />
              </SortableBlock>
            );
          })}
        </div>
      </div>
    </main>
  );
}
