import React from "react";

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

  // 3. Convert inline code blocks
  text = text.replace(/<code[^>]*>(.*?)<\/code>/gi, "`$1`");

  // 4. Convert hyperlink structures
  text = text.replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, "[$2]($1)");

  // 5. Clean up standard editor container wrappers & breaks
  text = text.replace(/<br\s*\/?>/gi, "\n");
  text = text.replace(/<div[^>]*>(.*?)<\/div>/gi, "\n$1");
  text = text.replace(/<p[^>]*>(.*?)<\/p>/gi, "\n$1");

  // 6. Strip all other browser-injected HTML markup
  text = text.replace(/<[^>]*>/g, "");

  // 7. Decode HTML entities cleanly
  text = text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ");

  return text.trim();
}

/**
 * Intercepts keyboard shortcuts for contentEditable blocks.
 * - Bold (Ctrl/Cmd+B): Let browser format visually in real-time, saved as **markdown** on blur.
 * - Italic (Ctrl/Cmd+I): Let browser format visually in real-time, saved as *markdown* on blur.
 * - Link (Ctrl/Cmd+K): Prompts for hyperlinking, wrapped programmatically.
 */
export function handleEditorKeyboardShortcuts(
  e: React.KeyboardEvent<HTMLDivElement>,
  blockId: string,
  updateBlock: (id: string, props: any) => void
) {
  const hasMeta = e.ctrlKey || e.metaKey;
  const key = e.key.toLowerCase();

  if (hasMeta && (key === "b" || key === "i" || key === "k")) {
    if (key === "k") {
      e.preventDefault();

      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return;
      const range = selection.getRangeAt(0);
      const selectedText = range.toString();

      // Extract leading/trailing space for clean formatting
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

      updateBlock(blockId, { text: htmlToMarkdown(e.currentTarget.innerHTML) });
    }
    // Note: For 'b' and 'i', we intentionally do NOT call e.preventDefault().
    // This allows the browser's native editor to apply direct visual bolding/italics
    // on the screen inside the block. When the user blurs, htmlToMarkdown parses the HTML back to **markdown**!
  }
}
