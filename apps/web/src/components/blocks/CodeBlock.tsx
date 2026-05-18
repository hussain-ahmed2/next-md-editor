"use client";

import { useEditorStore } from "@next-md-editor/editor-core";
import type { Block } from "@next-md-editor/types";

const LANGUAGES = ["ts", "tsx", "js", "jsx", "bash", "json", "css", "html", "python", "rust"];

export function CodeBlock({ block }: { block: Block }) {
  const updateBlock = useEditorStore((s) => s.updateBlock);
  const code = (block.props.code as string) ?? "";
  const lang = (block.props.language as string) ?? "ts";

  return (
    <div style={{
      borderRadius: "var(--radius-md)",
      border: "1px solid var(--border-subtle)",
      overflow: "hidden",
      background: "var(--bg-elevated)",
    }}>
      {/* Code header */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "6px 12px",
        borderBottom: "1px solid var(--border-subtle)",
        background: "rgba(0,0,0,0.2)",
      }}>
        <div style={{ display: "flex", gap: 6 }}>
          <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#f87171", display: "inline-block" }} />
          <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#fbbf24", display: "inline-block" }} />
          <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#4ade80", display: "inline-block" }} />
        </div>
        <select
          value={lang}
          onChange={(e) => { e.stopPropagation(); updateBlock(block.id, { language: e.target.value }); }}
          style={{
            background: "transparent",
            border: "none",
            color: "var(--text-muted)",
            fontSize: 11,
            fontFamily: "var(--font-mono)",
            cursor: "pointer",
            outline: "none",
          }}
        >
          {LANGUAGES.map((l) => <option key={l} value={l}>{l}</option>)}
        </select>
      </div>
      {/* Editable code */}
      <textarea
        value={code}
        onChange={(e) => updateBlock(block.id, { code: e.target.value })}
        placeholder="// Write your code here…"
        spellCheck={false}
        style={{
          display: "block",
          width: "100%",
          minHeight: 120,
          padding: "14px 16px",
          background: "transparent",
          border: "none",
          outline: "none",
          color: "var(--text-primary)",
          fontFamily: "var(--font-mono)",
          fontSize: 13,
          lineHeight: 1.7,
          resize: "vertical",
          boxSizing: "border-box",
        }}
      />
    </div>
  );
}
