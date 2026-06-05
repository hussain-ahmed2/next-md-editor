"use client";

import { useEditorStore } from "@next-md-editor/editor-core";
import { BlockRenderer } from "./BlockRenderer";
import { useDroppable, useDragOperation, useDragDropMonitor, useDragDropManager } from "@dnd-kit/react";
import type { DragOverEvent, DragEndEvent } from "@dnd-kit/react";
import { SortableBlock } from "./SortableBlock";
import { FloatingFormatToolbar } from "./FloatingFormatToolbar";
import { BlockRegistry } from "@next-md-editor/editor-core";
import { useState, useRef, useMemo } from "react";
import { parseMarkdown } from "@/features/markdown/serializer";
import { TEMPLATES } from "@/constants/templates";
import { BookOpen, FileCode2, NotebookText, FileText, Zap } from "lucide-react";

export const CANVAS_ROOT_ID = "canvas-root";

export function EditorCanvas() {
  const blocks = useEditorStore((s) => s.blocks);
  const manager = useDragDropManager();

  // Keep a stable ref so the memoized monitor handlers always see current blocks
  // without needing to be re-created (which would cause re-subscription churn)
  const blocksRef = useRef(blocks);
  blocksRef.current = blocks;

  // Droppable canvas root — the whole canvas is a valid drop target
  const { ref } = useDroppable({ id: CANVAS_ROOT_ID });

  // ── Reactive drag state from library (no manual state needed) ─────────────
  const { source } = useDragOperation();
  const isSidebarDrag = source?.data?.isSidebarItem === true;
  const activeSidebarItem = isSidebarDrag
    ? (source!.data as { type: string; label: string })
    : null;

  // Local state for the visual insert indicator — computed by the monitor below
  const [insertIndex, setInsertIndex] = useState<number | null>(null);

  // Remount nonce to resolve React/DOM reconciliation desync caused by DndKit's OptimisticSortingPlugin
  const [dragNonce, setDragNonce] = useState(0);

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
            const firstDroppable = manager.registry.droppables.get(currentBlocks[0].id);
            const rect =
              firstDroppable?.shape?.boundingRectangle ??
              firstDroppable?.element?.getBoundingClientRect();
            if (rect) {
              setInsertIndex(
                cursorY < rect.top + rect.height / 2
                  ? 0
                  : currentBlocks.length,
              );
            } else {
              setInsertIndex(currentBlocks.length);
            }
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

      onDragEnd(_event: DragEndEvent) {
        setInsertIndex(null);
        setDragNonce((prev) => prev + 1);
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
      ref={ref}
      className="editor-canvas-container"
      style={{
        flex: 1,
        overflow: "auto",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "60px 48px",
        background: "var(--bg-base)",
      }}
    >
      {/* paddingBottom mirrors the top 60px so the last block has identical breathing room */}
      <div style={{ width: "100%", maxWidth: 720, paddingBottom: 60 }}>
        {blocks.length === 0 && !isSidebarDrag && <EmptyState />}

        {/* No SortableContext — each useSortable registers with the manager directly */}
        <div key={dragNonce} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
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
              >
                <BlockRenderer block={block} />
              </SortableBlock>
            );
          })}
        </div>
      </div>
      <FloatingFormatToolbar />
    </main>
  );
}

function EmptyState() {
  const setBlocks = useEditorStore((s) => s.setBlocks);

  const templateIcons: Record<string, React.ReactNode> = {
    "github-profile": <BookOpen size={18} />,
    "project-readme": <FileText size={18} />,
    "api-docs": <FileCode2 size={18} />,
    blank: <NotebookText size={18} />,
    demo: <Zap size={18} />,
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "60px 40px",
        gap: 24,
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
          maxWidth: 400,
          lineHeight: 1.7,
        }}
      >
        Pick a template to get started, or drag a block from the sidebar to build from scratch.
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
          gap: 8,
          width: "100%",
          maxWidth: 520,
        }}
      >
        {TEMPLATES.map((tmpl) => (
          <button
            key={tmpl.id}
            onClick={() => setBlocks(parseMarkdown(tmpl.markdown))}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 8,
              padding: "16px 12px",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--border-subtle)",
              background: "rgba(255,255,255,0.01)",
              cursor: "pointer",
              textAlign: "center",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--bg-hover)";
              e.currentTarget.style.borderColor = "var(--border)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.01)";
              e.currentTarget.style.borderColor = "var(--border-subtle)";
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: "var(--accent-muted)",
                color: "var(--accent)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {templateIcons[tmpl.id] ?? <FileText size={18} />}
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>
              {tmpl.name}
            </div>
            <div
              style={{
                fontSize: 11,
                color: "var(--text-muted)",
                lineHeight: 1.3,
              }}
            >
              {tmpl.description}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
