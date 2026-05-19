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

export const useEditorStore = create<EditorState & HistoryState>((set, get) => ({
  blocks: [],
  selectedBlockId: undefined,
  past: [],
  future: [],
  isInitialLoadDone: false,

  addBlock: (block: Block, index?: number) => {
    const state = get();
    const [nextState, patches, inversePatches] = produceWithPatches(state.blocks, draft => {
      if (index !== undefined && index >= 0 && index <= draft.length) {
        draft.splice(index, 0, block);
      } else {
        draft.push(block);
      }
    });

    set({
      blocks: nextState,
      selectedBlockId: block.id,
      past: [...state.past, { patches, inversePatches }].slice(-100),
      future: []
    });
  },

  updateBlock: (id: string, props: Record<string, unknown>) => {
    const state = get();
    const [nextState, patches, inversePatches] = produceWithPatches(state.blocks, draft => {
      const block = draft.find(b => b.id === id);
      if (block) {
        block.props = { ...block.props, ...props };
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
      const idx = draft.findIndex(b => b.id === id);
      if (idx !== -1) {
        draft[idx] = { id, ...newBlock };
      }
    });

    set({
      blocks: nextState,
      past: [...state.past, { patches, inversePatches }].slice(-100),
      future: []
    });
  },

  removeBlock: (id: string) => {
    const state = get();
    const [nextState, patches, inversePatches] = produceWithPatches(state.blocks, draft => {
      const idx = draft.findIndex(b => b.id === id);
      if (idx !== -1) {
        draft.splice(idx, 1);
      }
    });

    set({
      blocks: nextState,
      past: [...state.past, { patches, inversePatches }].slice(-100),
      future: [],
      selectedBlockId: state.selectedBlockId === id ? undefined : state.selectedBlockId
    });
  },

  moveBlock: (id: string, toIndex: number) => {
    const state = get();
    const [nextState, patches, inversePatches] = produceWithPatches(state.blocks, draft => {
      const idx = draft.findIndex(b => b.id === id);
      if (idx !== -1) {
        const [moved] = draft.splice(idx, 1);
        draft.splice(toIndex, 0, moved);
      }
    });

    set({
      blocks: nextState,
      past: [...state.past, { patches, inversePatches }].slice(-100),
      future: []
    });
  },

  selectBlock: (id?: string) => set({ selectedBlockId: id }),

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
        selectedBlockId: undefined
      });
    } else {
      set({
        blocks,
        selectedBlockId: undefined,
        isInitialLoadDone: true
      });
    }
  },

  undo: () => {
    const state = get();
    if (state.past.length === 0) return;

    const patchState = state.past[state.past.length - 1];
    const newPast = state.past.slice(0, -1);
    
    // Apply inverse patches to go back
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

    // Apply forward patches to go forward
    const nextBlocks = applyPatches(state.blocks, patchState.patches);

    set({
      past: [...state.past, patchState],
      future: newFuture,
      blocks: nextBlocks
    });
  },
}));
