"use client";

import { useState, useRef, useEffect } from "react";
import { useEditorStore } from "@next-md-editor/editor-core";
import type { Block } from "@next-md-editor/types";
import { v4 as uuidv4 } from "uuid";

function normalizeHtml(html: string): string {
  if (typeof window === "undefined") return html;
  return html
    .replace(/\s+/g, " ")
    .replace(/<br\s*\/?>/gi, "")
    .replace(/class="[^"]*"/gi, "")
    .replace(/style="[^"]*"/gi, "")
    .trim();
}

export function ListBlock({ block }: { block: Block }) {
  const blocks = useEditorStore((s) => s.blocks);
  const addBlock = useEditorStore((s) => s.addBlock);
  const removeBlocks = useEditorStore((s) => s.removeBlocks);
  const updateBlock = useEditorStore((s) => s.updateBlock);
  const selectBlock = useEditorStore((s) => s.selectBlock);
  const selectedBlockIds = useEditorStore((s) => s.selectedBlockIds);

  const styleType = (block.props.style as "bullet" | "numbered") ?? "bullet";
  const html =
    (block.props.html as string) ??
    (styleType === "bullet"
      ? "<ul><li>Item 1</li></ul>"
      : "<ol><li>Item 1</li></ol>");

  const [isFocused, setIsFocused] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const lastUpdatedHtmlRef = useRef<string>(html);

  // Sync focus from store selection
  useEffect(() => {
    const isSelected =
      selectedBlockIds[selectedBlockIds.length - 1] === block.id;
    if (isSelected && ref.current && document.activeElement !== ref.current) {
      ref.current.focus();
    }
  }, [selectedBlockIds, block.id]);

  // Sync html changes (e.g. undo/redo, mount, dragging) without losing caret position
  useEffect(() => {
    if (ref.current) {
      const isEmpty = ref.current.innerHTML.trim() === "" || ref.current.innerHTML === "<br>";
      if (document.activeElement === ref.current && !isEmpty) {
        // If focused (typing), only overwrite if the change is external (like Undo/Redo)
        if (normalizeHtml(html) !== normalizeHtml(lastUpdatedHtmlRef.current)) {
          ref.current.innerHTML = html;
          lastUpdatedHtmlRef.current = html;
        }
      } else {
        // If not focused or DOM is empty (first mount/drop), always sync DOM
        ref.current.innerHTML = html;
        lastUpdatedHtmlRef.current = html;
      }
    }
  }, [html]);

  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    const newHtml = e.currentTarget.innerHTML;
    lastUpdatedHtmlRef.current = newHtml;
    updateBlock(block.id, { html: newHtml });
  };

  const handleBlur = (e: React.FocusEvent<HTMLDivElement>) => {
    setIsFocused(false);
    const finalHtml = e.currentTarget.innerHTML;
    lastUpdatedHtmlRef.current = finalHtml;
    updateBlock(block.id, { html: finalHtml });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Tab") {
      e.preventDefault();
      if (e.shiftKey) {
        document.execCommand("outdent", false);
      } else {
        document.execCommand("indent", false);
      }
      const nextHtml = ref.current?.innerHTML ?? "";
      lastUpdatedHtmlRef.current = nextHtml;
      updateBlock(block.id, { html: nextHtml });
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
              const allLis = ref.current?.querySelectorAll("li") || [];
              const isLastLi = allLis[allLis.length - 1] === li;
              
              const parentList = li.parentNode;
              const isDirectChildOfEditor = parentList?.parentNode === ref.current;
              const isNested = !isDirectChildOfEditor;
              
              if (isNested) {
                e.preventDefault();
                document.execCommand("outdent", false);
                const currentHtml = ref.current?.innerHTML ?? "";
                lastUpdatedHtmlRef.current = currentHtml;
                updateBlock(block.id, { html: currentHtml });
                return;
              }
              
              if (allLis.length > 1 && isLastLi) {
                e.preventDefault();
                li.parentNode?.removeChild(li);
                const currentHtml = ref.current?.innerHTML ?? "";
                lastUpdatedHtmlRef.current = currentHtml;
                updateBlock(block.id, { html: currentHtml });
                const nextBlockId = uuidv4();
                
                // Find current block index
                const curIndex = blocks.findIndex(b => b.id === block.id);
                addBlock({
                  id: nextBlockId,
                  type: "paragraph",
                  props: { text: "" }
                }, curIndex + 1);
                
                setTimeout(() => {
                  selectBlock(nextBlockId);
                }, 10);
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
            
            // Check if cursor is at the very start of the LI
            const preRange = range.cloneRange();
            preRange.selectNodeContents(li);
            preRange.setEnd(range.startContainer, range.startOffset);
            const isAtStartOfLi = preRange.toString().length === 0;
            
            if (isAtStartOfLi) {
              const parentList = li.parentNode;
              const isDirectChildOfEditor = parentList?.parentNode === ref.current;
              const isNested = !isDirectChildOfEditor;
              
              if (isNested) {
                e.preventDefault();
                document.execCommand("outdent", false);
                const currentHtml = ref.current?.innerHTML ?? "";
                lastUpdatedHtmlRef.current = currentHtml;
                updateBlock(block.id, { html: currentHtml });
                return;
              }
            }
            break;
          }
          node = node.parentNode;
        }
      }

      const textContent = ref.current?.textContent?.trim() ?? "";
      if (textContent === "") {
        e.preventDefault();
        removeBlocks([block.id]);
        return;
      }
    }
  };

  const pattern = (block.props.pattern as string) ?? "decimal-alpha-roman";

  const patterns = [
    { id: "decimal-alpha-roman", label: "1. a. i.", title: "Numeric first" },
    { id: "alpha-roman-decimal", label: "a. i. 1.", title: "Alphabet first" },
    { id: "roman-decimal-alpha", label: "i. 1. a.", title: "Roman first" },
  ];

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
      {isFocused && styleType === "numbered" && (
        <div
          contentEditable={false}
          style={{
            position: "absolute",
            top: -28,
            right: 8,
            display: "flex",
            gap: 4,
            background: "var(--bg-surface)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-sm)",
            padding: "2px 4px",
            boxShadow: "var(--shadow-md)",
            zIndex: 10,
            fontSize: 10,
            userSelect: "none",
          }}
        >
          {patterns.map((p) => {
            const isActive = pattern === p.id;
            return (
              <button
                key={p.id}
                onMouseDown={(e) => {
                  e.preventDefault(); // Prevent blurring from contentEditable
                  e.stopPropagation(); // Prevent sortable block click selection
                  updateBlock(block.id, { pattern: p.id });
                }}
                title={p.title}
                style={{
                  background: isActive ? "var(--accent)" : "transparent",
                  color: isActive ? "#fff" : "var(--text-secondary)",
                  border: "none",
                  borderRadius: 4,
                  padding: "2px 6px",
                  cursor: "pointer",
                  fontSize: 10,
                  fontWeight: 600,
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.color = "var(--text-primary)";
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.color = "var(--text-secondary)";
                }}
              >
                {p.label}
              </button>
            );
          })}
        </div>
      )}

      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
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
        className={`rich-list-content pattern-${pattern}`}
      />
    </div>
  );
}
