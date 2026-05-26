"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useEditorStore } from "@next-md-editor/editor-core";
import type { RichText, FormatFlags } from "@next-md-editor/types";
import {
  getSelectionRichRange,
  getActiveFormats,
  toggleRichFormat,
} from "@next-md-editor/markdown";

type FormatAction = "bold" | "italic" | "code" | "strikethrough" | "link";

export function FloatingFormatToolbar() {
  const [visible, setVisible] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const [activeFormats, setActiveFormats] = useState<FormatFlags>({});
  const toolbarRef = useRef<HTMLDivElement>(null);
  const blockIdRef = useRef<string | null>(null);
  const rangeRef = useRef<{ start: number; end: number } | null>(null);

  const update = useCallback(() => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !sel.rangeCount) {
      setVisible(false);
      return;
    }

    let el: Node | null = sel.anchorNode;
    let contentEditable: HTMLElement | null = null;
    while (el) {
      if (
        el instanceof HTMLElement &&
        el.isContentEditable &&
        el.hasAttribute("data-block-id")
      ) {
        contentEditable = el;
        break;
      }
      el = el.parentNode;
    }
    if (!contentEditable) {
      setVisible(false);
      return;
    }

    const bid = contentEditable.getAttribute("data-block-id");
    if (!bid) {
      setVisible(false);
      return;
    }

    const blocks = useEditorStore.getState().blocks;
    const block = findBlockById(blocks, bid);
    if (!block || !Array.isArray(block.props.content)) {
      setVisible(false);
      return;
    }

    const content = block.props.content as RichText;
    const range = getSelectionRichRange(content, contentEditable);
    if (!range || range.start >= range.end) {
      setVisible(false);
      return;
    }

    const formats = getActiveFormats(content, range.start);
    setActiveFormats(formats);
    blockIdRef.current = bid;
    rangeRef.current = range;

    const selRect = sel.getRangeAt(0).getBoundingClientRect();
    const h = toolbarRef.current?.offsetHeight ?? 40;
    let top = selRect.top - h - 8;
    let left = selRect.left + selRect.width / 2;
    if (top < 8) top = selRect.bottom + 8;
    const maxLeft = window.innerWidth - 20;
    if (left > maxLeft) left = maxLeft;
    if (left < 20) left = 20;

    setPos({ top, left });
    setVisible(true);
  }, []);

  useEffect(() => {
    document.addEventListener("selectionchange", update);
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      document.removeEventListener("selectionchange", update);
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [update]);

  const apply = useCallback((action: FormatAction) => {
    const bid = blockIdRef.current;
    if (!bid || !rangeRef.current) return;

    const blocks = useEditorStore.getState().blocks;
    const block = findBlockById(blocks, bid);
    if (!block || !Array.isArray(block.props.content)) return;

    const content = block.props.content as RichText;
    const { start, end } = rangeRef.current;

    let format: FormatFlags;
    if (action === "link") {
      const url = window.prompt("Enter URL:", "https://");
      if (!url) return;
      format = { link: url };
    } else if (action === "code") {
      format = { code: true };
    } else if (action === "bold") {
      format = { bold: true };
    } else if (action === "italic") {
      format = { italic: true };
    } else if (action === "strikethrough") {
      format = { strikethrough: true };
    } else {
      return;
    }

    const newContent = toggleRichFormat(content, start, end, format);
    useEditorStore.getState().updateBlock(bid, { content: newContent });
  }, []);

  if (!visible) return null;

  const buttons: { action: FormatAction; label: React.ReactNode }[] = [
    { action: "bold", label: <strong style={{ fontSize: 14, letterSpacing: 0 }}>B</strong> },
    { action: "italic", label: <em style={{ fontSize: 14 }}>I</em> },
    { action: "code", label: <code style={{ fontSize: 13 }}>{`\`\`\``}</code> },
    { action: "strikethrough", label: <del style={{ fontSize: 14 }}>S</del> },
    { action: "link", label: <span style={{ fontSize: 12 }}>Link</span> },
  ];

  const hasFormat = (action: FormatAction): boolean => {
    if (action === "bold") return !!activeFormats.bold;
    if (action === "italic") return !!activeFormats.italic;
    if (action === "code") return !!activeFormats.code;
    if (action === "strikethrough") return !!activeFormats.strikethrough;
    return false;
  };

  return (
    <div
      ref={toolbarRef}
      contentEditable={false}
      style={{
        position: "fixed",
        top: pos.top,
        left: pos.left,
        transform: "translateX(-50%)",
        zIndex: 9999,
        display: "flex",
        gap: 1,
        padding: "4px",
        background: "var(--bg-surface)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-sm)",
        boxShadow: "0 4px 20px rgba(0,0,0,0.25)",
        userSelect: "none",
        pointerEvents: "auto",
      }}
      onMouseDown={(e) => e.preventDefault()}
    >
      {buttons.map(({ action, label }) => {
        const active = hasFormat(action);
        return (
          <button
            key={action}
            onClick={() => apply(action)}
            title={action.charAt(0).toUpperCase() + action.slice(1)}
            style={{
              background: active ? "var(--accent)" : "transparent",
              border: "none",
              borderRadius: 4,
              padding: "4px 8px",
              cursor: "pointer",
              color: active ? "#fff" : "var(--text-secondary)",
              fontSize: 13,
              fontWeight: 500,
              transition: "all 0.12s",
            }}
            onMouseEnter={(e) => {
              if (!active) {
                e.currentTarget.style.background = "var(--bg-elevated)";
                e.currentTarget.style.color = "var(--text-primary)";
              }
            }}
            onMouseLeave={(e) => {
              if (!active) {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = "var(--text-secondary)";
              }
            }}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

function findBlockById(blocks: any[], id: string): any {
  for (const b of blocks) {
    if (b.id === id) return b;
    if (b.children) {
      const found = findBlockById(b.children, id);
      if (found) return found;
    }
  }
  return null;
}
