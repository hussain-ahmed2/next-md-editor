import type { ReactNode } from "react";

export type BlockType = 
  | "heading" 
  | "paragraph" 
  | "image" 
  | "code" 
  | "quote" 
  | "divider"
  | "bullet-list"
  | "numbered-list"
  | string;

export interface Block {
  id: string;
  type: BlockType;
  props: Record<string, unknown>;
  children?: Block[];
}

export interface EditorState {
  blocks: Block[];
  selectedBlockIds: string[];
  
  addBlock: (block: Block, index?: number, parentId?: string | null) => void;
  updateBlock: (id: string, props: Record<string, unknown>) => void;
  replaceBlock: (id: string, newBlock: Omit<Block, "id">) => void;
  removeBlocks: (ids: string[]) => void;
  moveBlocks: (ids: string[], toIndex: number, toParentId?: string | null) => void;
  indentBlocks: (ids: string[]) => void;
  outdentBlocks: (ids: string[]) => void;
  selectBlock: (id: string | null, extend?: boolean) => void;
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
