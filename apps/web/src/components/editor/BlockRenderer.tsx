"use client";

import { memo } from "react";
import { BlockRegistry } from "@next-md-editor/editor-core";
import type { Block } from "@next-md-editor/types";
import { BlockErrorBoundary } from "./BlockErrorBoundary";

export const BlockRenderer = memo(function BlockRenderer({ block }: { block: Block }) {
  const def = BlockRegistry.get(block.type);

  if (!def) {
    return (
      <div
        style={{
          padding: "8px 12px",
          borderRadius: "var(--radius-sm)",
          background: "var(--danger-muted)",
          border: "1px solid var(--danger-border)",
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
  // A failure in one block must not unmount the whole editor.
  return (
    <BlockErrorBoundary blockType={block.type}>
      <Component block={block} />
    </BlockErrorBoundary>
  );
});
