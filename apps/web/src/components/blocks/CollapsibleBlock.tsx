"use client";

import { useCallback, useState } from "react";
import { useEditorStore } from "@next-md-editor/editor-core";
import type { Block } from "@next-md-editor/types";
import { ChevronRight, GripVertical } from "lucide-react";

export function CollapsibleBlock({ block }: { block: Block }) {
  const blocks = useEditorStore((s) => s.blocks);
  const updateBlock = useEditorStore((s) => s.updateBlock);
  const myBlock = blocks.find((b) => b.id === block.id) ?? block;
  const summary = (myBlock.props.summary as string) ?? "";
  const content = (myBlock.props.content as string) ?? "";
  const open = (myBlock.props.open as boolean) ?? false;

  const [editingSummary, setEditingSummary] = useState(false);

  const handleSummaryChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      updateBlock(block.id, { summary: e.target.value, content, open });
    },
    [block.id, content, open, updateBlock],
  );

  const handleContentChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      updateBlock(block.id, { summary, content: e.target.value, open });
    },
    [block.id, summary, open, updateBlock],
  );

  const handleToggle = useCallback(() => {
    updateBlock(block.id, { summary, content, open: !open });
  }, [block.id, summary, content, open, updateBlock]);

  return (
    <div
      style={{
        borderRadius: "var(--radius-md)",
        border: "1px solid var(--border)",
        background: "var(--bg-surface)",
        overflow: "hidden",
      }}
    >
      <div
        onClick={handleToggle}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "8px 12px",
          cursor: "pointer",
          userSelect: "none",
          background: "var(--bg-elevated)",
          borderBottom: open ? "1px solid var(--border-subtle)" : "none",
        }}
      >
        <ChevronRight
          size={14}
          style={{
            color: "var(--text-muted)",
            transition: "transform 0.15s ease",
            transform: open ? "rotate(90deg)" : "rotate(0deg)",
            flexShrink: 0,
          }}
        />
        <GripVertical size={12} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
        <input
          value={summary}
          onChange={handleSummaryChange}
          placeholder="Summary..."
          onClick={(e) => e.stopPropagation()}
          style={{
            flex: 1,
            border: "none",
            background: "transparent",
            color: "var(--text-primary)",
            fontSize: 13,
            fontWeight: 600,
            outline: "none",
            minWidth: 0,
            padding: 0,
            fontFamily: "var(--font-sans)",
          }}
        />
        <span style={{ fontSize: 10, color: "var(--text-muted)", whiteSpace: "nowrap" }}>
          {open ? "Click to collapse" : "Click to expand"}
        </span>
      </div>
      {open && (
        <textarea
          value={content}
          onChange={handleContentChange}
          placeholder="Content (markdown)..."
          style={{
            width: "100%",
            minHeight: 80,
            padding: "10px 12px",
            border: "none",
            background: "transparent",
            color: "var(--text-primary)",
            fontSize: 12.5,
            fontFamily: "var(--font-mono)",
            lineHeight: 1.5,
            resize: "vertical",
            outline: "none",
          }}
        />
      )}
    </div>
  );
}
