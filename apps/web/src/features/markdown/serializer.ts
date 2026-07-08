import { serializeMarkdown as baseSerializeMarkdown, parseMarkdown } from "@next-md-editor/markdown";
import { BlockRegistry } from "@next-md-editor/editor-core";
import type { Block } from "@next-md-editor/types";

export function serializeToMarkdown(blocks: Block[]): string {
  return baseSerializeMarkdown(blocks, (type) => BlockRegistry.get(type)?.serializer);
}

export { parseMarkdown };
