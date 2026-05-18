"use client";

import { useRef, useEffect } from "react";
import { useEditorStore } from "@next-md-editor/editor-core";
import type { Block } from "@next-md-editor/types";
import { handleEditorKeyboardShortcuts, htmlToMarkdown } from "@/utils/editorShortcuts";
import { renderInlineMarkdown } from "@/features/markdown/highlighter";

export function ParagraphBlock({ block }: { block: Block }) {
  const updateBlock = useEditorStore((s) => s.updateBlock);
  const text = (block.props.text as string) ?? "";
  const ref = useRef<HTMLDivElement>(null);

  // Synchronise state changes into the DOM only when not actively editing
  useEffect(() => {
    if (ref.current && document.activeElement !== ref.current) {
      ref.current.innerHTML = renderInlineMarkdown(text) || "";
    }
  }, [text]);

  const handleFocus = () => {
    if (ref.current) {
      // Revert to raw markdown text content for editable precision
      ref.current.textContent = text;
    }
  };

  const handleBlur = () => {
    if (ref.current) {
      const rawText = htmlToMarkdown(ref.current.innerHTML);
      updateBlock(block.id, { text: rawText });
      // Render back to visual HTML inside the same DOM element
      ref.current.innerHTML = renderInlineMarkdown(rawText);
    }
  };

  return (
    <div
      ref={ref}
      contentEditable
      suppressContentEditableWarning
      onFocus={handleFocus}
      onBlur={handleBlur}
      onKeyDown={(e) => handleEditorKeyboardShortcuts(e, block.id, updateBlock)}
      data-placeholder="Start typing…"
      style={{
        fontSize: "1rem",
        lineHeight: 1.75,
        color: "var(--text-primary)",
        outline: "none",
        minHeight: "1.75em",
      }}
    />
  );
}
