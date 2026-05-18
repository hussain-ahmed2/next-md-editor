"use client";

import { useState, useRef, useEffect } from "react";
import { useEditorStore } from "@next-md-editor/editor-core";
import type { Block } from "@next-md-editor/types";
import {
  handleEditorKeyboardShortcuts,
  htmlToMarkdown,
} from "@/utils/editorShortcuts";
import { renderInlineMarkdown } from "@/features/markdown/highlighter";

const LEVEL_STYLES: Record<
  number,
  {
    fontSize: string;
    fontWeight: number;
    lineHeight: string;
    borderBottom?: string;
    paddingBottom?: string;
    marginBottom?: string;
  }
> = {
  1: {
    fontSize: "2em",
    fontWeight: 600,
    lineHeight: "1.25",
    borderBottom: "1px solid #30363d",
    paddingBottom: "0.3em",
    marginBottom: "8px",
  },
  2: {
    fontSize: "1.5em",
    fontWeight: 600,
    lineHeight: "1.25",
    borderBottom: "1px solid #30363d",
    paddingBottom: "0.3em",
    marginBottom: "8px",
  },
  3: { fontSize: "1.25em", fontWeight: 600, lineHeight: "1.25" },
};

export function HeadingBlock({ block }: { block: Block }) {
  const blocks = useEditorStore((s) => s.blocks);
  const addBlock = useEditorStore((s) => s.addBlock);
  const removeBlock = useEditorStore((s) => s.removeBlock);
  const updateBlock = useEditorStore((s) => s.updateBlock);
  const selectBlock = useEditorStore((s) => s.selectBlock);
  const selectedBlockId = useEditorStore((s) => s.selectedBlockId);

  const level = (block.props.level as number) ?? 1;
  const text = (block.props.text as string) ?? "";
  const style = LEVEL_STYLES[level] ?? LEVEL_STYLES[1];
  const [isFocused, setIsFocused] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Auto-focus synchronization when block is selected
  useEffect(() => {
    if (
      selectedBlockId === block.id &&
      ref.current &&
      document.activeElement !== ref.current
    ) {
      ref.current.focus();
    }
  }, [selectedBlockId, block.id, ref]);

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
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <div style={{ display: "flex", gap: 6, marginBottom: 2 }}>
        {[1, 2, 3].map((l) => (
          <button
            key={l}
            onClick={(e) => {
              e.stopPropagation();
              updateBlock(block.id, { level: l });
            }}
            style={{
              padding: "1px 7px",
              fontSize: 11,
              fontWeight: 700,
              borderRadius: 4,
              border: "1px solid",
              borderColor: level === l ? "var(--accent)" : "var(--border)",
              background: level === l ? "var(--accent-muted)" : "transparent",
              color: level === l ? "var(--accent)" : "var(--text-muted)",
              cursor: "pointer",
              fontFamily: "var(--font-mono)",
            }}
          >
            H{l}
          </button>
        ))}
      </div>
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onFocus={() => setIsFocused(true)}
        onBlur={handleBlur}
        onInput={handleInput}
        onKeyDown={(e) =>
          handleEditorKeyboardShortcuts(
            e,
            block,
            blocks,
            addBlock,
            removeBlock,
            updateBlock,
            selectBlock,
          )
        }
        style={{
          ...style,
          color: "var(--text-primary)",
          outline: "none",
          minHeight: "1.4em",
          letterSpacing: level === 1 ? "-0.03em" : "-0.01em",
        }}
        {...(!isFocused
          ? {
              dangerouslySetInnerHTML: {
                __html: renderInlineMarkdown(text) || "",
              },
            }
          : {})}
      />
    </div>
  );
}
