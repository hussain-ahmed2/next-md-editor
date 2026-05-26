import { create } from "zustand";
import { temporal } from "zundo";
import type { StoreApi } from "zustand/vanilla";
import type { TemporalState } from "zundo";
import type { Block, EditorState } from "@next-md-editor/types";

interface BlockContext {
  list: Block[];
  index: number;
  parent: Block | null;
}

function findBlockContext(blocks: Block[], id: string, parent: Block | null = null): BlockContext | null {
  for (let i = 0; i < blocks.length; i++) {
    if (blocks[i].id === id) return { list: blocks, index: i, parent };
    if (blocks[i].children) {
      const result = findBlockContext(blocks[i].children!, id, blocks[i]);
      if (result) return result;
    }
  }
  return null;
}

function hasAncestorInSet(blocks: Block[], id: string, idsSet: Set<string>): boolean {
  let currentId: string | null = id;
  while (currentId) {
    const ctx = findBlockContext(blocks, currentId);
    if (!ctx || !ctx.parent) break;
    if (idsSet.has(ctx.parent.id)) return true;
    currentId = ctx.parent.id;
  }
  return false;
}

function renumberList(list: Block[]) {
  let count = 1;
  for (const b of list) {
    const m = (b.props.text as string)?.match(/^(\d+)\.\s(.*)$/);
    if (m) {
      b.props = { ...b.props, text: `${count}. ${m[2]}` };
      count++;
    } else {
      count = 1;
    }
    if (b.children && b.children.length > 0) {
      renumberList(b.children);
    }
  }
}

let temporalStore: StoreApi<TemporalState<Pick<EditorState, "blocks" | "selectedBlockIds">>> | null = null;

export const useEditorStore = create<EditorState>()(
  temporal(
    (set, get) => ({
      blocks: [],
      selectedBlockIds: [],

      undo: () => temporalStore?.getState().undo(),
      redo: () => temporalStore?.getState().redo(),

      addBlock: (block, index, parentId) =>
        set((state) => {
          const newBlocks = structuredClone(state.blocks);
          let target = newBlocks;
          if (parentId) {
            const ctx = findBlockContext(newBlocks, parentId);
            if (ctx) {
              if (!ctx.list[ctx.index].children) ctx.list[ctx.index].children = [];
              target = ctx.list[ctx.index].children!;
            }
          }
          if (index !== undefined && index >= 0 && index <= target.length) {
            target.splice(index, 0, block);
          } else {
            target.push(block);
          }
          return { blocks: newBlocks, selectedBlockIds: [block.id] };
        }),

      updateBlock: (id, props) =>
        set((state) => {
          const newBlocks = structuredClone(state.blocks);
          const ctx = findBlockContext(newBlocks, id);
          if (ctx) {
            ctx.list[ctx.index] = {
              ...ctx.list[ctx.index],
              props: { ...ctx.list[ctx.index].props, ...props },
            };
          }
          return { blocks: newBlocks };
        }),

      replaceBlock: (id, newBlock) =>
        set((state) => {
          const newBlocks = structuredClone(state.blocks);
          const ctx = findBlockContext(newBlocks, id);
          if (ctx) {
            const children = ctx.list[ctx.index].children;
            ctx.list[ctx.index] = { ...newBlock, id, children } as Block;
          }
          return { blocks: newBlocks };
        }),

      removeBlocks: (ids) =>
        set((state) => {
          const newBlocks = structuredClone(state.blocks);
          const idsSet = new Set(ids);
          function removeRecursive(list: Block[]) {
            for (let i = list.length - 1; i >= 0; i--) {
              if (idsSet.has(list[i].id)) list.splice(i, 1);
              else if (list[i].children) removeRecursive(list[i].children!);
            }
          }
          removeRecursive(newBlocks);
          return {
            blocks: newBlocks,
            selectedBlockIds: state.selectedBlockIds.filter((id) => !idsSet.has(id)),
          };
        }),

      moveBlocks: (ids, toIndex, toParentId) =>
        set((state) => {
          const newBlocks = structuredClone(state.blocks);
          const originalIdsSet = new Set(ids);
          const filteredIds = ids.filter((id) => !hasAncestorInSet(newBlocks, id, originalIdsSet));
          const idsSet = new Set(filteredIds);

          if (toParentId) {
            if (idsSet.has(toParentId) || hasAncestorInSet(newBlocks, toParentId, idsSet)) {
              return state;
            }
          }

          const blocksToMove: Block[] = [];
          function extractRecursive(list: Block[]) {
            for (let i = 0; i < list.length; i++) {
              if (idsSet.has(list[i].id)) blocksToMove.push(list[i]);
              if (list[i].children) extractRecursive(list[i].children!);
            }
          }
          extractRecursive(newBlocks);
          if (blocksToMove.length === 0) return state;

          function removeRecursive(list: Block[]) {
            for (let i = list.length - 1; i >= 0; i--) {
              if (idsSet.has(list[i].id)) list.splice(i, 1);
              else if (list[i].children) removeRecursive(list[i].children!);
            }
          }
          removeRecursive(newBlocks);

          let target = newBlocks;
          if (toParentId) {
            const ctx = findBlockContext(newBlocks, toParentId);
            if (ctx) {
              if (!ctx.list[ctx.index].children) ctx.list[ctx.index].children = [];
              target = ctx.list[ctx.index].children!;
            }
          }
          target.splice(Math.max(0, Math.min(toIndex, target.length)), 0, ...blocksToMove);
          return { blocks: newBlocks };
        }),

      indentBlocks: (ids) =>
        set((state) => {
          const newBlocks = structuredClone(state.blocks);
          const idsSet = new Set(ids);
          function indentRecursive(list: Block[]) {
            for (let i = 1; i < list.length; i++) {
              if (idsSet.has(list[i].id)) {
                const prev = list[i - 1];
                if (!prev.children) prev.children = [];
                prev.children.push(list.splice(i, 1)[0]);
                i--;
              } else if (list[i].children) {
                indentRecursive(list[i].children!);
              }
            }
            if (list.length > 0 && list[0].children) indentRecursive(list[0].children);
          }
          indentRecursive(newBlocks);
          renumberList(newBlocks);
          return { blocks: newBlocks };
        }),

      outdentBlocks: (ids) =>
        set((state) => {
          const newBlocks = structuredClone(state.blocks);
          const idsSet = new Set(ids);
          function outdentRecursive(list: Block[], parentList: Block[] | null, parentIndex: number) {
            let offset = 1;
            for (let i = 0; i < list.length; i++) {
              if (list[i].children) outdentRecursive(list[i].children!, list, i);
              if (idsSet.has(list[i].id) && parentList) {
                parentList.splice(parentIndex + offset, 0, list.splice(i, 1)[0]);
                offset++;
                i--;
              }
            }
          }
          for (let i = 0; i < newBlocks.length; i++) {
            if (newBlocks[i].children) outdentRecursive(newBlocks[i].children!, newBlocks, i);
          }
          renumberList(newBlocks);
          return { blocks: newBlocks };
        }),

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
