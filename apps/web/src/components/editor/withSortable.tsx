"use client";

import { useSortable } from "@dnd-kit/react/sortable";
import { useEditorStore } from "@next-md-editor/editor-core";
import type { Block } from "@next-md-editor/types";
import { memo } from "react";
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
        data-dragging={isDragging}
        onClick={(e) => selectBlock(id, e.shiftKey)}
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

        <div className="canvas-block-body">
          <WrappedComponent {...(rest as P)} />
        </div>

        <DeleteButton onDelete={handleDelete} />
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
