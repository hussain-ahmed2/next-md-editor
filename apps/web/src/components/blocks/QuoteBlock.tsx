"use client";

import { useState, useRef, useEffect } from "react";
import { useEditorStore } from "@next-md-editor/editor-core";
import type { Block } from "@next-md-editor/types";
import {
  handleEditorKeyboardShortcuts,
  htmlToMarkdown,
} from "@/utils/editorShortcuts";
import { renderInlineMarkdown } from "@/features/markdown/highlighter";

export function QuoteBlock({ block }: { block: Block }) {
  const blocks = useEditorStore((s) => s.blocks);
  const addBlock = useEditorStore((s) => s.addBlock);
  const removeBlock = useEditorStore((s) => s.removeBlock);
  const updateBlock = useEditorStore((s) => s.updateBlock);
  const selectBlock = useEditorStore((s) => s.selectBlock);
  const selectedBlockId = useEditorStore((s) => s.selectedBlockId);

  const text = (block.props.text as string) ?? "";
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

  // Sync state changes from store to DOM when they differ (e.g. on undo/redo)
  useEffect(() => {
    if (ref.current) {
      const currentMarkdown = htmlToMarkdown(ref.current.innerHTML);
      if (currentMarkdown !== text) {
        ref.current.innerHTML = renderInlineMarkdown(text);

        // Reset caret to the end if focused
        if (document.activeElement === ref.current) {
          const range = document.createRange();
          range.selectNodeContents(ref.current);
          range.collapse(false);
          const selection = window.getSelection();
          if (selection) {
            selection.removeAllRanges();
            selection.addRange(range);
          }
        }
      }
    }
  }, [text]);

  // When entering focus, snap caret and ensure text is populated
  useEffect(() => {
    if (isFocused && ref.current) {
      ref.current.innerHTML = renderInlineMarkdown(text);
      const range = document.createRange();
      range.selectNodeContents(ref.current);
      range.collapse(false);
      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(range);
      }
    }
  }, [isFocused]);

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
      style={{
        display: "flex",
        gap: 14,
        padding: "0 16px",
        borderRadius: "0",
        background: "transparent",
      }}
    >
      <div
        style={{
          width: 4,
          borderRadius: 0,
          background: "#30363d",
          flexShrink: 0,
          alignSelf: "stretch",
        }}
      />
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
          flex: 1,
          fontSize: "15px",
          lineHeight: 1.6,
          color: "#8b949e",
          fontStyle: "normal",
          outline: "none",
          minHeight: "1.6em",
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
