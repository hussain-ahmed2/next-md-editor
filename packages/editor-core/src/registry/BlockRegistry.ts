import type { BlockDefinition, BlockType } from "@next-md-editor/types";

class Registry {
  private blocks = new Map<BlockType, BlockDefinition>();

  register(definition: BlockDefinition) {
    if (this.blocks.has(definition.type)) {
      console.warn(`Block type "${definition.type}" is already registered. Overwriting.`);
    }
    this.blocks.set(definition.type, definition);
  }

  get(type: BlockType): BlockDefinition | undefined {
    return this.blocks.get(type);
  }

  getAll(): BlockDefinition[] {
    return Array.from(this.blocks.values());
  }

  has(type: BlockType): boolean {
    return this.blocks.has(type);
  }
}

export const BlockRegistry = new Registry();
