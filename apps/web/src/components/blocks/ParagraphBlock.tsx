"use client";

import { useState, useRef, useEffect } from "react";
import { useEditorStore } from "@next-md-editor/editor-core";
import type { Block } from "@next-md-editor/types";
import {
  handleEditorKeyboardShortcuts,
  htmlToMarkdown,
} from "@/utils/editorShortcuts";
import { renderInlineMarkdown } from "@/features/markdown/highlighter";

export function ParagraphBlock({ block }: { block: Block }) {
  const updateBlock = useEditorStore((s) => s.updateBlock);
  const text = (block.props.text as string) ?? "";
  const [isFocused, setIsFocused] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // When entering focus, populate raw text and snap caret
  useEffect(() => {
    if (isFocused && ref.current) {
      ref.current.textContent = text;
      const range = document.createRange();
      range.selectNodeContents(ref.current);
      range.collapse(false);
      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(range);
      }
    }
  }, [isFocused, ref]);

  const handleInput = (e: React.InputEvent<HTMLDivElement>) => {
    const rawText = htmlToMarkdown(e.currentTarget.innerHTML);
    updateBlock(block.id, { text: rawText });
  };

  const handleBlur = (e: React.FocusEvent<HTMLDivElement>) => {
    setIsFocused(false);
    updateBlock(block.id, { text: htmlToMarkdown(e.currentTarget.innerHTML) });
  };

  return (
    <div
      ref={ref}
      contentEditable
      suppressContentEditableWarning
      onFocus={() => setIsFocused(true)}
      onBlur={handleBlur}
      onInput={handleInput}
      onKeyDown={(e) => handleEditorKeyboardShortcuts(e, block.id, updateBlock)}
      data-placeholder="Start typing…"
      style={{
        fontSize: "1rem",
        lineHeight: 1.75,
        color: "var(--text-primary)",
        outline: "none",
        minHeight: "1.75em",
      }}
      {...(!isFocused
        ? {
            dangerouslySetInnerHTML: {
              __html: renderInlineMarkdown(text) || "",
            },
          }
        : {})}
    />
  );
}
