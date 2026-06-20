export function insertEmoji(emoji: string): void {
  const sel = window.getSelection();
  if (sel && sel.rangeCount > 0) {
    const range = sel.getRangeAt(0);
    if (range.collapsed) {
      range.insertNode(document.createTextNode(emoji));
      range.setStartAfter(range.endContainer);
    } else {
      range.deleteContents();
      range.insertNode(document.createTextNode(emoji));
      range.setStartAfter(range.endContainer);
    }
    range.collapse(true);
    sel.removeAllRanges();
    sel.addRange(range);
    const el = sel.anchorNode?.parentElement?.closest("[contenteditable]") as HTMLElement | null;
    if (el) el.dispatchEvent(new Event("input", { bubbles: true }));
    return;
  }
  const ce = document.querySelector<HTMLElement>("[contenteditable]");
  if (ce) {
    ce.focus();
    document.execCommand("insertText", false, emoji);
  }
}
