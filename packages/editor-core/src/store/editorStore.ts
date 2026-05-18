import { create } from "zustand";
import { v4 as uuidv4 } from "uuid";
import type { Block, EditorState } from "@next-md-editor/types";

// Extend internally to support history stacks
interface HistoryState {
  past: Block[][];
  future: Block[][];
  isInitialLoadDone?: boolean;
}

const pushHistory = (past: Block[][], blocks: Block[]) => {
  const newPast = [...past, blocks];
  if (newPast.length > 100) {
    newPast.shift();
  }
  return newPast;
};

export const useEditorStore = create<EditorState & HistoryState>((set) => ({
  blocks: [],
  selectedBlockId: undefined,
  past: [],
  future: [],
  isInitialLoadDone: false,

  addBlock: (block: Block, index?: number) =>
    set((state) => {
      const newBlocks = [...state.blocks];
      if (index !== undefined && index >= 0 && index <= newBlocks.length) {
        newBlocks.splice(index, 0, block);
      } else {
        newBlocks.push(block);
      }
      return {
        past: pushHistory(state.past, state.blocks),
        future: [],
        blocks: newBlocks,
        selectedBlockId: block.id,
      };
    }),

  updateBlock: (id: string, props: Record<string, unknown>) =>
    set((state) => {
      const newBlocks = state.blocks.map((b) =>
        b.id === id ? { ...b, props: { ...b.props, ...props } } : b
      );
      return {
        past: pushHistory(state.past, state.blocks),
        future: [],
        blocks: newBlocks,
      };
    }),

  removeBlock: (id: string) =>
    set((state) => {
      const newBlocks = state.blocks.filter((b) => b.id !== id);
      return {
        past: pushHistory(state.past, state.blocks),
        future: [],
        blocks: newBlocks,
        selectedBlockId: state.selectedBlockId === id ? undefined : state.selectedBlockId,
      };
    }),

  moveBlock: (id: string, toIndex: number) =>
    set((state) => {
      const currentIndex = state.blocks.findIndex((b) => b.id === id);
      if (currentIndex === -1) return state;

      const newBlocks = [...state.blocks];
      const [movedBlock] = newBlocks.splice(currentIndex, 1);
      newBlocks.splice(toIndex, 0, movedBlock);

      return {
        past: pushHistory(state.past, state.blocks),
        future: [],
        blocks: newBlocks,
      };
    }),

  selectBlock: (id?: string) => set({ selectedBlockId: id }),

  setBlocks: (blocks: Block[]) =>
    set((state) => ({
      past: state.isInitialLoadDone ? pushHistory(state.past, state.blocks) : state.past,
      future: state.isInitialLoadDone ? [] : state.future,
      blocks,
      selectedBlockId: undefined,
      isInitialLoadDone: true,
    })),

  undo: () =>
    set((state) => {
      if (state.past.length === 0) return {};

      const previous = state.past[state.past.length - 1];
      const newPast = state.past.slice(0, state.past.length - 1);

      return {
        past: newPast,
        future: [state.blocks, ...state.future],
        blocks: previous,
      };
    }),

  redo: () =>
    set((state) => {
      if (state.future.length === 0) return {};

      const next = state.future[0];
      const newFuture = state.future.slice(1);

      return {
        past: [...state.past, state.blocks],
        future: newFuture,
        blocks: next,
      };
    }),
}));
