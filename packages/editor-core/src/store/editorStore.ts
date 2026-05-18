import { create } from "zustand";
import { v4 as uuidv4 } from "uuid";
import type { Block, EditorState } from "@next-md-editor/types";

// Temporarily omitting undo/redo for MVP state setup.
// Can be added later with middleware like zundo if needed.

export const useEditorStore = create<EditorState>((set) => ({
  blocks: [],
  selectedBlockId: undefined,

  addBlock: (block: Block, index?: number) =>
    set((state) => {
      const newBlocks = [...state.blocks];
      if (index !== undefined && index >= 0 && index <= newBlocks.length) {
        newBlocks.splice(index, 0, block);
      } else {
        newBlocks.push(block);
      }
      return { blocks: newBlocks, selectedBlockId: block.id };
    }),

  updateBlock: (id: string, props: Record<string, unknown>) =>
    set((state) => {
      const newBlocks = state.blocks.map((b) =>
        b.id === id ? { ...b, props: { ...b.props, ...props } } : b
      );
      return { blocks: newBlocks };
    }),

  removeBlock: (id: string) =>
    set((state) => {
      const newBlocks = state.blocks.filter((b) => b.id !== id);
      return {
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

      return { blocks: newBlocks };
    }),

  selectBlock: (id?: string) => set({ selectedBlockId: id }),

  setBlocks: (blocks: Block[]) => set({ blocks, selectedBlockId: undefined }),

  undo: () => {
    // To be implemented (requires history management)
    console.warn("Undo not yet implemented");
  },

  redo: () => {
    // To be implemented (requires history management)
    console.warn("Redo not yet implemented");
  },
}));
