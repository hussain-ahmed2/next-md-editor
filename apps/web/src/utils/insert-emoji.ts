export function insertEmoji(emoji: string): void {
  const sel = window.getSelection();
  if (sel && sel.rangeCount > 0) {
    const range = sel.getRangeAt(0);
    const emojiNode = document.createTextNode(emoji);
    if (range.collapsed) {
      range.insertNode(emojiNode);
      range.setStartAfter(emojiNode);
    } else {
      range.deleteContents();
      range.insertNode(emojiNode);
      range.setStartAfter(emojiNode);
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
