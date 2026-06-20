"use client";

import { useEditorStore } from "@next-md-editor/editor-core";
import type { Block, RichText } from "@next-md-editor/types";

function richTextToText(rt: RichText): string {
  return rt.map((s) => s.text).join("");
}

interface TocItem {
  id: string;
  level: number;
  text: string;
}

function buildToc(blocks: Block[]): TocItem[] {
  const items: TocItem[] = [];
  for (const b of blocks) {
    if (b.type === "heading") {
      const level = (b.props.level as number) ?? 1;
      const content = richTextToText((b.props.content as RichText) ?? []);
      if (content.trim()) {
        items.push({ id: b.id, level, text: content });
      }
    }
  }
  return items;
}

export function TableOfContents({ onClose }: { onClose?: () => void }) {
  const blocks = useEditorStore((s) => s.blocks);
  const items = buildToc(blocks);

  if (items.length === 0) {
    return (
      <div style={{ padding: 20, textAlign: "center", color: "var(--text-muted)", fontSize: 12 }}>
        No headings found
      </div>
    );
  }

  const handleClick = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      el.focus({ preventScroll: true });
    }
    onClose?.();
  };

  return (
    <div
      style={{
        padding: "8px 0",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {items.map((item) => (
        <button
          key={item.id}
          onClick={() => handleClick(item.id)}
          style={{
            border: "none",
            background: "transparent",
            cursor: "pointer",
            textAlign: "left",
            padding: "6px 16px 6px " + (12 + (item.level - 1) * 16) + "px",
            fontSize: Math.max(11, 14 - item.level) + "px",
            fontWeight: item.level <= 2 ? 600 : 400,
            color: "var(--text-secondary)",
            transition: "all 0.1s ease",
            borderRadius: 0,
            borderLeft: "2px solid transparent",
            fontFamily: "var(--font-sans)",
            lineHeight: 1.3,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "var(--text-primary)";
            e.currentTarget.style.background = "var(--bg-hover)";
            e.currentTarget.style.borderLeftColor = "var(--accent)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "var(--text-secondary)";
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.borderLeftColor = "transparent";
          }}
        >
          {item.text}
        </button>
      ))}
    </div>
  );
}
