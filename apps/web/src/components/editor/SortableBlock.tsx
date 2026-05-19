"use client";

import { useSortable, SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
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
}: {
  id: string;
  block?: Block;
  children: React.ReactNode;
  isPlaceholder?: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });
  const removeBlocks = useEditorStore((s) => s.removeBlocks);
  const selectBlock = useEditorStore((s) => s.selectBlock);
  const selectedBlockIds = useEditorStore((s) => s.selectedBlockIds);
  const [hovered, setHovered] = useState(false);
  const depth = useContext(BlockDepthContext);

  const isSelected = selectedBlockIds.includes(id);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isPlaceholder ? 1 : isDragging ? 0.3 : 1,
    pointerEvents: (isPlaceholder ? "none" : "auto") as "none" | "auto",
  };

  if (isPlaceholder) {
    return (
      <div
        ref={setNodeRef}
        id={id}
        style={{
          ...style,
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
          {/* Circular anchor dot on the left side */}
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
        ref={setNodeRef}
        id={id}
        style={{
          ...style,
          position: "relative",
          borderRadius: "var(--radius-md)",
          border: (isDragging || isPlaceholder)
            ? "1.5px dashed var(--accent)"
            : `1px solid ${isSelected ? "var(--accent)" : hovered ? "var(--border)" : "transparent"}`,
          background: (isDragging || isPlaceholder)
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
        {/* Drag handle wrapper */}
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
            {...attributes}
            {...listeners}
            className="drag-handle-grip"
            title="Drag to reorder"
            style={{
              width: 20,
              height: 20,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "grab",
              color: hovered || isSelected ? "var(--text-muted)" : "transparent",
              transition: "color 0.15s",
              borderRadius: 4,
              userSelect: "none",
              touchAction: "none",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--accent)")}
            onMouseLeave={(e) =>
              (e.currentTarget.style.color = hovered || isSelected ? "var(--text-muted)" : "transparent")
            }
          >
            <GripVertical size={16} />
          </div>
        </div>

        {/* Delete button wrapper */}
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
                if (selectedBlockIds.includes(id) && selectedBlockIds.length > 1) {
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
              onMouseEnter={(e) => (e.currentTarget.style.color = "var(--danger)")}
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

      {/* Render nested children in an indented SortableContext */}
      {hasChildren && (
        <div style={{ paddingLeft: 28, borderLeft: "2px solid var(--border-subtle)", marginLeft: 16 }}>
          <BlockDepthContext.Provider value={depth + 1}>
            <SortableContext
              items={block!.children!.map((c) => c.id)}
              strategy={verticalListSortingStrategy}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {block!.children!.map((childBlock) => {
                  const def = BlockRegistry.get(childBlock.type);
                  if (!def) return null;
                  const Component = def.component;
                  return (
                    <SortableBlock key={childBlock.id} id={childBlock.id} block={childBlock}>
                      <Component block={childBlock} />
                    </SortableBlock>
                  );
                })}
              </div>
            </SortableContext>
          </BlockDepthContext.Provider>
        </div>
      )}
    </div>
  );
}
