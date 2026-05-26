import React from "react";
import { v4 as uuidv4 } from "uuid";
import type { Block } from "@next-md-editor/types";

/**
 * Converts rich visual HTML inside contentEditable back into clean Markdown.
 * Intercepts visual browser tags like <b>, <strong>, <i>, <em>, <code> and <a>
 * and translates them back to standard GFM syntax.
 */
export function htmlToMarkdown(html: string): string {
  if (!html) return "";

  let text = html;

  // 1. Convert bold structures
  text = text.replace(/<(strong|b)>(.*?)<\/\1>/gi, "**$2**");

  // 2. Convert italic structures
  text = text.replace(/<(em|i)>(.*?)<\/\1>/gi, "*$2*");

  // 3. Convert strikethrough
  text = text.replace(/<(del|s|strike)>(.*?)<\/\1>/gi, "~~$2~~");

  // 4. Convert inline code blocks
  text = text.replace(/<code[^>]*>(.*?)<\/code>/gi, "`$1`");

  // 5. Convert hyperlink structures
  text = text.replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, "[$2]($1)");

  // 6. Clean up standard editor container wrappers & breaks
  text = text.replace(/<br\s*\/?>/gi, "\n");
  text = text.replace(/<div[^>]*>(.*?)<\/div>/gi, "\n$1");
  text = text.replace(/<p[^>]*>(.*?)<\/p>/gi, "\n$1");

  // 7. Strip all other browser-injected HTML markup
  text = text.replace(/<[^>]*>/g, "");

  // 8. Decode HTML entities cleanly
  text = text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ");

  return text.trim();
}

/**
 * Intercepts keyboard shortcuts for contentEditable blocks.
 * - Enter: Creates a new paragraph block directly below the active block.
 * - Backspace: If empty, deletes the active block and focuses the previous one.
 * - Bold (Ctrl/Cmd+B): Let browser format visually in real-time, saved as **markdown** on blur.
 * - Italic (Ctrl/Cmd+I): Let browser format visually in real-time, saved as *markdown* on blur.
 * - Link (Ctrl/Cmd+K): Prompts for hyperlinking, wrapped programmatically.
 */
export function handleEditorKeyboardShortcuts(
  e: React.KeyboardEvent<HTMLDivElement>,
  block: Block,
  blocks: Block[],
  selectedBlockIds: string[],
  addBlock: (block: Block, index?: number) => void,
  removeBlocks: (ids: string[]) => void,
  updateBlock: (id: string, props: any) => void,
  selectBlock: (id: string | null, extend?: boolean) => void,
  indentBlocks?: (ids: string[]) => void,
  outdentBlocks?: (ids: string[]) => void,
) {
  const hasMeta = e.ctrlKey || e.metaKey;
  const key = e.key.toLowerCase();

  // Tab: indent block; Shift+Tab: outdent block
  if (e.key === "Tab") {
    e.preventDefault();
    const idsToModify = selectedBlockIds.includes(block.id) ? selectedBlockIds : [block.id];
    if (e.shiftKey) {
      outdentBlocks?.(idsToModify);
    } else {
      indentBlocks?.(idsToModify);
    }
    return;
  }

  // Handle Shift + ArrowUp/ArrowDown for multi-selection
  if (e.shiftKey && (e.key === "ArrowUp" || e.key === "ArrowDown")) {
    const currentIndex = blocks.findIndex((b) => b.id === block.id);
    if (currentIndex !== -1) {
      e.preventDefault();
      const targetIndex = e.key === "ArrowUp" ? currentIndex - 1 : currentIndex + 1;
      if (targetIndex >= 0 && targetIndex < blocks.length) {
        selectBlock(blocks[targetIndex].id, true);
        // Focus management usually handled by useEffect in block, but we can rely on state
      }
    }
    return;
  }

  // 1. Enter Key creates a new Paragraph Block below the current block
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    const currentIndex = blocks.findIndex((b) => b.id === block.id);
    if (currentIndex !== -1) {
      addBlock(
        {
          id: uuidv4(),
          type: "paragraph",
          props: { text: "" },
        },
        currentIndex + 1
      );
    }
    return;
  }

  // 2. Backspace Key
  if (e.key === "Backspace" || e.key === "Delete") {
    // If multiple blocks are selected, delete all of them
    if (selectedBlockIds.length > 1) {
      e.preventDefault();
      removeBlocks(selectedBlockIds);
      return;
    }

    const rawText = e.currentTarget.textContent ?? "";
    if (rawText === "" && e.key === "Backspace") {
      e.preventDefault();
      const currentIndex = blocks.findIndex((b) => b.id === block.id);
      if (currentIndex > 0) {
        const previousBlock = blocks[currentIndex - 1];
        selectBlock(previousBlock.id);
      } else {
        selectBlock(null);
      }
      removeBlocks([block.id]);
      return;
    }
  }

  // 3. Bold, Italic, Link visual shortcuts
  if (hasMeta && (key === "b" || key === "i" || key === "k")) {
    if (key === "k") {
      e.preventDefault();

      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return;
      const range = selection.getRangeAt(0);
      const selectedText = range.toString();

      // Extract leading/trailing space for clean GFM formatting
      let startSpace = "";
      let endSpace = "";
      let cleanText = selectedText;

      const startMatch = selectedText.match(/^(\s+)/);
      if (startMatch) {
        startSpace = startMatch[1];
        cleanText = cleanText.slice(startSpace.length);
      }

      const endMatch = selectedText.match(/(\s+)$/);
      if (endMatch) {
        endSpace = endMatch[1];
        cleanText = cleanText.slice(0, cleanText.length - endSpace.length);
      }

      const textNode = document.createTextNode(startSpace + "[" + cleanText + "](url)" + endSpace);
      range.deleteContents();
      range.insertNode(textNode);

      updateBlock(block.id, { text: htmlToMarkdown(e.currentTarget.innerHTML) });
    }
    // For 'b' and 'i', browser native styling takes over, converted back to **markdown** on blur
  }
}
