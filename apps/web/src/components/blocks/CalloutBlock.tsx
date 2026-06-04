"use client";

import { useState, useRef, useEffect } from "react";
import { useEditorStore } from "@next-md-editor/editor-core";
import type { Block } from "@next-md-editor/types";
import { htmlToMarkdown } from "@/utils/editorShortcuts";
import { renderInlineMarkdown } from "@/features/markdown/highlighter";
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
  const blocks = useEditorStore((s) => s.blocks);
  const myBlock = blocks.find((b) => b.id === block.id) ?? block;
  const text = (myBlock.props.text as string) ?? "";
  const type = ((myBlock.props.type as string) ?? "note").toLowerCase() as CalloutKey;
  const config = CALLOUT_TYPES[type] ?? CALLOUT_TYPES.note;

  const [isFocused, setIsFocused] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Sync state changes from store to DOM when they differ (e.g. on undo/redo)
  useEffect(() => {
    if (ref.current) {
      const currentMarkdown = htmlToMarkdown(ref.current.innerHTML);
      if (currentMarkdown !== text) {
        ref.current.innerHTML = renderInlineMarkdown(text);

        // Reset caret to the end if focused
        if (document.activeElement === ref.current) {
          const range = document.createRange();
          range.selectNodeContents(ref.current);
          range.collapse(false);
          const selection = window.getSelection();
          if (selection) {
            selection.removeAllRanges();
            selection.addRange(range);
          }
        }
      }
    }
  }, [text]);

  // When entering focus, snap caret and ensure text is populated
  useEffect(() => {
    if (isFocused && ref.current) {
      ref.current.innerHTML = renderInlineMarkdown(text);
      const range = document.createRange();
      range.selectNodeContents(ref.current);
      range.collapse(false);
      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(range);
      }
    }
  }, [isFocused]);

  const handleInput = (e: React.InputEvent<HTMLDivElement>) => {
    const rawText = htmlToMarkdown(e.currentTarget.innerHTML);
    updateBlock(block.id, { text: rawText });
  };

  const handleBlur = (e: React.FocusEvent<HTMLDivElement>) => {
    setIsFocused(false);
    updateBlock(block.id, { text: htmlToMarkdown(e.currentTarget.innerHTML) });
  };

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
        {...(!isFocused
          ? {
              dangerouslySetInnerHTML: {
                __html: renderInlineMarkdown(text) || "",
              },
            }
          : {})}
      />
    </div>
  );
}
