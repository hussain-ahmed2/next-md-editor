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
        ref.current.textContent = text;

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
  }, [text, ref]);

  // When entering focus, snap caret and ensure text is populated
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

  // Smart visual decorations for lists and todo checkboxes on blur
  const isTodo =
    !isFocused &&
    (text.startsWith("- [ ") ||
      text.startsWith("- [x] ") ||
      text.startsWith("- [ ] "));
  const isBullet =
    !isFocused && !isTodo && (text.startsWith("- ") || text.startsWith("* "));
  const numberMatch =
    !isFocused && !isTodo && !isBullet && text.match(/^(\d+)\.\s(.*)$/);

  if (isTodo) {
    const checked = text.startsWith("- [x] ");
    const cleanText = text.startsWith("- [x] ")
      ? text.slice(6)
      : text.startsWith("- [ ] ")
        ? text.slice(6)
        : text.slice(5);
    return (
      <div
        style={{
          display: "flex",
          gap: 10,
          alignItems: "center",
          width: "100%",
          paddingLeft: 4,
        }}
      >
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => {
            const nextText = checked
              ? `- [ ] ${cleanText}`
              : `- [x] ${cleanText}`;
            updateBlock(block.id, { text: nextText });
          }}
          style={{
            cursor: "pointer",
            width: 16,
            height: 16,
            borderRadius: 4,
            border: "1px solid var(--border)",
            accentColor: "var(--accent)",
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
            fontSize: "1rem",
            lineHeight: 1.75,
            color: checked ? "var(--text-secondary)" : "var(--text-primary)",
            textDecoration: checked ? "line-through" : "none",
            outline: "none",
            minHeight: "1.75em",
          }}
          dangerouslySetInnerHTML={{
            __html: renderInlineMarkdown(cleanText) || "",
          }}
        />
      </div>
    );
  }

  if (isBullet) {
    const cleanText = text.slice(2);
    return (
      <div
        style={{
          display: "flex",
          gap: 10,
          alignItems: "flex-start",
          width: "100%",
          paddingLeft: 8,
        }}
      >
        <span
          style={{
            color: "var(--text-secondary)",
            userSelect: "none",
            marginTop: 1,
          }}
        >
          •
        </span>
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
            fontSize: "1rem",
            lineHeight: 1.75,
            color: "var(--text-primary)",
            outline: "none",
            minHeight: "1.75em",
          }}
          dangerouslySetInnerHTML={{
            __html: renderInlineMarkdown(cleanText) || "",
          }}
        />
      </div>
    );
  }

  if (numberMatch) {
    const num = numberMatch[1];
    const cleanText = numberMatch[2];
    return (
      <div
        style={{
          display: "flex",
          gap: 10,
          alignItems: "flex-start",
          width: "100%",
          paddingLeft: 8,
        }}
      >
        <span
          style={{
            color: "var(--text-secondary)",
            userSelect: "none",
            minWidth: 20,
          }}
        >
          {num}.
        </span>
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
            fontSize: "1rem",
            lineHeight: 1.75,
            color: "var(--text-primary)",
            outline: "none",
            minHeight: "1.75em",
          }}
          dangerouslySetInnerHTML={{
            __html: renderInlineMarkdown(cleanText) || "",
          }}
        />
      </div>
    );
  }

  return (
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
