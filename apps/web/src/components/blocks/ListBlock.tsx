"use client";

import { useRef, useEffect, useCallback } from "react";
import { useEditorStore } from "@next-md-editor/editor-core";
import type { Block, ListItemData } from "@next-md-editor/types";
import { v4 as uuidv4 } from "uuid";
import {
  richTextToHtml,
  htmlToRichText,
} from "@next-md-editor/markdown";

// ── DOM → ListItemData[] ──────────────────────────────────────────────────────

function domToItems(container: HTMLElement): ListItemData[] {
  const listEl = container.querySelector("ul, ol");
  if (!listEl) return [];
  return Array.from(listEl.children)
    .filter((el) => el.nodeName === "LI")
    .map((li) => {
      const liClone = li.cloneNode(true) as HTMLLIElement;
      const nestedLists = liClone.querySelectorAll(":scope > ul, :scope > ol");
      let inlineHtml = liClone.innerHTML;
      nestedLists.forEach((nl) => {
        inlineHtml = inlineHtml.replace(nl.outerHTML, "");
      });
      return {
        id: uuidv4(),
        content: htmlToRichText(inlineHtml.trim()),
        children:
          nestedLists.length > 0 ? domToItems(nestedLists[0] as HTMLElement) : undefined,
      };
    });
}

// ── ListItemData[] → HTML ────────────────────────────────────────────────────

function itemsToHtml(items: ListItemData[], ordered: boolean): string {
  const tag = ordered ? "ol" : "ul";
  const lis = items
    .map((item) => {
      let html = richTextToHtml(item.content);
      if (item.children && item.children.length > 0) {
        html += itemsToHtml(item.children, ordered);
      }
      return `<li>${html}</li>`;
    })
    .join("");
  return `<${tag}>${lis}</${tag}>`;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ListBlock({ block }: { block: Block }) {
  const blocks = useEditorStore((s) => s.blocks);
  const addBlock = useEditorStore((s) => s.addBlock);
  const removeBlocks = useEditorStore((s) => s.removeBlocks);
  const updateBlock = useEditorStore((s) => s.updateBlock);
  const selectBlock = useEditorStore((s) => s.selectBlock);
  const selectedBlockIds = useEditorStore((s) => s.selectedBlockIds);

  const styleType = (block.props.style as "bullet" | "numbered") ?? "bullet";
  const ordered = styleType === "numbered";

  const items: ListItemData[] = Array.isArray(block.props.items)
    ? (block.props.items as ListItemData[])
    : (block.props.html as string)
      ? [{ id: uuidv4(), content: [], children: undefined }]
      : [{ id: uuidv4(), content: [], children: undefined }];

  const ref = useRef<HTMLDivElement>(null);
  const lastStoredRef = useRef<string>("");

  // ── Focus sync ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const isSelected = selectedBlockIds[selectedBlockIds.length - 1] === block.id;
    if (isSelected && ref.current && document.activeElement !== ref.current) {
      ref.current.focus();
    }
  }, [selectedBlockIds, block.id]);

  // ── DOM sync: items → innerHTML ─────────────────────────────────────────────
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const html = itemsToHtml(items, ordered);
    if (el.innerHTML !== html) {
      el.innerHTML = html;
    }
    lastStoredRef.current = html;
  }, [items, ordered]);

  // ── Save: current DOM → items ───────────────────────────────────────────────
  const saveToStore = useCallback(() => {
    if (!ref.current) return;
    const newItems = domToItems(ref.current);
    updateBlock(block.id, { items: newItems });
  }, [block.id, updateBlock]);

  const handleInput = () => saveToStore();

  const handleBlur = () => saveToStore();

  // ── Keyboard ────────────────────────────────────────────────────────────────
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Tab") {
      e.preventDefault();
      document.execCommand(e.shiftKey ? "outdent" : "indent", false);
      saveToStore();
      return;
    }

    if (e.key === "Enter") {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        let node: Node | null = range.startContainer;

        while (node && node !== ref.current) {
          if (node.nodeName === "LI") {
            const li = node as HTMLLIElement;

            if (li.textContent?.trim() === "") {
              const allLis = ref.current?.querySelectorAll("li") ?? [];
              const isLastLi = allLis[allLis.length - 1] === li;
              const isNested = li.parentNode?.parentNode !== ref.current;

              if (isNested) {
                e.preventDefault();
                document.execCommand("outdent", false);
                saveToStore();
                return;
              }

              if (allLis.length > 1 && isLastLi) {
                e.preventDefault();
                li.parentNode?.removeChild(li);
                saveToStore();

                const nextBlockId = uuidv4();
                const curIndex = blocks.findIndex((b) => b.id === block.id);
                addBlock(
                  { id: nextBlockId, type: "paragraph", props: { content: [] } },
                  curIndex + 1,
                );
                setTimeout(() => selectBlock(nextBlockId), 10);
                return;
              }
            }
            break;
          }
          node = node.parentNode;
        }
      }
    }

    if (e.key === "Backspace") {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
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
              document.execCommand("outdent", false);
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
        transition: "background 0.2s",
      }}
    >
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onFocus={() => {}}
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
      />
    </div>
  );
}
