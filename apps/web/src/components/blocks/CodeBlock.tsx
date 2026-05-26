"use client";

import { useEditorStore } from "@next-md-editor/editor-core";
import type { Block } from "@next-md-editor/types";
import { useState } from "react";
import { highlightCodeHtml, getHighlightLanguages } from "@/features/markdown/highlighter";

const ALL_LANGUAGES = getHighlightLanguages();

export function CodeBlock({ block }: { block: Block }) {
  const updateBlock = useEditorStore((s) => s.updateBlock);
  const code = (block.props.code as string) ?? "";
  const lang = (block.props.language as string) ?? "ts";
  const [isEditing, setIsEditing] = useState(false);

  return (
    <div style={{
      borderRadius: 6,
      border: "1px solid #30363d",
      overflow: "hidden",
      background: "#161b22",
    }}>
      {/* Code header */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "6px 12px",
        borderBottom: "1px solid #30363d",
        background: "rgba(0,0,0,0.15)",
      }}>
        <div style={{ display: "flex", gap: 6 }}>
          <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#f87171", display: "inline-block" }} />
          <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#fbbf24", display: "inline-block" }} />
          <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#4ade80", display: "inline-block" }} />
        </div>
        <input
          list="code-langs"
          value={lang}
          onChange={(e) => { e.stopPropagation(); updateBlock(block.id, { language: e.target.value }); }}
          style={{
            background: "transparent",
            border: "none",
            color: "var(--text-muted)",
            fontSize: 11,
            fontFamily: "var(--font-mono)",
            outline: "none",
            width: 120,
            textAlign: "right",
          }}
        />
        <datalist id="code-langs">
          {ALL_LANGUAGES.map((l) => <option key={l} value={l} />)}
        </datalist>
      </div>
      
      {/* Code area - Stacked transparent textarea over syntax-highlighted text */}
      <div style={{ position: "relative", minHeight: 120 }}>
        {/* Background layer: Syntax Highlighted Code */}
        <pre
          aria-hidden="true"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            margin: 0,
            padding: "14px 16px",
            pointerEvents: "none",
            fontFamily: "var(--font-mono)",
            fontSize: 13,
            lineHeight: 1.7,
            color: "#e6edf3",
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            boxSizing: "border-box",
            overflow: "hidden", // Textarea handles scrolling
          }}
        >
          <code dangerouslySetInnerHTML={{ __html: highlightCodeHtml(code || (isEditing ? "" : "// Click to add code…"), lang) }} />
        </pre>

        {/* Foreground layer: Invisible editable textarea */}
        <textarea
          value={code}
          onChange={(e) => updateBlock(block.id, { code: e.target.value })}
          onFocus={() => setIsEditing(true)}
          onBlur={() => setIsEditing(false)}
          spellCheck={false}
          style={{
            display: "block",
            width: "100%",
            height: "100%",
            minHeight: 120,
            padding: "14px 16px",
            background: "transparent",
            color: "transparent", // Text is transparent, caret is visible
            caretColor: "var(--text-primary)",
            border: "none",
            outline: "none",
            fontFamily: "var(--font-mono)",
            fontSize: 13,
            lineHeight: 1.7,
            resize: "vertical",
            boxSizing: "border-box",
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            overflow: "hidden", // Let it expand with content or rely on user resize
          }}
          onInput={(e) => {
            // Auto-resize textarea height to fit content
            const target = e.target as HTMLTextAreaElement;
            target.style.height = "auto";
            target.style.height = `${target.scrollHeight}px`;
          }}
        />
      </div>
    </div>
  );
}
