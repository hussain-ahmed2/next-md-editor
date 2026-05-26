"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import { useEditorStore } from "@next-md-editor/editor-core";
import type { Block, RichText } from "@next-md-editor/types";
import {
  richTextToHtml,
  htmlToRichText,
  richTextLength,
  restoreDomRange,
  getDomTextOffset,
  markdownToRichText,
} from "@next-md-editor/markdown";

export function QuoteBlock({ block }: { block: Block }) {
  const blocks = useEditorStore((s) => s.blocks);
  const addBlock = useEditorStore((s) => s.addBlock);
  const removeBlocks = useEditorStore((s) => s.removeBlocks);
  const updateBlock = useEditorStore((s) => s.updateBlock);
  const selectBlock = useEditorStore((s) => s.selectBlock);
  const selectedBlockIds = useEditorStore((s) => s.selectedBlockIds);
  const indentBlocks = useEditorStore((s) => s.indentBlocks);
  const outdentBlocks = useEditorStore((s) => s.outdentBlocks);

  const content: RichText = Array.isArray(block.props.content)
    ? (block.props.content as RichText)
    : typeof block.props.text === "string"
      ? markdownToRichText(block.props.text as string)
      : [];

  const [isFocused, setIsFocused] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Auto-focus synchronization when block is selected
  useEffect(() => {
    const isSelected = selectedBlockIds[selectedBlockIds.length - 1] === block.id;
    if (isSelected && ref.current && document.activeElement !== ref.current) {
      ref.current.focus();
    }
  }, [selectedBlockIds, block.id, ref]);

  // Sync store changes to DOM — preserves caret position
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const newHtml = richTextToHtml(content);
    if (el.innerHTML === newHtml) return;

    const isFocusedNow = document.activeElement === el;
    let savedStart = -1;
    let savedEnd = -1;
    if (isFocusedNow) {
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0 && sel.anchorNode && sel.focusNode && el.contains(sel.anchorNode) && el.contains(sel.focusNode)) {
        savedStart = getDomTextOffset(el, sel.anchorNode, sel.anchorOffset);
        savedEnd = getDomTextOffset(el, sel.focusNode, sel.focusOffset);
      }
    }

    el.innerHTML = newHtml;

    if (savedStart >= 0) {
      const len = richTextLength(content);
      restoreDomRange(el, Math.min(savedStart, len), Math.min(savedEnd, len));
    }
  }, [content, ref]);

  // When entering focus, ensure content is rendered and caret at end
  useEffect(() => {
    if (isFocused && ref.current) {
      const html = richTextToHtml(content);
      if (ref.current.innerHTML !== html) {
        ref.current.innerHTML = html;
      }
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0 && ref.current.contains(sel.anchorNode)) return;
      restoreDomRange(ref.current, richTextLength(content), richTextLength(content));
    }
  }, [isFocused, content]);

  const handleInput = useCallback(
    (e: React.FormEvent<HTMLDivElement>) => {
      const newContent = htmlToRichText(e.currentTarget.innerHTML);
      updateBlock(block.id, { content: newContent });
    },
    [block.id, updateBlock],
  );

  const handleBlur = useCallback(
    (e: React.FocusEvent<HTMLDivElement>) => {
      setIsFocused(false);
      const newContent = htmlToRichText(e.currentTarget.innerHTML);
      updateBlock(block.id, { content: newContent });
    },
    [block.id, updateBlock],
  );

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        const currentIndex = blocks.findIndex((b) => b.id === block.id);
        if (currentIndex !== -1) {
          addBlock(
            {
              id: uuidv4(),
              type: "paragraph",
              props: { content: [] },
            },
            currentIndex + 1,
          );
        }
        return;
      }

      if (e.key === "Backspace") {
        const text = content.reduce((acc: string, s: any) => acc + s.text, "");
        if (text === "") {
          e.preventDefault();
          const currentIndex = blocks.findIndex((b) => b.id === block.id);
          if (currentIndex > 0) {
            selectBlock(blocks[currentIndex - 1].id);
          }
          removeBlocks([block.id]);
          return;
        }
      }

      if (e.key === "Tab") {
        e.preventDefault();
        if (e.shiftKey) {
          outdentBlocks([block.id]);
        } else {
          indentBlocks([block.id]);
        }
        return;
      }
    },
    [block.id, blocks, content, addBlock, removeBlocks, selectBlock, indentBlocks, outdentBlocks],
  );

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
        data-block-id={block.id}
        onFocus={() => setIsFocused(true)}
        onBlur={handleBlur}
        onInput={handleInput}
        onKeyDown={onKeyDown}
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
