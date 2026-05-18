"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useEditorStore } from "@next-md-editor/editor-core";
import { GripVertical, X } from "lucide-react";
import { useState } from "react";

export function SortableBlock({
  id,
  children,
  isPlaceholder,
}: {
  id: string;
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
  const removeBlock = useEditorStore((s) => s.removeBlock);
  const selectBlock = useEditorStore((s) => s.selectBlock);
  const selectedBlockId = useEditorStore((s) => s.selectedBlockId);
  const [hovered, setHovered] = useState(false);

  const isSelected = selectedBlockId === id;

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isPlaceholder ? 0.4 : isDragging ? 0.3 : 1,
    pointerEvents: (isPlaceholder ? "none" : "auto") as "none" | "auto",
  };

  return (
    <div
      ref={setNodeRef}
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
      onClick={() => selectBlock(id)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        title="Drag to reorder"
        style={{
          position: "absolute",
          left: -28,
          top: "50%",
          transform: "translateY(-50%)",
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
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "var(--accent)")}
        onMouseLeave={(e) =>
          (e.currentTarget.style.color = hovered || isSelected ? "var(--text-muted)" : "transparent")
        }
      >
        <GripVertical size={16} />
      </div>

      {/* Delete button */}
      {(hovered || isSelected) && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            removeBlock(id);
          }}
          title="Delete block"
          style={{
            position: "absolute",
            right: -28,
            top: "50%",
            transform: "translateY(-50%)",
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
      )}

      <div style={{ padding: "6px 12px" }}>{children}</div>
    </div>
  );
}
