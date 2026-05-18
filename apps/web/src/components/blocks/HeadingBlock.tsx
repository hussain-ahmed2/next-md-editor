"use client";

import { useRef, useEffect } from "react";
import { useEditorStore } from "@next-md-editor/editor-core";
import type { Block } from "@next-md-editor/types";
import { handleEditorKeyboardShortcuts, htmlToMarkdown } from "@/utils/editorShortcuts";
import { renderInlineMarkdown } from "@/features/markdown/highlighter";

const LEVEL_STYLES: Record<number, { fontSize: string; fontWeight: number; lineHeight: string; borderBottom?: string; paddingBottom?: string; marginBottom?: string }> = {
  1: { fontSize: "2em",    fontWeight: 600, lineHeight: "1.25", borderBottom: "1px solid #30363d", paddingBottom: "0.3em", marginBottom: "8px" },
  2: { fontSize: "1.5em",  fontWeight: 600, lineHeight: "1.25", borderBottom: "1px solid #30363d", paddingBottom: "0.3em", marginBottom: "8px" },
  3: { fontSize: "1.25em", fontWeight: 600, lineHeight: "1.25" },
};

export function HeadingBlock({ block }: { block: Block }) {
  const updateBlock = useEditorStore((s) => s.updateBlock);
  const level = (block.props.level as number) ?? 1;
  const text = (block.props.text as string) ?? "";
  const style = LEVEL_STYLES[level] ?? LEVEL_STYLES[1];
  const ref = useRef<HTMLDivElement>(null);

  // Synchronise state changes into the DOM only when not actively editing
  useEffect(() => {
    if (ref.current && document.activeElement !== ref.current) {
      ref.current.innerHTML = renderInlineMarkdown(text) || "";
    }
  }, [text, level]);

  const handleFocus = () => {
    if (ref.current) {
      ref.current.textContent = text;
    }
  };

  const handleBlur = () => {
    if (ref.current) {
      const rawText = htmlToMarkdown(ref.current.innerHTML);
      updateBlock(block.id, { text: rawText });
      ref.current.innerHTML = renderInlineMarkdown(rawText);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <div style={{ display: "flex", gap: 6, marginBottom: 2 }}>
        {[1, 2, 3].map((l) => (
          <button
            key={l}
            onClick={(e) => { e.stopPropagation(); updateBlock(block.id, { level: l }); }}
            style={{
              padding: "1px 7px",
              fontSize: 11,
              fontWeight: 700,
              borderRadius: 4,
              border: "1px solid",
              borderColor: level === l ? "var(--accent)" : "var(--border)",
              background: level === l ? "var(--accent-muted)" : "transparent",
              color: level === l ? "var(--accent)" : "var(--text-muted)",
              cursor: "pointer",
              fontFamily: "var(--font-mono)",
            }}
          >
            H{l}
          </button>
        ))}
      </div>
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={(e) => handleEditorKeyboardShortcuts(e, block.id, updateBlock)}
        style={{
          ...style,
          color: "var(--text-primary)",
          outline: "none",
          minHeight: "1.4em",
          letterSpacing: level === 1 ? "-0.03em" : "-0.01em",
        }}
      />
    </div>
  );
}
