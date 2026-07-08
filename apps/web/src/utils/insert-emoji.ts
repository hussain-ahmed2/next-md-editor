export function insertEmoji(emoji: string): void {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) {
    const ce = document.querySelector<HTMLElement>("[contenteditable]");
    if (ce) ce.focus();
  }
  
  // Use native execCommand to insert text at the current selection.
  // This correctly manages the caret position and reliably fires a native
  // 'input' event that React's synthetic onInput handler can capture.
  document.execCommand("insertText", false, emoji);
}
