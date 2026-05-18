"use client";

import { useState, useRef, useEffect } from "react";
import { useEditorStore } from "@next-md-editor/editor-core";
import type { Block } from "@next-md-editor/types";
import { handleEditorKeyboardShortcuts, htmlToMarkdown } from "@/utils/editorShortcuts";
import { renderInlineMarkdown } from "@/features/markdown/highlighter";

export function ParagraphBlock({ block }: { block: Block }) {
  const updateBlock = useEditorStore((s) => s.updateBlock);
  const selectBlock = useEditorStore((s) => s.selectBlock);
  const text = (block.props.text as string) ?? "";
  const [isEditing, setIsEditing] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);

  // If isEditing goes true, focus and move caret to the end
  useEffect(() => {
    if (isEditing && editorRef.current) {
      const el = editorRef.current;
      el.focus();
      const range = document.createRange();
      range.selectNodeContents(el);
      range.collapse(false);
      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(range);
      }
    }
  }, [isEditing]);

  if (!isEditing) {
    return (
      <div
        onClick={() => {
          setIsEditing(true);
          selectBlock(block.id);
        }}
        data-placeholder="Start typing…"
        style={{
          fontSize: "1rem",
          lineHeight: 1.75,
          color: text ? "var(--text-primary)" : "rgba(255, 255, 255, 0.25)",
          minHeight: "1.75em",
          cursor: "text",
          outline: "none",
        }}
        dangerouslySetInnerHTML={{
          __html: renderInlineMarkdown(text) || "Start typing…"
        }}
      />
    );
  }

  return (
    <div
      ref={editorRef}
      contentEditable
      suppressContentEditableWarning
      onBlur={(e) => {
        updateBlock(block.id, { text: htmlToMarkdown(e.currentTarget.innerHTML) });
        setIsEditing(false);
      }}
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
