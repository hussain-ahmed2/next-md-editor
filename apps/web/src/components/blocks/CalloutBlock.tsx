"use client";

import { useRef, useCallback } from "react";
import { useEditorStore } from "@next-md-editor/editor-core";
import type { Block } from "@next-md-editor/types";
import { htmlToMarkdown } from "@/utils/editorShortcuts";
import { renderInlineMarkdown } from "@/features/markdown/highlighter";
import { CALLOUT_TYPES, type CalloutKey } from "@/constants/calloutTypes";
import { useContentSync } from "@/hooks/useContentSync";

export function CalloutBlock({ block }: { block: Block }) {
  const updateBlock = useEditorStore((s) => s.updateBlock);
  const blocks = useEditorStore((s) => s.blocks);
  const myBlock = blocks.find((b) => b.id === block.id) ?? block;
  const text = (myBlock.props.text as string) ?? "";
  const type = ((myBlock.props.type as string) ?? "note").toLowerCase() as CalloutKey;
  const config = CALLOUT_TYPES[type] ?? CALLOUT_TYPES.note;

  const ref = useRef<HTMLDivElement>(null);

  const { handleInput: syncInput, handleBlur: syncBlur } = useContentSync({
    blockId: block.id,
    ref,
    storeValue: text,
    updatePropName: "text",
    parseHtml: htmlToMarkdown,
    serializeToHtml: renderInlineMarkdown,
  });

  const handleInput = useCallback(
    (e: React.FormEvent<HTMLDivElement>) => {
      syncInput(e);
    },
    [syncInput],
  );

  const handleBlur = useCallback(
    () => {
      syncBlur();
    },
    [syncBlur],
  );

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 8,
        padding: "12px 14px",
        borderRadius: 6,
        border: `1px solid ${config.border}`,
        borderLeft: `4px solid ${config.accent}`,
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
