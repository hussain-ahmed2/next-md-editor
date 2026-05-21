"use client";

import { useSortable } from "@dnd-kit/react/sortable";
import { useEditorStore, BlockRegistry } from "@next-md-editor/editor-core";
import type { Block } from "@next-md-editor/types";
import { GripVertical, X } from "lucide-react";
import { useState, createContext, useContext } from "react";

export const BlockDepthContext = createContext<number>(0);

export function SortableBlock({
  id,
  block,
  children,
  isPlaceholder,
  index,
  group,
}: {
  id: string;
  block?: Block;
  children: React.ReactNode;
  isPlaceholder?: boolean;
  /** Position of this item within its sortable list — required by new API */
  index: number;
  /** Optional group ID to scope sorting (use parent block ID for nested lists) */
  group?: string;
}) {
  // New API: ref → element node, handleRef → drag handle node.
  // No transform/transition — OptimisticSortingPlugin handles visual reordering.
  const { ref, handleRef, isDragging } = useSortable({ id, index, group });

  const removeBlocks = useEditorStore((s) => s.removeBlocks);
  const selectBlock = useEditorStore((s) => s.selectBlock);
  const selectedBlockIds = useEditorStore((s) => s.selectedBlockIds);
  const [hovered, setHovered] = useState(false);
  const depth = useContext(BlockDepthContext);

  const isSelected = selectedBlockIds.includes(id);

  // ── Placeholder rendering (sidebar drag insert indicator) ──────────────────
  if (isPlaceholder) {
    return (
      <div
        ref={ref}
        id={id}
        style={{
          pointerEvents: "none",
          position: "relative",
          width: "100%",
          padding: "6px 0",
        }}
      >
        <div
          style={{
            height: 3,
            background: "var(--accent)",
            borderRadius: 1.5,
            position: "relative",
            width: "100%",
          }}
        >
          {/* Circular anchor dot */}
          <div
            style={{
              position: "absolute",
              left: -4,
              top: -2.5,
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "var(--accent)",
            }}
          />
        </div>
      </div>
    );
  }

  const hasChildren = block?.children && block.children.length > 0;

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <div
        ref={ref}
        id={id}
        style={{
          opacity: isDragging ? 0.3 : 1,
          position: "relative",
          borderRadius: "var(--radius-md)",
          border: isDragging
            ? "1.5px dashed var(--accent)"
            : `1px solid ${isSelected ? "var(--accent)" : hovered ? "var(--border)" : "transparent"}`,
          background: isDragging
            ? "var(--accent-muted)"
            : isSelected
              ? "var(--accent-muted)"
              : hovered
                ? "var(--bg-elevated)"
                : "transparent",
          transition: "border-color 0.15s, background 0.15s, opacity 0.15s",
          padding: "2px 0",
        }}
        onClick={(e) => selectBlock(id, e.shiftKey)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* Drag handle — handleRef registers this element as the activation handle */}
        <div
          style={{
            position: "absolute",
            left: -28,
            top: 0,
            bottom: 0,
            width: 36,
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-start",
          }}
        >
          <div
            ref={handleRef}
            className="drag-handle-grip"
            title="Drag to reorder"
            style={{
              width: 20,
              height: 20,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "grab",
              color:
                hovered || isSelected ? "var(--text-muted)" : "transparent",
              transition: "color 0.15s",
              borderRadius: 4,
              userSelect: "none",
              touchAction: "none",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.color = "var(--accent)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.color =
                hovered || isSelected ? "var(--text-muted)" : "transparent")
            }
          >
            <GripVertical size={16} />
          </div>
        </div>

        {/* Delete button */}
        {(hovered || isSelected) && (
          <div
            style={{
              position: "absolute",
              right: -28,
              top: 0,
              bottom: 0,
              width: 36,
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
            }}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (
                  selectedBlockIds.includes(id) &&
                  selectedBlockIds.length > 1
                ) {
                  removeBlocks(selectedBlockIds);
                } else {
                  removeBlocks([id]);
                }
              }}
              title="Delete block"
              style={{
                width: 20,
                height: 20,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                color: "var(--text-muted)",
                borderRadius: 4,
                padding: 0,
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.color = "var(--danger)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.color = "var(--text-muted)")
              }
            >
              <X size={16} />
            </button>
          </div>
        )}

        <div style={{ padding: "6px 12px" }}>{children}</div>
      </div>

      {/* Nested children — scoped to this block via group={id} */}
      {hasChildren && (
        <div
          style={{
            paddingLeft: 28,
            borderLeft: "2px solid var(--border-subtle)",
            marginLeft: 16,
          }}
        >
          <BlockDepthContext.Provider value={depth + 1}>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {block!.children!.map((childBlock, childIdx) => {
                const def = BlockRegistry.get(childBlock.type);
                if (!def) return null;
                const Component = def.component;
                return (
                  <SortableBlock
                    key={childBlock.id}
                    id={childBlock.id}
                    block={childBlock}
                    index={childIdx}
                    group={id}
                  >
                    <Component block={childBlock} />
                  </SortableBlock>
                );
              })}
            </div>
          </BlockDepthContext.Provider>
        </div>
      )}
    </div>
  );
}
