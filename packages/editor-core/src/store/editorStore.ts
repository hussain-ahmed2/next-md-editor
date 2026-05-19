import { create } from "zustand";
import { v4 as uuidv4 } from "uuid";
import type { Block, EditorState } from "@next-md-editor/types";
import { enablePatches, produceWithPatches, applyPatches, Patch } from "immer";

enablePatches();

interface PatchState {
  patches: Patch[];
  inversePatches: Patch[];
}

// Extend internally to support history stacks
interface HistoryState {
  past: PatchState[];
  future: PatchState[];
  isInitialLoadDone?: boolean;
}

interface BlockContext {
  list: Block[];
  index: number;
  parent: Block | null;
}

function findBlockContext(blocks: Block[], id: string, parent: Block | null = null): BlockContext | null {
  for (let i = 0; i < blocks.length; i++) {
    if (blocks[i].id === id) {
      return { list: blocks, index: i, parent };
    }
    if (blocks[i].children) {
      const result = findBlockContext(blocks[i].children!, id, blocks[i]);
      if (result) return result;
    }
  }
  return null;
}

/**
 * Renumbers consecutive numbered-list paragraph blocks within a list.
 * Resets the counter when a non-numbered block is encountered.
 */
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

export const useEditorStore = create<EditorState & HistoryState>((set, get) => ({
  blocks: [],
  selectedBlockIds: [],
  past: [],
  future: [],
  isInitialLoadDone: false,

  addBlock: (block: Block, index?: number, parentId?: string | null) => {
    const state = get();
    const [nextState, patches, inversePatches] = produceWithPatches(state.blocks, draft => {
      let targetList = draft;
      if (parentId) {
        const ctx = findBlockContext(draft, parentId);
        if (ctx) {
          if (!ctx.list[ctx.index].children) {
            ctx.list[ctx.index].children = [];
          }
          targetList = ctx.list[ctx.index].children!;
        }
      }

      if (index !== undefined && index >= 0 && index <= targetList.length) {
        targetList.splice(index, 0, block);
      } else {
        targetList.push(block);
      }
    });

    set({
      blocks: nextState,
      selectedBlockIds: [block.id],
      past: [...state.past, { patches, inversePatches }].slice(-100),
      future: []
    });
  },

  updateBlock: (id: string, props: Record<string, unknown>) => {
    const state = get();
    const [nextState, patches, inversePatches] = produceWithPatches(state.blocks, draft => {
      const ctx = findBlockContext(draft, id);
      if (ctx) {
        ctx.list[ctx.index].props = { ...ctx.list[ctx.index].props, ...props };
      }
    });

    set({
      blocks: nextState,
      past: [...state.past, { patches, inversePatches }].slice(-100),
      future: []
    });
  },

  replaceBlock: (id: string, newBlock: Omit<Block, "id">) => {
    const state = get();
    const [nextState, patches, inversePatches] = produceWithPatches(state.blocks, draft => {
      const ctx = findBlockContext(draft, id);
      if (ctx) {
        const children = ctx.list[ctx.index].children;
        ctx.list[ctx.index] = { id, ...newBlock, children } as Block;
      }
    });

    set({
      blocks: nextState,
      past: [...state.past, { patches, inversePatches }].slice(-100),
      future: []
    });
  },

  removeBlocks: (ids: string[]) => {
    const state = get();
    const [nextState, patches, inversePatches] = produceWithPatches(state.blocks, draft => {
      const idsSet = new Set(ids);
      function removeRecursive(list: Block[]) {
        for (let i = list.length - 1; i >= 0; i--) {
          if (idsSet.has(list[i].id)) {
            list.splice(i, 1);
          } else if (list[i].children) {
            removeRecursive(list[i].children!);
          }
        }
      }
      removeRecursive(draft);
    });

    set({
      blocks: nextState,
      past: [...state.past, { patches, inversePatches }].slice(-100),
      future: [],
      selectedBlockIds: state.selectedBlockIds.filter(id => !ids.includes(id))
    });
  },

  moveBlocks: (ids: string[], toIndex: number, toParentId?: string | null) => {
    const state = get();
    const [nextState, patches, inversePatches] = produceWithPatches(state.blocks, draft => {
      const idsSet = new Set(ids);
      const blocksToMove: any[] = [];
      
      function extractRecursive(list: Block[]) {
        for (let i = 0; i < list.length; i++) {
          if (idsSet.has(list[i].id)) {
            blocksToMove.push(list[i]);
          }
          if (list[i].children) {
            extractRecursive(list[i].children!);
          }
        }
      }
      extractRecursive(draft);
      
      if (blocksToMove.length === 0) return;

      function removeRecursive(list: Block[]) {
        for (let i = list.length - 1; i >= 0; i--) {
          if (idsSet.has(list[i].id)) {
            list.splice(i, 1);
          } else if (list[i].children) {
            removeRecursive(list[i].children!);
          }
        }
      }
      removeRecursive(draft);

      let targetList = draft;
      if (toParentId) {
        const ctx = findBlockContext(draft, toParentId);
        if (ctx) {
          if (!ctx.list[ctx.index].children) {
            ctx.list[ctx.index].children = [];
          }
          targetList = ctx.list[ctx.index].children!;
        }
      }

      const safeIndex = Math.max(0, Math.min(toIndex, targetList.length));
      targetList.splice(safeIndex, 0, ...blocksToMove);
    });

    set({
      blocks: nextState,
      past: [...state.past, { patches, inversePatches }].slice(-100),
      future: []
    });
  },

  indentBlocks: (ids: string[]) => {
    const state = get();
    const [nextState, patches, inversePatches] = produceWithPatches(state.blocks, draft => {
      const idsSet = new Set(ids);
      function indentRecursive(list: Block[]) {
        for (let i = 1; i < list.length; i++) {
          if (idsSet.has(list[i].id)) {
            const previousSibling = list[i - 1];
            if (!previousSibling.children) {
              previousSibling.children = [];
            }
            const [block] = list.splice(i, 1);
            previousSibling.children.push(block);
            i--; // Adjust index
          } else if (list[i].children) {
            indentRecursive(list[i].children!);
          }
        }
        if (list.length > 0 && list[0].children) {
           indentRecursive(list[0].children);
        }
      }
      indentRecursive(draft);
      renumberList(draft);
    });

    set({
      blocks: nextState,
      past: [...state.past, { patches, inversePatches }].slice(-100),
      future: []
    });
  },

  outdentBlocks: (ids: string[]) => {
    const state = get();
    const [nextState, patches, inversePatches] = produceWithPatches(state.blocks, draft => {
      const idsSet = new Set(ids);
      function outdentRecursive(list: Block[], parentList: Block[] | null, parentIndex: number) {
        let insertOffset = 1;
        for (let i = 0; i < list.length; i++) {
          if (list[i].children) {
            outdentRecursive(list[i].children!, list, i);
          }
          if (idsSet.has(list[i].id) && parentList) {
            const [block] = list.splice(i, 1);
            parentList.splice(parentIndex + insertOffset, 0, block);
            insertOffset++;
            i--; // adjust index
          }
        }
      }
      for (let i = 0; i < draft.length; i++) {
        if (draft[i].children) {
          outdentRecursive(draft[i].children!, draft, i);
        }
      }
      renumberList(draft);
    });

    set({
      blocks: nextState,
      past: [...state.past, { patches, inversePatches }].slice(-100),
      future: []
    });
  },

  selectBlock: (id: string | null, extend?: boolean) => {
    const state = get();
    if (!id) {
      set({ selectedBlockIds: [] });
      return;
    }

    if (extend && state.selectedBlockIds.length > 0) {
      const blocks = state.blocks;
      const lastSelectedId = state.selectedBlockIds[state.selectedBlockIds.length - 1];
      const startIndex = blocks.findIndex(b => b.id === lastSelectedId);
      const endIndex = blocks.findIndex(b => b.id === id);
      
      if (startIndex !== -1 && endIndex !== -1) {
        const start = Math.min(startIndex, endIndex);
        const end = Math.max(startIndex, endIndex);
        const newSelection = blocks.slice(start, end + 1).map(b => b.id);
        
        const merged = new Set([...state.selectedBlockIds, ...newSelection]);
        set({ selectedBlockIds: Array.from(merged) });
        return;
      }
    }

    set({ selectedBlockIds: [id] });
  },

  setBlocks: (blocks: Block[]) => {
    const state = get();
    if (state.isInitialLoadDone) {
      const [nextState, patches, inversePatches] = produceWithPatches(state.blocks, draft => {
        return blocks;
      });
      set({
        blocks: nextState,
        past: [...state.past, { patches, inversePatches }].slice(-100),
        future: [],
        selectedBlockIds: []
      });
    } else {
      set({
        blocks,
        selectedBlockIds: [],
        isInitialLoadDone: true
      });
    }
  },

  undo: () => {
    const state = get();
    if (state.past.length === 0) return;

    const patchState = state.past[state.past.length - 1];
    const newPast = state.past.slice(0, -1);
    
    const nextBlocks = applyPatches(state.blocks, patchState.inversePatches);

    set({
      past: newPast,
      future: [patchState, ...state.future],
      blocks: nextBlocks
    });
  },

  redo: () => {
    const state = get();
    if (state.future.length === 0) return;

    const patchState = state.future[0];
    const newFuture = state.future.slice(1);

    const nextBlocks = applyPatches(state.blocks, patchState.patches);

    set({
      past: [...state.past, patchState],
      future: newFuture,
      blocks: nextBlocks
    });
  },
}));
