"use client";

import { useRef, useEffect } from "react";
import { useEditorStore } from "@next-md-editor/editor-core";
import type { Block } from "@next-md-editor/types";
import { handleEditorKeyboardShortcuts, htmlToMarkdown } from "@/utils/editorShortcuts";
import { renderInlineMarkdown } from "@/features/markdown/highlighter";

export function QuoteBlock({ block }: { block: Block }) {
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
      ref.current.textContent = text;
    }
  };

  const handleBlur = () => {
    if (ref.current) {
      const rawText = htmlToMarkdown(ref.current.innerHTML);
      updateBlock(block.id, { text: rawText });
      ref.current.innerHTML = renderInlineMarkdown(rawText);
    }
  };

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
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onFocus={handleFocus}
        onBlur={handleBlur}
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
      />
    </div>
  );
}
