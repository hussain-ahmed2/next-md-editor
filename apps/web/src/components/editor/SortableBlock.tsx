"use client";

import { useSortable } from "@dnd-kit/react/sortable";
import { useEditorStore } from "@next-md-editor/editor-core";
import type { Block } from "@next-md-editor/types";
import { useState, memo } from "react";
import { DragHandle } from "./sortable-block/DragHandle";
import { DeleteButton } from "./sortable-block/DeleteButton";
import { PlaceholderBlock } from "./sortable-block/PlaceholderBlock";
import { BlockToolbar } from "./FloatingFormatToolbar";

export const SortableBlock = memo(
  function SortableBlock({
  id,
  children,
  isPlaceholder,
  index,
  showToolbar,
}: {
  id: string;
  block?: Block;
  children: React.ReactNode;
  isPlaceholder?: boolean;
  /** Position of this item within the sortable list — required by @dnd-kit/react */
  index: number;
  showToolbar?: boolean;
}) {
  const { ref, handleRef, isDragging } = useSortable({ id, index });

  const removeBlocks = useEditorStore((s) => s.removeBlocks);
  const selectBlock = useEditorStore((s) => s.selectBlock);
  const selectedBlockIds = useEditorStore((s) => s.selectedBlockIds);
  const [hovered, setHovered] = useState(false);

  // ── Placeholder rendering (sidebar drag insert indicator) ──────────────────
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
      <DragHandle
        handleRef={handleRef}
        hovered={hovered}
        isSelected={isSelected}
      />

      {(hovered || isSelected) && (
        <DeleteButton onDelete={handleDelete} />
      )}

      <div style={{ padding: "6px 12px" }}>
        {showToolbar && <BlockToolbar blockId={id} />}
        {children}
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
