"use client";

import { useSortable } from "@dnd-kit/react/sortable";
import { useEditorStore } from "@next-md-editor/editor-core";
import type { Block } from "@next-md-editor/types";
import { useState, memo } from "react";
import { DragHandle } from "./sortable-block/DragHandle";
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
        style={{
          opacity: isDragging ? 0.3 : 1,
          position: "relative",
          borderRadius: "var(--radius-sm)",
          border: isDragging
            ? "1px dashed var(--accent)"
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
        <DragHandle
          handleRef={handleRef}
          hovered={hovered}
          isSelected={isSelected}
        />

        {(hovered || isSelected) && (
          <DeleteButton onDelete={handleDelete} />
        )}

        <div style={{ padding: "6px 12px" }}>
          <WrappedComponent {...(rest as P)} />
        </div>
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
