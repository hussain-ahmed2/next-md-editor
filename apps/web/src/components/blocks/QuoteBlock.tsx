"use client";

import { useEditorStore } from "@next-md-editor/editor-core";
import type { Block } from "@next-md-editor/types";
import { handleEditorKeyboardShortcuts, htmlToMarkdown } from "@/utils/editorShortcuts";

export function QuoteBlock({ block }: { block: Block }) {
  const updateBlock = useEditorStore((s) => s.updateBlock);
  const text = (block.props.text as string) ?? "";

  return (
    <div style={{
      display: "flex",
      gap: 14,
      padding: "0 16px",
      borderRadius: "0",
      background: "transparent",
    }}>
      <div style={{
        width: 4,
        borderRadius: 0,
        background: "#30363d",
        flexShrink: 0,
        alignSelf: "stretch",
      }} />
      <div
        contentEditable
        suppressContentEditableWarning
        onBlur={(e) => updateBlock(block.id, { text: htmlToMarkdown(e.currentTarget.innerHTML) })}
        onKeyDown={(e) => handleEditorKeyboardShortcuts(e, block.id, updateBlock)}
        style={{
          flex: 1,
          fontSize: "15px",
          lineHeight: 1.6,
          color: "#8b949e",
          fontStyle: "normal",
          outline: "none",
          minHeight: "1.6em",
        }}
      >
        {text}
      </div>
    </div>
  );
}
