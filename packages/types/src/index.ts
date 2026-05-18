import type { ReactNode } from "react";

export type BlockType = 
  | "heading" 
  | "paragraph" 
  | "image" 
  | "code" 
  | "quote" 
  | "divider" 
  | string;

export interface Block {
  id: string;
  type: BlockType;
  props: Record<string, unknown>;
  children?: Block[];
}

export interface EditorState {
  blocks: Block[];
  selectedBlockId?: string;
  
  addBlock: (block: Block, index?: number) => void;
  updateBlock: (id: string, props: Record<string, unknown>) => void;
  removeBlock: (id: string) => void;
  moveBlock: (id: string, toIndex: number) => void;
  selectBlock: (id?: string) => void;
  setBlocks: (blocks: Block[]) => void;
  
  undo: () => void;
  redo: () => void;
}

export interface BlockDefinition {
  type: BlockType;
  component: (props: { block: Block }) => ReactNode;
  serializer?: (block: Block) => string;
  parser?: (markdown: string) => Partial<Block> | null;
  defaultProps?: Record<string, unknown>;
}
