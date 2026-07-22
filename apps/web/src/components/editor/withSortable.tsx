"use client";

import { useSortable } from "@dnd-kit/react/sortable";
import { useEditorStore } from "@next-md-editor/editor-core";
import type { Block } from "@next-md-editor/types";
import { useState, memo } from "react";
import { GripVertical } from "lucide-react";
import { DeleteButton } from "./sortable-block/DeleteButton";
import { PlaceholderBlock } from "./sortable-block/PlaceholderBlock";

export type SortableProps = {
  id: string;
  block?: Block;
  isPlaceholder?: boolean;
  index: number;
  showToolbar?: boolean;
};

export function withSortable<P extends { block?: Block }>(
  WrappedComponent: React.ComponentType<P>
) {
  const SortableHOC = memo(function SortableBlock(props: P & SortableProps) {
    const { id, isPlaceholder, index, showToolbar, ...rest } = props;
    const { ref, handleRef, isDragging } = useSortable({ id, index });

    const removeBlocks = useEditorStore((s) => s.removeBlocks);
    const selectBlock = useEditorStore((s) => s.selectBlock);
    const selectedBlockIds = useEditorStore((s) => s.selectedBlockIds);
    const [hovered, setHovered] = useState(false);

    if (isPlaceholder) {
      return (
        <PlaceholderBlock
          refProp={ref as (element: HTMLDivElement | null) => void}
          id={id}
        />
      );
    }

    const isSelected = selectedBlockIds.includes(id);

    const handleDelete = () => {
      if (selectedBlockIds.includes(id) && selectedBlockIds.length > 1) {
        removeBlocks(selectedBlockIds);
      } else {
        removeBlocks([id]);
      }
    };

    return (
      <div
        ref={ref}
        id={id}
        className="canvas-block"
        data-selected={isSelected}
        style={{
          opacity: isDragging ? 0.3 : 1,
          position: "relative",
          display: "flex",
          alignItems: "stretch",
          borderRadius: "var(--radius-sm)",
          border: isDragging ? "1px dashed var(--accent)" : "1px solid transparent",
          background: isDragging
            ? "var(--accent-muted)"
            : isSelected
              ? "var(--accent-muted)"
              : hovered
                ? "var(--bg-elevated)"
                : "transparent",
          // Current-line accent bar (like a focused editor line in an IDE)
          boxShadow: isSelected ? "inset 2px 0 0 var(--accent)" : "none",
          transition: "background 0.12s, box-shadow 0.12s, border-color 0.12s, opacity 0.15s",
        }}
        onClick={(e) => selectBlock(id, e.shiftKey)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* Gutter: line number + drag grip (the whole gutter is the drag handle) */}
        <div
          ref={handleRef}
          className="canvas-gutter"
          title="Drag to reorder"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="canvas-grip" size={13} />
          <span className="canvas-lineno">{index + 1}</span>
        </div>

        <div style={{ flex: 1, minWidth: 0, padding: "6px 12px 6px 4px" }}>
          <WrappedComponent {...(rest as P)} />
        </div>

        {(hovered || isSelected) && <DeleteButton onDelete={handleDelete} />}
      </div>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.id === nextProps.id &&
      prevProps.index === nextProps.index &&
      prevProps.isPlaceholder === nextProps.isPlaceholder &&
      prevProps.showToolbar === nextProps.showToolbar &&
      prevProps.block === nextProps.block
    );
  });

  return SortableHOC;
}
