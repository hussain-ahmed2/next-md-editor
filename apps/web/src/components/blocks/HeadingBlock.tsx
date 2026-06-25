"use client";

import { useState, useRef, useCallback } from "react";
import { useEditorStore } from "@next-md-editor/editor-core";
import type { Block } from "@next-md-editor/types";
import {
  handleEditorKeyboardShortcuts,
  htmlToMarkdown,
} from "@/utils/editorShortcuts";
import { renderInlineMarkdown } from "@/features/markdown/highlighter";
import { LinkDialog } from "@/components/editor/LinkDialog";
import { useBlockFocus } from "@/hooks/useBlockFocus";
import { useContentSync } from "@/hooks/useContentSync";

const LEVEL_STYLES: Record<
  number,
  {
    fontSize: string;
    fontWeight: number;
    lineHeight: string;
    borderBottom?: string;
    paddingBottom?: string;
    marginBottom?: string;
    color?: string;
  }
> = {
  1: {
    fontSize: "2em",
    fontWeight: 600,
    lineHeight: "1.25",
    borderBottom: "1px solid var(--border-subtle)",
    paddingBottom: "0.3em",
    marginBottom: "8px",
  },
  2: {
    fontSize: "1.5em",
    fontWeight: 600,
    lineHeight: "1.25",
    borderBottom: "1px solid var(--border-subtle)",
    paddingBottom: "0.3em",
    marginBottom: "8px",
  },
  3: { fontSize: "1.25em", fontWeight: 600, lineHeight: "1.25" },
  4: { fontSize: "1.1em", fontWeight: 600, lineHeight: "1.25" },
  5: { fontSize: "1em", fontWeight: 600, lineHeight: "1.25" },
  6: { fontSize: "0.85em", fontWeight: 600, lineHeight: "1.25", color: "var(--text-muted)" },
};

export function HeadingBlock({ block }: { block: Block }) {
  const blocks = useEditorStore((s) => s.blocks);
  const addBlock = useEditorStore((s) => s.addBlock);
  const removeBlocks = useEditorStore((s) => s.removeBlocks);
  const updateBlock = useEditorStore((s) => s.updateBlock);
  const selectBlock = useEditorStore((s) => s.selectBlock);
  const selectedBlockIds = useEditorStore((s) => s.selectedBlockIds);


  const level = (block.props.level as number) ?? 1;
  const text = (block.props.text as string) ?? "";
  const style = LEVEL_STYLES[level] ?? LEVEL_STYLES[1];
  const [linkDialog, setLinkDialog] = useState<{
    url: string;
    pos: { top: number; left: number };
  } | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  // Auto-focus synchronization when block is selected
  useBlockFocus(ref, block.id, selectedBlockIds);

  const { handleInput: syncInput, handleBlur: syncBlur, flushUpdate } = useContentSync({
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
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <div style={{ display: "flex", gap: 6, marginBottom: 2 }}>
        {[1, 2, 3, 4, 5, 6].map((l) => (
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
        data-block-id={block.id}
        suppressContentEditableWarning
        onBlur={handleBlur}
        onInput={handleInput}
        onKeyDown={(e) => {
          const hasMeta = e.ctrlKey || e.metaKey;
          if (hasMeta && e.key.toLowerCase() === "k") {
            e.preventDefault();
            e.stopPropagation();
            const sel = window.getSelection();
            if (!sel || sel.isCollapsed || !sel.rangeCount) return;
            const range = sel.getRangeAt(0);
            const rect = range.getBoundingClientRect();
            setLinkDialog({
              url: "https://",
              pos: { top: rect.top - 8, left: rect.left + rect.width / 2 },
            });
            return;
          }
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
        }}
        style={{
          ...style,
          color: "var(--text-primary)",
          outline: "none",
          minHeight: "1.4em",
          letterSpacing: level === 1 ? "-0.03em" : "-0.01em",
        }}
      />
      {linkDialog && (
        <LinkDialog
          initialUrl={linkDialog.url}
          position={linkDialog.pos}
          onApply={(url) => {
            const el = ref.current;
            if (!el) return;
            el.focus();
            document.execCommand("createLink", false, url);
            flushUpdate();
            setLinkDialog(null);
          }}
          onCancel={() => setLinkDialog(null)}
        />
      )}
    </div>
  );
}
