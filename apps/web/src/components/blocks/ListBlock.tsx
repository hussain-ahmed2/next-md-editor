"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { v4 as uuidv4 } from "uuid";
import { useEditorStore } from "@next-md-editor/editor-core";
import { getDomTextOffset, restoreDomRange } from "@next-md-editor/markdown";
import type { Block } from "@next-md-editor/types";
import { useBlockFocus } from "@/hooks/useBlockFocus";
import { itemsToHtml, htmlToItems, defaultItems } from "./listBlockUtils";
import type { ListItemData } from "./listBlockUtils";

export function ListBlock({ block }: { block: Block }) {
  const blocks = useEditorStore((s) => s.blocks);
  const addBlock = useEditorStore((s) => s.addBlock);
  const removeBlocks = useEditorStore((s) => s.removeBlocks);
  const updateBlock = useEditorStore((s) => s.updateBlock);
  const selectBlock = useEditorStore((s) => s.selectBlock);
  const selectedBlockIds = useEditorStore((s) => s.selectedBlockIds);

  const myBlock = blocks.find((b) => b.id === block.id) ?? block;
  const styleType = (myBlock.props.style as "bullet" | "numbered") ?? "bullet";

  const items: ListItemData[] = useMemo(() => {
    if (Array.isArray(myBlock.props.items)) {
      return myBlock.props.items as ListItemData[];
    }
    const html = (myBlock.props.html as string) ?? "";
    if (html) {
      const parsed = htmlToItems(html);
      if (parsed.length > 0) return parsed;
    }
    return defaultItems();
  }, [myBlock.props.items, myBlock.props.html]);

  const [isFocused, setIsFocused] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const isSyncingRef = useRef(false);

  useBlockFocus(ref, block.id, selectedBlockIds);

  // Sync store changes to DOM
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const newHtml = itemsToHtml(items, styleType);
    if (el.innerHTML === newHtml) return;

    const isFocusedNow = document.activeElement === el;
    let savedStart = -1;
    let savedEnd = -1;
    if (isFocusedNow) {
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0 && sel.anchorNode && sel.focusNode && el.contains(sel.anchorNode) && el.contains(sel.focusNode)) {
        savedStart = getDomTextOffset(el, sel.anchorNode, sel.anchorOffset);
        savedEnd = getDomTextOffset(el, sel.focusNode, sel.focusOffset);
      }
    }

    isSyncingRef.current = true;
    el.innerHTML = newHtml;
    isSyncingRef.current = false;

    if (savedStart >= 0) {
      const totalLen = el.textContent?.length ?? 0;
      restoreDomRange(el, Math.min(savedStart, totalLen), Math.min(savedEnd, totalLen));
    }
  }, [items, styleType]);

  const saveToStore = () => {
    const el = ref.current;
    if (!el) return;
    const newItems = htmlToItems(el.innerHTML);
    if (newItems.length === 0) return;
    if (areItemsEqual(newItems, items)) return;
    updateBlock(block.id, { items: newItems, html: undefined });
  };

  const handleInput = () => {
    if (isSyncingRef.current) return;
    saveToStore();
  };

  const handleBlur = () => {
    setIsFocused(false);
    saveToStore();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter") {
      const sel = window.getSelection();
      if (!sel || !sel.rangeCount) return;

      const range = sel.getRangeAt(0);
      let node: Node | null = range.startContainer;

      while (node && node !== ref.current) {
        if (node.nodeName === "LI") {
          const li = node as HTMLLIElement;

          if (li.textContent?.trim() === "") {
            const allLis = ref.current?.querySelectorAll("li") ?? [];
            const isNested = li.parentNode?.parentNode !== ref.current;
            const isLastLi = allLis[allLis.length - 1] === li;

            if (isNested) {
              e.preventDefault();
              document.execCommand("outdent");
              saveToStore();
              return;
            }

            if (allLis.length > 1 && isLastLi) {
              e.preventDefault();
              const newItems = htmlToItems(ref.current!.innerHTML);
              const reduced = newItems.slice(0, -1);
              updateBlock(block.id, {
                items: reduced.length > 0 ? reduced : defaultItems(),
                html: undefined,
              });

              const nextBlockId = uuidv4();
              const curIndex = blocks.findIndex((b) => b.id === block.id);
              addBlock({ id: nextBlockId, type: "paragraph", props: { content: [] } }, curIndex + 1);
              setTimeout(() => selectBlock(nextBlockId), 10);
              return;
            }
          }
          break;
        }
        node = node.parentNode;
      }
    }

    if (e.key === "Tab") {
      e.preventDefault();
      document.execCommand(e.shiftKey ? "outdent" : "indent");
      saveToStore();
      return;
    }

    if (e.key === "Backspace") {
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0) {
        const range = sel.getRangeAt(0);
        let node: Node | null = range.startContainer;

        while (node && node !== ref.current) {
          if (node.nodeName === "LI") {
            const li = node as HTMLLIElement;
            const preRange = range.cloneRange();
            preRange.selectNodeContents(li);
            preRange.setEnd(range.startContainer, range.startOffset);
            const isAtStart = preRange.toString().length === 0;
            const isNested = li.parentNode?.parentNode !== ref.current;

            if (isAtStart && isNested) {
              e.preventDefault();
              document.execCommand("outdent");
              saveToStore();
              return;
            }
            break;
          }
          node = node.parentNode;
        }
      }

      if ((ref.current?.textContent?.trim() ?? "") === "") {
        e.preventDefault();
        removeBlocks([block.id]);
        return;
      }
    }
  };

  return (
    <div
      style={{
        position: "relative",
        padding: "4px 8px",
        borderRadius: "var(--radius-md)",
        background: isFocused ? "var(--bg-elevated)" : "transparent",
        transition: "background 0.2s",
      }}
    >
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        data-block-id={block.id}
        onFocus={() => setIsFocused(true)}
        onBlur={handleBlur}
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        style={{
          outline: "none",
          fontSize: "15px",
          lineHeight: "1.7",
          color: "var(--text-primary)",
          minHeight: "24px",
        }}
        className="rich-list-content"
      />
    </div>
  );
}

function areItemsEqual(a: ListItemData[], b: ListItemData[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (!areListItemsEqual(a[i], b[i])) return false;
  }
  return true;
}

function areListItemsEqual(a: ListItemData, b: ListItemData): boolean {
  if (!areRichTextEqual(a.content, b.content)) return false;
  const ac = a.children;
  const bc = b.children;
  if (!ac !== !bc) return false;
  if (ac && bc) return areItemsEqual(ac, bc);
  return true;
}

function areRichTextEqual(a: import("@next-md-editor/types").RichText, b: import("@next-md-editor/types").RichText): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    const sa = a[i];
    const sb = b[i];
    if (sa.text !== sb.text) return false;
    if (sa.bold !== sb.bold) return false;
    if (sa.italic !== sb.italic) return false;
    if (sa.code !== sb.code) return false;
    if (sa.strikethrough !== sb.strikethrough) return false;
    if (sa.link !== sb.link) return false;
  }
  return true;
}
