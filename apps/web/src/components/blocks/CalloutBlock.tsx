"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useEditorStore } from "@next-md-editor/editor-core";
import type { Block, RichText } from "@next-md-editor/types";
import {
  richTextToHtml,
  htmlToRichText,
  richTextLength,
  restoreDomRange,
  getDomTextOffset,
  markdownToRichText,
} from "@next-md-editor/markdown";
import { Info, Lightbulb, Megaphone, TriangleAlert, OctagonX } from "lucide-react";

const CALLOUT_TYPES = {
  note: {
    label: "Note",
    icon: <Info size={14} />,
    bg: "rgba(56, 139, 253, 0.08)",
    border: "rgba(56, 139, 253, 0.3)",
    accent: "#388bfd",
  },
  tip: {
    label: "Tip",
    icon: <Lightbulb size={14} />,
    bg: "rgba(63, 185, 80, 0.08)",
    border: "rgba(63, 185, 80, 0.3)",
    accent: "#3fb950",
  },
  important: {
    label: "Important",
    icon: <Megaphone size={14} />,
    bg: "rgba(163, 113, 247, 0.08)",
    border: "rgba(163, 113, 247, 0.3)",
    accent: "#a371f7",
  },
  warning: {
    label: "Warning",
    icon: <TriangleAlert size={14} />,
    bg: "rgba(210, 153, 34, 0.08)",
    border: "rgba(210, 153, 34, 0.3)",
    accent: "#d29922",
  },
  caution: {
    label: "Caution",
    icon: <OctagonX size={14} />,
    bg: "rgba(248, 113, 113, 0.08)",
    border: "rgba(248, 113, 113, 0.3)",
    accent: "#f85149",
  },
};

type CalloutKey = keyof typeof CALLOUT_TYPES;

export function CalloutBlock({ block }: { block: Block }) {
  const updateBlock = useEditorStore((s) => s.updateBlock);
  const content: RichText = Array.isArray(block.props.content)
    ? (block.props.content as RichText)
    : typeof block.props.text === "string"
      ? markdownToRichText(block.props.text as string)
      : [];

  const type = ((block.props.type as string) ?? "note").toLowerCase() as CalloutKey;
  const config = CALLOUT_TYPES[type] ?? CALLOUT_TYPES.note;

  const [isFocused, setIsFocused] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Sync store changes to DOM — preserves caret position
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const newHtml = richTextToHtml(content);
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

    el.innerHTML = newHtml;

    if (savedStart >= 0) {
      const len = richTextLength(content);
      restoreDomRange(el, Math.min(savedStart, len), Math.min(savedEnd, len));
    }
  }, [content, ref]);

  // When entering focus, ensure content is rendered and caret at end
  useEffect(() => {
    if (isFocused && ref.current) {
      const html = richTextToHtml(content);
      if (ref.current.innerHTML !== html) {
        ref.current.innerHTML = html;
      }
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0 && ref.current.contains(sel.anchorNode)) return;
      restoreDomRange(ref.current, richTextLength(content), richTextLength(content));
    }
  }, [isFocused, content]);

  const handleInput = useCallback(
    (e: React.FormEvent<HTMLDivElement>) => {
      const newContent = htmlToRichText(e.currentTarget.innerHTML);
      updateBlock(block.id, { content: newContent });
    },
    [block.id, updateBlock],
  );

  const handleBlur = useCallback(
    (e: React.FocusEvent<HTMLDivElement>) => {
      setIsFocused(false);
      const newContent = htmlToRichText(e.currentTarget.innerHTML);
      updateBlock(block.id, { content: newContent });
    },
    [block.id, updateBlock],
  );

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 8,
        padding: "12px 14px",
        borderRadius: 6,
        borderLeft: `4px solid ${config.accent}`,
        border: `1px solid ${config.border}`,
        borderLeftWidth: 4,
        background: config.bg,
        margin: "8px 0",
        transition: "all 0.15s ease",
      }}
    >
      {/* Header selector dropdown */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600, color: config.accent }}>
          <span>{config.icon}</span>
          <span>{config.label}</span>
        </div>
        <select
          value={type}
          onChange={(e) => updateBlock(block.id, { type: e.target.value })}
          style={{
            background: "transparent",
            border: "none",
            color: "var(--text-muted)",
            fontSize: 11,
            cursor: "pointer",
            outline: "none",
            fontWeight: 500,
          }}
        >
          {Object.keys(CALLOUT_TYPES).map((k) => (
            <option key={k} value={k} style={{ background: "var(--bg-surface)", color: "var(--text-primary)" }}>
              {CALLOUT_TYPES[k as CalloutKey].label}
            </option>
          ))}
        </select>
      </div>

      {/* WYSIWYG Editable content */}
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        data-block-id={block.id}
        onFocus={() => setIsFocused(true)}
        onBlur={handleBlur}
        onInput={handleInput}
        style={{
          fontSize: 14,
          lineHeight: 1.6,
          color: "var(--text-primary)",
          outline: "none",
          minHeight: "1.6em",
        }}
      />
    </div>
  );
}
