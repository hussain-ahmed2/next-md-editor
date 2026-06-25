"use client";

import { useRef, useCallback } from "react";
import { useEditorStore } from "@next-md-editor/editor-core";
import type { Block } from "@next-md-editor/types";
import {
  handleEditorKeyboardShortcuts,
  htmlToMarkdown,
} from "@/utils/editorShortcuts";
import { renderInlineMarkdown } from "@/features/markdown/highlighter";
import { useBlockFocus } from "@/hooks/useBlockFocus";
import { useContentSync } from "@/hooks/useContentSync";

export function QuoteBlock({ block }: { block: Block }) {
  const blocks = useEditorStore((s) => s.blocks);
  const addBlock = useEditorStore((s) => s.addBlock);
  const removeBlocks = useEditorStore((s) => s.removeBlocks);
  const updateBlock = useEditorStore((s) => s.updateBlock);
  const selectBlock = useEditorStore((s) => s.selectBlock);
  const selectedBlockIds = useEditorStore((s) => s.selectedBlockIds);

  const text = (block.props.text as string) ?? "";
  const ref = useRef<HTMLDivElement>(null);

  // Auto-focus synchronization when block is selected
  useBlockFocus(ref, block.id, selectedBlockIds);

  const { handleInput: syncInput, handleBlur: syncBlur } = useContentSync({
    blockId: block.id,
    ref,
    storeValue: text,
    updatePropName: "text",
    parseHtml: htmlToMarkdown,
    serializeToHtml: renderInlineMarkdown,
  });

  const handleInput = useCallback(
    (e: React.FormEvent<HTMLDivElement>) => {
      syncInput(e);
    },
    [syncInput],
  );

  const handleBlur = useCallback(
    () => {
      syncBlur();
    },
    [syncBlur],
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
          background: "var(--border)",
          flexShrink: 0,
          alignSelf: "stretch",
        }}
      />
      <div
        ref={ref}
        contentEditable
        data-block-id={block.id}
        suppressContentEditableWarning
        onBlur={handleBlur}
        onInput={handleInput}
        onKeyDown={(e) =>
          handleEditorKeyboardShortcuts(
            e,
            block,
            blocks,
            selectedBlockIds,
            addBlock,
            removeBlocks,
            updateBlock,
            selectBlock,
          )
        }
        style={{
          flex: 1,
          fontSize: "15px",
          lineHeight: 1.6,
          color: "var(--text-secondary)",
          fontStyle: "normal",
          outline: "none",
          minHeight: "1.6em",
        }}
      />
    </div>
  );
}
