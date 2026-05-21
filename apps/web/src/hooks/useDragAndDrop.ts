import { useCallback } from "react";
import { useEditorStore, BlockRegistry } from "@next-md-editor/editor-core";
import { v4 as uuidv4 } from "uuid";
import { DragEndEvent, DragDropManager } from "@dnd-kit/react";
import { PointerSensor, PointerActivationConstraints } from "@dnd-kit/dom";
import { isSortable } from "@dnd-kit/react/sortable";
import { CANVAS_ROOT_ID } from "@/components/editor/EditorCanvas";

// Module-level sensor config — PointerSensor handles mouse + touch via Pointer Events API
const SENSORS = [
  PointerSensor.configure({
    activationConstraints: [
      new PointerActivationConstraints.Distance({ value: 6 }),
    ],
  }),
];

export function useDragAndDrop() {
  const blocks = useEditorStore((s) => s.blocks);
  const moveBlocks = useEditorStore((s) => s.moveBlocks);
  const addBlock = useEditorStore((s) => s.addBlock);
  const selectedBlockIds = useEditorStore((s) => s.selectedBlockIds);

  // No handleDragStart — the library tracks source/target reactively via useDragOperation().
  // No handleDragOver — EditorCanvas listens via useDragDropMonitor() for insert position.
  const handleDragEnd = useCallback(
    (event: DragEndEvent, manager?: DragDropManager) => {
      const { operation, canceled } = event;
      const source = operation.source;
      const target = operation.target;

      if (!source || canceled) return;

      // ── Sidebar → canvas drop ─────────────────────────────────────────────
      if (source.data?.isSidebarItem === true) {
        if (!target) return;

        const type = source.data.type as string;
        const def = BlockRegistry.get(type);
        const newBlock = {
          id: uuidv4(),
          type,
          props: { ...(def?.defaultProps ?? {}) },
        };

        // Compute exact insert index from final cursor position + hovered target
        const cursorY = operation.position.current.y;
        const targetId = target.id as string;
        let insertIdx = blocks.length;

        if (targetId === CANVAS_ROOT_ID) {
          if (blocks.length > 0) {
            const firstDroppable = manager?.registry.droppables.get(blocks[0].id);
            const rect =
              firstDroppable?.shape?.boundingRectangle ??
              firstDroppable?.element?.getBoundingClientRect();
            if (rect) {
              insertIdx = cursorY < rect.top + rect.height / 2 ? 0 : blocks.length;
            }
          } else {
            insertIdx = 0;
          }
        } else if (targetId.startsWith("placeholder-") && isSortable(target)) {
          // The placeholder's registered sortable index equals the insert position in blocks
          insertIdx = target.index;
        } else {
          const idx = blocks.findIndex((b) => b.id === targetId);
          if (idx !== -1) {
            insertIdx = idx;
            const rect = target.shape?.boundingRectangle ?? target.element?.getBoundingClientRect();
            if (rect) {
              if (cursorY > rect.top + rect.height / 2) insertIdx++;
            }
          }
        }

        addBlock(newBlock, insertIdx);
        return;
      }

      // ── Canvas block reorder ──────────────────────────────────────────────
      if (isSortable(source)) {
        const oldIndex = source.initialIndex;
        const toIndex = source.index;
        const toParentId = source.group as string | undefined;

        if (oldIndex !== toIndex || source.initialGroup !== source.group) {
          const idsToMove =
            selectedBlockIds.includes(source.id as string) &&
            selectedBlockIds.length > 1
              ? selectedBlockIds
              : [source.id as string];

          moveBlocks(idsToMove, toIndex, toParentId);
        }
      }
    },
    [blocks, addBlock, moveBlocks, selectedBlockIds],
  );

  return { sensors: SENSORS, handleDragEnd };
}
