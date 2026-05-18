"use client";

import { BlockRegistry } from "@next-md-editor/editor-core";
import type { Block } from "@next-md-editor/types";

export function BlockRenderer({ block }: { block: Block }) {
  const def = BlockRegistry.get(block.type);

  if (!def) {
    return (
      <div
        style={{
          padding: "8px 12px",
          borderRadius: "var(--radius-sm)",
          background: "rgba(248, 113, 113, 0.1)",
          border: "1px solid rgba(248, 113, 113, 0.3)",
          color: "var(--danger)",
          fontSize: 12,
          fontFamily: "var(--font-mono)",
        }}
      >
        Unknown block type: <strong>{block.type}</strong>
      </div>
    );
  }

  const Component = def.component;
  return <Component block={block} />;
}
