"use client";

import { useState, useRef, useEffect } from "react";
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
  const selectBlock = useEditorStore((s) => s.selectBlock);
  const level = (block.props.level as number) ?? 1;
  const text = (block.props.text as string) ?? "";
  const style = LEVEL_STYLES[level] ?? LEVEL_STYLES[1];

  const [isEditing, setIsEditing] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);

  // If isEditing goes true, focus and move caret to the end
  useEffect(() => {
    if (isEditing && editorRef.current) {
      const el = editorRef.current;
      el.focus();
      const range = document.createRange();
      range.selectNodeContents(el);
      range.collapse(false);
      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(range);
      }
    }
  }, [isEditing]);

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
      {!isEditing ? (
        <div
          onClick={() => {
            setIsEditing(true);
            selectBlock(block.id);
          }}
          style={{
            ...style,
            color: text ? "var(--text-primary)" : "rgba(255, 255, 255, 0.25)",
            outline: "none",
            minHeight: "1.4em",
            letterSpacing: level === 1 ? "-0.03em" : "-0.01em",
            cursor: "text",
          }}
          dangerouslySetInnerHTML={{
            __html: renderInlineMarkdown(text) || `Heading ${level}`
          }}
        />
      ) : (
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onBlur={(e) => {
            updateBlock(block.id, { text: htmlToMarkdown(e.currentTarget.innerHTML) });
            setIsEditing(false);
          }}
          onKeyDown={(e) => handleEditorKeyboardShortcuts(e, block.id, updateBlock)}
          style={{
            ...style,
            color: "var(--text-primary)",
            outline: "none",
            minHeight: "1.4em",
            letterSpacing: level === 1 ? "-0.03em" : "-0.01em",
          }}
        >
          {text}
        </div>
      )}
    </div>
  );
}
