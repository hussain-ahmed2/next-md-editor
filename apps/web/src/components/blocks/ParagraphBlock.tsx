"use client";

import { useEditorStore } from "@next-md-editor/editor-core";
import type { Block } from "@next-md-editor/types";
import { handleEditorKeyboardShortcuts, htmlToMarkdown } from "@/utils/editorShortcuts";

export function ParagraphBlock({ block }: { block: Block }) {
  const updateBlock = useEditorStore((s) => s.updateBlock);
  const text = (block.props.text as string) ?? "";

  return (
    <div
      contentEditable
      suppressContentEditableWarning
      onBlur={(e) => updateBlock(block.id, { text: htmlToMarkdown(e.currentTarget.innerHTML) })}
      onKeyDown={(e) => handleEditorKeyboardShortcuts(e, block.id, updateBlock)}
      data-placeholder="Start typing…"
      style={{
        fontSize: "1rem",
        lineHeight: 1.75,
        color: "var(--text-primary)",
        outline: "none",
        minHeight: "1.75em",
      }}
    >
      {text}
    </div>
  );
}
