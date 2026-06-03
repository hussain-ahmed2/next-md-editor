import type { ReactNode } from "react";

// ── Rich text model ────────────────────────────────────────────────────────────

export interface FormatFlags {
  bold?: boolean;
  italic?: boolean;
  code?: boolean;
  strikethrough?: boolean;
  link?: string;
}

export interface RichTextSpan extends FormatFlags {
  text: string;
}

export type RichText = RichTextSpan[];

// ── Block types ────────────────────────────────────────────────────────────────

export type BlockType = 
  | "heading" 
  | "paragraph" 
  | "image" 
  | "code" 
  | "quote" 
  | "divider"
  | "bullet-list"
  | "numbered-list"
  | "callout"
  | "table"
  | "image-grid"
  | "badge-group"
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
