"use client";

import { useState, useRef, useEffect, useContext } from "react";
import { v4 as uuidv4 } from "uuid";
import { useEditorStore } from "@next-md-editor/editor-core";
import type { Block } from "@next-md-editor/types";
import {
  handleEditorKeyboardShortcuts,
  htmlToMarkdown,
} from "@/utils/editorShortcuts";
import { renderInlineMarkdown } from "@/features/markdown/highlighter";
import { SlashCommandMenu } from "@/components/editor/SlashCommandMenu";
import { BlockRegistry } from "@next-md-editor/editor-core";
import { BlockDepthContext } from "@/components/editor/SortableBlock";

function toRoman(n: number): string {
  const vals = [1000,900,500,400,100,90,50,40,10,9,5,4,1];
  const syms = ["m","cm","d","cd","c","xc","l","xl","x","ix","v","iv","i"];
  let result = "";
  for (let i = 0; i < vals.length; i++) {
    while (n >= vals[i]) { result += syms[i]; n -= vals[i]; }
  }
  return result;
}

function getListMarker(num: number, depth: number): string {
  const style = depth % 3;
  if (style === 0) return `${num}.`;
  if (style === 1) return `${toRoman(num)}.`;
  return `${String.fromCharCode(96 + num)}.`;
}

export function ParagraphBlock({ block }: { block: Block }) {
  const blocks = useEditorStore((s) => s.blocks);
  const addBlock = useEditorStore((s) => s.addBlock);
  const removeBlocks = useEditorStore((s) => s.removeBlocks);
  const updateBlock = useEditorStore((s) => s.updateBlock);
  const replaceBlock = useEditorStore((s) => s.replaceBlock);
  const selectBlock = useEditorStore((s) => s.selectBlock);
  const selectedBlockIds = useEditorStore((s) => s.selectedBlockIds);
  const indentBlocks = useEditorStore((s) => s.indentBlocks);
  const outdentBlocks = useEditorStore((s) => s.outdentBlocks);

  const depth = useContext(BlockDepthContext);

  const text = (block.props.text as string) ?? "";
  const [isFocused, setIsFocused] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Slash Command State
  const [slashMenuOpen, setSlashMenuOpen] = useState(false);
  const [slashSearchText, setSlashSearchText] = useState("");
  const [slashSelectedIndex, setSlashSelectedIndex] = useState(0);

  // Smart visual decorations for lists and todo checkboxes
  const isTodo =
    text.startsWith("- [ ") ||
    text.startsWith("- [x] ") ||
    text.startsWith("- [ ] ");
  const isBullet =
    !isTodo && (text.startsWith("- ") || text.startsWith("* "));
  const numberMatch =
    !isTodo && !isBullet && text.match(/^(\d+)\.\s(.*)$/);

  // Extract clean text from store value for visual editing
  let cleanText = text;
  if (isTodo) {
    cleanText = text.startsWith("- [x] ")
      ? text.slice(6)
      : text.startsWith("- [ ] ")
        ? text.slice(6)
        : text.slice(5);
  } else if (isBullet) {
    cleanText = text.slice(2);
  } else if (numberMatch) {
    cleanText = numberMatch[2];
  }

  // Auto-focus synchronization when block is selected
  useEffect(() => {
    const isSelected = selectedBlockIds[selectedBlockIds.length - 1] === block.id;
    if (isSelected && ref.current && document.activeElement !== ref.current) {
      ref.current.focus();
    }
  }, [selectedBlockIds, block.id, ref]);

  // Sync state changes from store to DOM when they differ (e.g. on undo/redo)
  useEffect(() => {
    if (ref.current) {
      const currentMarkdown = htmlToMarkdown(ref.current.innerHTML);
      if (currentMarkdown !== cleanText) {
        ref.current.innerHTML = renderInlineMarkdown(cleanText) || "";

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
  }, [cleanText]);

  // When entering focus, snap caret and ensure text is populated
  useEffect(() => {
    if (isFocused && ref.current) {
      ref.current.innerHTML = renderInlineMarkdown(cleanText) || "";
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

  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    let rawText = htmlToMarkdown(e.currentTarget.innerHTML);
    
    // Slash command detection
    const match = rawText.match(/(^|\s)\/([a-zA-Z0-9]*)$/);
    if (match) {
      setSlashMenuOpen(true);
      setSlashSearchText(match[2]);
      setSlashSelectedIndex(0);
    } else {
      setSlashMenuOpen(false);
    }

    if (isTodo) {
      const checked = text.startsWith("- [x] ");
      rawText = checked ? `- [x] ${rawText}` : `- [ ] ${rawText}`;
    } else if (isBullet) {
      rawText = `- ${rawText}`;
    } else if (numberMatch) {
      rawText = `${numberMatch[1]}. ${rawText}`;
    }
    updateBlock(block.id, { text: rawText });
  };

  const handleBlur = (e: React.FocusEvent<HTMLDivElement>) => {
    setIsFocused(false);
    // Delay closing to allow clicking the menu
    setTimeout(() => setSlashMenuOpen(false), 200);

    let rawText = htmlToMarkdown(e.currentTarget.innerHTML);
    if (isTodo) {
      const checked = text.startsWith("- [x] ");
      rawText = checked ? `- [x] ${rawText}` : `- [ ] ${rawText}`;
    } else if (isBullet) {
      rawText = `- ${rawText}`;
    } else if (numberMatch) {
      rawText = `${numberMatch[1]}. ${rawText}`;
    }
    updateBlock(block.id, { text: rawText });
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (slashMenuOpen) {
      const allBlocks = BlockRegistry.getAll();
      const filteredBlocks = allBlocks.filter((def) => 
        def.type.toLowerCase().includes(slashSearchText.toLowerCase())
      );

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSlashSelectedIndex((prev) => (prev + 1) % filteredBlocks.length);
        return;
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSlashSelectedIndex((prev) => (prev - 1 + filteredBlocks.length) % filteredBlocks.length);
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

    // Smart Enter key handling for lists
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      
      // If the user hits enter on an empty list item, exit the list format
      if (cleanText.trim() === "" && (isTodo || isBullet || numberMatch)) {
        updateBlock(block.id, { text: "" });
        return;
      }

      // Calculate prefix for the new block
      let nextText = "";
      if (isTodo) {
        nextText = "- [ ] ";
      } else if (isBullet) {
        nextText = "- ";
      } else if (numberMatch) {
        nextText = `${parseInt(numberMatch[1]) + 1}. `;
      }

      const currentIndex = blocks.findIndex((b) => b.id === block.id);
      if (currentIndex !== -1) {
        addBlock(
          {
            id: uuidv4(),
            type: "paragraph",
            props: { text: nextText },
          },
          currentIndex + 1
        );
      }
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
      indentBlocks,
      outdentBlocks,
    );
  };

  const slashMenu = (
    <SlashCommandMenu
      isOpen={slashMenuOpen}
      position={{ top: 0, left: 0 }}
      searchText={slashSearchText}
      selectedIndex={slashSelectedIndex}
      onSelect={(type, defaultProps) => {
        setSlashMenuOpen(false);
        replaceBlock(block.id, { type, props: defaultProps });
      }}
    />
  );

  const commonProps = {
    ref,
    contentEditable: true,
    suppressContentEditableWarning: true,
    onFocus: () => setIsFocused(true),
    onBlur: handleBlur,
    onInput: handleInput,
    onKeyDown,
    style: {
      flex: 1,
      fontSize: "1rem",
      lineHeight: 1.75,
      color: "var(--text-primary)",
      outline: "none",
      minHeight: "1.75em",
    } as React.CSSProperties
  };

  const innerHTMLProp = !isFocused
    ? {
        dangerouslySetInnerHTML: {
          __html: renderInlineMarkdown(cleanText) || "",
        },
      }
    : {};

  const checked = isTodo && text.startsWith("- [x] ");

  return (
    <div style={{ 
      position: "relative", 
      display: "flex", 
      gap: 10, 
      alignItems: isTodo ? "center" : "flex-start", 
      width: "100%", 
      paddingLeft: isTodo ? 4 : (isBullet || numberMatch) ? 8 : 0 
    }}>
      {isTodo && (
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => {
            const nextText = checked ? `- [ ] ${cleanText}` : `- [x] ${cleanText}`;
            updateBlock(block.id, { text: nextText });
          }}
          style={{ cursor: "pointer", width: 16, height: 16, borderRadius: 4, border: "1px solid var(--border)", accentColor: "var(--accent)" }}
        />
      )}
      
      {isBullet && (
        <span style={{ color: "var(--text-secondary)", userSelect: "none", marginTop: 1 }}>•</span>
      )}

      {numberMatch && (
        <span style={{ color: "var(--text-secondary)", userSelect: "none", minWidth: 24, fontVariantNumeric: "tabular-nums" }}>
          {getListMarker(parseInt(numberMatch[1]), depth)}
        </span>
      )}

      <div
        {...commonProps}
        style={{
          ...commonProps.style,
          color: checked ? "var(--text-secondary)" : "var(--text-primary)",
          textDecoration: checked ? "line-through" : "none",
        }}
        data-placeholder="Start typing…"
        {...innerHTMLProp}
      />
      {slashMenu}
    </div>
  );
}
