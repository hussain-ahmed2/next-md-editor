"use client";

import { useState, useRef, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import { useEditorStore } from "@next-md-editor/editor-core";
import { BlockRegistry } from "@next-md-editor/editor-core";
import type { Block, RichText } from "@next-md-editor/types";
import {
  richTextToHtml,
  htmlToRichText,
  markdownToRichText,
  getSelectionRichRange,
  applyRichFormat,
} from "@next-md-editor/markdown";
import { SlashCommandMenu } from "@/components/editor/SlashCommandMenu";
import { LinkDialog } from "@/components/editor/LinkDialog";
import { useBlockFocus } from "@/hooks/useBlockFocus";
import { useContentSync } from "@/hooks/useContentSync";

export function ParagraphBlock({ block }: { block: Block }) {
  const blocks = useEditorStore((s) => s.blocks);
  const addBlock = useEditorStore((s) => s.addBlock);
  const removeBlocks = useEditorStore((s) => s.removeBlocks);
  const updateBlock = useEditorStore((s) => s.updateBlock);
  const replaceBlock = useEditorStore((s) => s.replaceBlock);
  const selectBlock = useEditorStore((s) => s.selectBlock);
  const selectedBlockIds = useEditorStore((s) => s.selectedBlockIds);

  const content: RichText = Array.isArray(block.props.content)
    ? (block.props.content as RichText)
    : typeof block.props.text === "string"
      ? markdownToRichText(block.props.text as string)
      : [];

  const [linkDialog, setLinkDialog] = useState<{
    url: string;
    pos: { top: number; left: number };
  } | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  // Slash Command State
  const [slashMenuOpen, setSlashMenuOpen] = useState(false);
  const [slashSearchText, setSlashSearchText] = useState("");
  const [slashSelectedIndex, setSlashSelectedIndex] = useState(0);

  // Auto-focus synchronization when block is selected
  useBlockFocus(ref, block.id, selectedBlockIds);

  const { handleInput: syncInput, handleBlur: syncBlur, flushUpdate } = useContentSync({
    blockId: block.id,
    ref,
    storeValue: content,
    updatePropName: "content",
    parseHtml: htmlToRichText,
    serializeToHtml: richTextToHtml,
    onInputCallback: (rawText) => {
      // Slash command detection
      const match = rawText.match(/(^|\s)\/([a-zA-Z0-9]*)$/);
      if (match) {
        setSlashMenuOpen(true);
        setSlashSearchText(match[2]);
        setSlashSelectedIndex(0);
      } else {
        setSlashMenuOpen(false);
      }
    }
  });

  const handleInput = useCallback(
    (e: React.FormEvent<HTMLDivElement>) => {
      syncInput(e);
    },
    [syncInput],
  );

  const handleBlur = useCallback(
    () => {
      setTimeout(() => setSlashMenuOpen(false), 200);
      syncBlur();
    },
    [syncBlur],
  );

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (slashMenuOpen) {
        const allBlocks = BlockRegistry.getAll();
        const filteredBlocks = allBlocks.filter((def) =>
          def.type.toLowerCase().includes(slashSearchText.toLowerCase()),
        );

        if (e.key === "ArrowDown") {
          e.preventDefault();
          setSlashSelectedIndex((prev) => (prev + 1) % filteredBlocks.length);
          return;
        } else if (e.key === "ArrowUp") {
          e.preventDefault();
          setSlashSelectedIndex(
            (prev) => (prev - 1 + filteredBlocks.length) % filteredBlocks.length,
          );
          return;
        } else if (e.key === "Enter" && filteredBlocks.length > 0) {
          e.preventDefault();
          const def = filteredBlocks[slashSelectedIndex];
          setSlashMenuOpen(false);
          replaceBlock(block.id, { type: def.type, props: def.defaultProps || {} });
          return;
        } else if (e.key === "Escape") {
          e.preventDefault();
          setSlashMenuOpen(false);
          return;
        }
      }

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
        const text = ref.current?.textContent ?? "";
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

      // Ctrl+K / Cmd+K for link
      const hasMeta = e.ctrlKey || e.metaKey;
      if (hasMeta && e.key.toLowerCase() === "k") {
        e.preventDefault();
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
    },
    [
      block.id,
      blocks,
      slashMenuOpen,
      slashSearchText,
      slashSelectedIndex,
      addBlock,
      removeBlocks,
      replaceBlock,
      selectBlock,
    ],
  );

  const slashMenu = slashMenuOpen ? (
    <SlashCommandMenu
      isOpen={true}
      position={{ top: 0, left: 0 }}
      searchText={slashSearchText}
      selectedIndex={slashSelectedIndex}
      onSelect={(type, defaultProps) => {
        setSlashMenuOpen(false);
        replaceBlock(block.id, { type, props: defaultProps });
      }}
    />
  ) : null;

  return (
    <div style={{ position: "relative", width: "100%" }}>
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        data-block-id={block.id}
        onBlur={handleBlur}
        onInput={handleInput}
        onKeyDown={onKeyDown}
        style={{
          flex: 1,
          fontSize: "1rem",
          lineHeight: 1.75,
          color: "var(--text-primary)",
          outline: "none",
          minHeight: "1.75em",
        }}
        data-placeholder="Start typing…"
      />
      {slashMenu}
      {linkDialog && (
        <LinkDialog
          initialUrl={linkDialog.url}
          position={linkDialog.pos}
          onApply={(url) => {
            flushUpdate();
            const freshContent = useEditorStore.getState().blocks.find((b) => b.id === block.id)?.props.content as RichText || content;
            const range = getSelectionRichRange(freshContent, ref.current!);
            if (!range || range.start >= range.end) return;
            const newContent = applyRichFormat(freshContent, range.start, range.end, { link: url });
            updateBlock(block.id, { content: newContent });
            setLinkDialog(null);
          }}
          onCancel={() => setLinkDialog(null)}
        />
      )}
    </div>
  );
}
