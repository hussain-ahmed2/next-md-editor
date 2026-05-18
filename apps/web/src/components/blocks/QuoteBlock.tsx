"use client";

import { useEditorStore } from "@next-md-editor/editor-core";
import type { Block } from "@next-md-editor/types";

export function QuoteBlock({ block }: { block: Block }) {
  const updateBlock = useEditorStore((s) => s.updateBlock);
  const text = (block.props.text as string) ?? "";

  return (
    <div style={{
      display: "flex",
      gap: 14,
      padding: "12px 16px",
      borderRadius: "var(--radius-sm)",
      background: "rgba(108,126,255,0.06)",
    }}>
      <div style={{
        width: 3,
        borderRadius: 2,
        background: "var(--accent)",
        flexShrink: 0,
        alignSelf: "stretch",
      }} />
      <div
        contentEditable
        suppressContentEditableWarning
        onBlur={(e) => updateBlock(block.id, { text: e.currentTarget.textContent ?? "" })}
        style={{
          flex: 1,
          fontSize: "1rem",
          lineHeight: 1.75,
          color: "var(--text-secondary)",
          fontStyle: "italic",
          outline: "none",
          minHeight: "1.75em",
        }}
      >
        {text}
      </div>
    </div>
  );
}
