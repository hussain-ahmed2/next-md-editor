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
  const isMac = typeof window !== "undefined" && /Mac|iPod|iPhone|iPad/.test(window.navigator.platform);
  const hasMeta = isMac ? e.metaKey : e.ctrlKey;

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

    const textNode = document.createTextNode(prefix + selectedText + suffix);
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
      newRange.setStart(textNode, 0);
      newRange.setEnd(textNode, textNode.length);
      selection.removeAllRanges();
      selection.addRange(newRange);
    }

    // Force an immediate state synchronisation with the Zustand store
    // so the live preview updates in real-time without needing to blur first
    updateBlock(blockId, { text: e.currentTarget.textContent ?? "" });
  }
}
