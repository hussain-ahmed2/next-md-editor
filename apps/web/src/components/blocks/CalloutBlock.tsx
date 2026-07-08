"use client";

import { useEditorStore } from "@next-md-editor/editor-core";
import type { Block } from "@next-md-editor/types";
import { renderInlineMarkdown } from "@/features/markdown/highlighter";
import { CALLOUT_TYPES, type CalloutKey } from "@/constants/calloutTypes";
import { LexicalRichText } from "@/components/editor/LexicalRichText";

export function CalloutBlock({ block }: { block: Block }) {
  const updateBlock = useEditorStore((s) => s.updateBlock);
  const blocks = useEditorStore((s) => s.blocks);

  const myBlock = blocks.find((b) => b.id === block.id) ?? block;
  const content = (myBlock.props.content as string) || (myBlock.props.text ? renderInlineMarkdown(myBlock.props.text as string) : "");
  const type = ((myBlock.props.type as string) ?? "note").toLowerCase() as CalloutKey;
  const config = CALLOUT_TYPES[type] ?? CALLOUT_TYPES.note;

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
      {/* WYSIWYG Editable content */}
      <div
        style={{
          fontSize: "1rem",
          color: "var(--text-primary)",
          minHeight: "1.6em",
        }}
      >
        <LexicalRichText 
          blockId={block.id} 
          initialHtml={content} 
          placeholder="Callout content" 
          topUI={
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 20, marginBottom: 8 }}>
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
          }
        />
      </div>
    </div>
  );
}
