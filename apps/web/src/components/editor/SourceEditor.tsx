"use client";

import { useEditorStore } from "@next-md-editor/editor-core";
import { serializeToMarkdown, parseMarkdown } from "@/features/markdown/serializer";
import { useUIStore } from "@/store/uiStore";
import { useEffect, useRef } from "react";

export function SourceEditor() {
  const blocks = useEditorStore((s) => s.blocks);
  const sourceText = useUIStore((s) => s.sourceText);
  const setSourceText = useUIStore((s) => s.setSourceText);
  const setEditorMode = useUIStore((s) => s.setEditorMode);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const blocksRef = useRef(blocks);
  const setSourceTextRef = useRef(setSourceText);

  useEffect(() => {
    blocksRef.current = blocks;
  }, [blocks]);

  useEffect(() => {
    setSourceTextRef.current = setSourceText;
  }, [setSourceText]);

  useEffect(() => {
    setSourceTextRef.current(serializeToMarkdown(blocksRef.current));
  }, []);

  const handleApply = () => {
    const parsed = parseMarkdown(sourceText);
    useEditorStore.getState().setBlocks(parsed);
    setEditorMode("canvas");
  };

  return (
    <main
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        background: "var(--bg-base)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "8px 16px",
          borderBottom: "1px solid var(--border-subtle)",
          background: "var(--bg-surface)",
          flexShrink: 0,
        }}
      >
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            fontFamily: "var(--font-mono)",
            color: "var(--text-muted)",
            letterSpacing: "0.05em",
          }}
        >
          MARKDOWN SOURCE
        </span>
        <div style={{ display: "flex", gap: 6 }}>
          <button
            onClick={handleApply}
            style={{
              padding: "4px 12px",
              borderRadius: "var(--radius-sm)",
              border: "1px solid var(--accent)",
              background: "var(--accent)",
              color: "#fff",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "var(--font-sans)",
            }}
          >
            Apply Changes
          </button>
        </div>
      </div>
      <textarea
        ref={textareaRef}
        value={sourceText}
        onChange={(e) => setSourceText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Tab") {
            e.preventDefault();
            const ta = e.currentTarget;
            const start = ta.selectionStart;
            const end = ta.selectionEnd;
            const newVal = sourceText.slice(0, start) + "  " + sourceText.slice(end);
            setSourceText(newVal);
            requestAnimationFrame(() => {
              ta.selectionStart = ta.selectionEnd = start + 2;
            });
          }
          if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
            e.preventDefault();
            handleApply();
          }
        }}
        spellCheck={false}
        style={{
          flex: 1,
          width: "100%",
          padding: "24px 32px",
          fontFamily: "ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas, Liberation Mono, monospace",
          fontSize: 13,
          lineHeight: 1.7,
          color: "var(--text-primary)",
          background: "transparent",
          border: "none",
          outline: "none",
          resize: "none",
          tabSize: 2,
          whiteSpace: "pre-wrap",
          overflowWrap: "break-word",
        }}
      />
    </main>
  );
}
