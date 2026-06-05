import { create } from "zustand";
import { temporal } from "zundo";
import type { StoreApi } from "zustand/vanilla";
import type { TemporalState } from "zundo";
import type { Block, EditorState } from "@next-md-editor/types";

function updateBlockInList(
  list: Block[],
  id: string,
  updater: (block: Block) => Block,
): { list: Block[]; updated: boolean } {
  let updated = false;
  const newList = list.map((block) => {
    if (block.id === id) {
      updated = true;
      return updater(block);
    }
    return block;
  });
  return { list: newList, updated };
}

let temporalStore: StoreApi<TemporalState<Pick<EditorState, "blocks" | "selectedBlockIds">>> | null = null;

export const useEditorStore = create<EditorState>()(
  temporal(
    (set, get) => ({
      blocks: [],
      selectedBlockIds: [],

      undo: () => temporalStore?.getState().undo(),
      redo: () => temporalStore?.getState().redo(),

      addBlock: (block, index) =>
        set((state) => {
          const newList = [...state.blocks];
          if (index !== undefined && index >= 0 && index <= newList.length) {
            newList.splice(index, 0, block);
          } else {
            newList.push(block);
          }
          return { blocks: newList, selectedBlockIds: [block.id] };
        }),

      updateBlock: (id, props) =>
        set((state) => {
          const res = updateBlockInList(state.blocks, id, (block) => ({
            ...block,
            props: { ...block.props, ...props },
          }));
          return { blocks: res.list };
        }),

      replaceBlock: (id, newBlock) =>
        set((state) => {
          const res = updateBlockInList(state.blocks, id, () => ({
            ...newBlock,
            id,
          } as Block));
          return { blocks: res.list };
        }),

      removeBlocks: (ids) =>
        set((state) => {
          const idsSet = new Set(ids);
          return {
            blocks: state.blocks.filter((b) => !idsSet.has(b.id)),
            selectedBlockIds: state.selectedBlockIds.filter((id) => !idsSet.has(id)),
          };
        }),

      moveBlocks: (ids, toIndex) =>
        set((state) => {
          const idsSet = new Set(ids);
          const blocksToMove = state.blocks.filter((b) => idsSet.has(b.id));
          const remaining = state.blocks.filter((b) => !idsSet.has(b.id));
          const safeIdx = Math.max(0, Math.min(toIndex, remaining.length));
          const next = [...remaining];
          next.splice(safeIdx, 0, ...blocksToMove);
          return { blocks: next };
        }),

      // Stub — nesting removed. Kept on interface for TS compatibility.
      indentBlocks: (_ids) => {},
      outdentBlocks: (_ids) => {},

      selectBlock: (id, extend) =>
        set((state) => {
          if (!id) return { selectedBlockIds: [] };
          if (extend && state.selectedBlockIds.length > 0) {
            const lastId = state.selectedBlockIds[state.selectedBlockIds.length - 1];
            const startIdx = state.blocks.findIndex((b) => b.id === lastId);
            const endIdx = state.blocks.findIndex((b) => b.id === id);
            if (startIdx !== -1 && endIdx !== -1) {
              const [start, end] = [Math.min(startIdx, endIdx), Math.max(startIdx, endIdx)];
              const range = state.blocks.slice(start, end + 1).map((b) => b.id);
              return { selectedBlockIds: [...new Set([...state.selectedBlockIds, ...range])] };
            }
          }
          return { selectedBlockIds: [id] };
        }),

      setBlocks: (blocks) =>
        set(() => ({ blocks, selectedBlockIds: [] })),
    }),
    {
      partialize: (state) => ({
        blocks: state.blocks,
        selectedBlockIds: state.selectedBlockIds,
      }),
      limit: 100,
      equality: (a, b) => a.blocks === b.blocks && a.selectedBlockIds === b.selectedBlockIds,
    }
  )
);

temporalStore = useEditorStore.temporal;
