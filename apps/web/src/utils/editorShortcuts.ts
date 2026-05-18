import React from "react";

/**
 * Global keyboard shortcuts helper for block-based contentEditable fields.
 * Intercepts Ctrl/Cmd + B (Bold), Ctrl/Cmd + I (Italic), and Ctrl/Cmd + K (Link)
 * and wraps selections in standard markdown formatting while sync-updating Zustand.
 */
export function handleEditorKeyboardShortcuts(
  e: React.KeyboardEvent<HTMLDivElement>,
  blockId: string,
  updateBlock: (id: string, props: any) => void
) {
  const hasMeta = e.ctrlKey || e.metaKey;

  const key = e.key.toLowerCase();
  if (hasMeta && (key === "b" || key === "i" || key === "k")) {
    e.preventDefault();

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    const range = selection.getRangeAt(0);
    const selectedText = range.toString();

    let prefix = "";
    let suffix = "";

    if (key === "b") {
      prefix = "**";
      suffix = "**";
    } else if (key === "i") {
      prefix = "*";
      suffix = "*";
    } else if (key === "k") {
      prefix = "[";
      suffix = "](url)";
    }

    // Intelligent whitespace extraction to keep spaces OUTSIDE markdown tags
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

    const formattedString = startSpace + prefix + cleanText + suffix + endSpace;
    const textNode = document.createTextNode(formattedString);
    range.deleteContents();
    range.insertNode(textNode);

    // Dynamic focus selection handling
    if (selectedText === "") {
      const newRange = document.createRange();
      newRange.setStart(textNode, prefix.length);
      newRange.setEnd(textNode, prefix.length);
      selection.removeAllRanges();
      selection.addRange(newRange);
    } else {
      const newRange = document.createRange();
      // Highlight precisely the clean text inside the wrapping tags
      const startPos = startSpace.length + prefix.length;
      const endPos = startPos + cleanText.length;
      newRange.setStart(textNode, startPos);
      newRange.setEnd(textNode, endPos);
      selection.removeAllRanges();
      selection.addRange(newRange);
    }

    // Force an immediate state synchronisation with the Zustand store
    // so the live preview updates in real-time without needing to blur first
    updateBlock(blockId, { text: e.currentTarget.textContent ?? "" });
  }
}
