"use client";

import { useEditorStore } from "@next-md-editor/editor-core";
import type { Block } from "@next-md-editor/types";

const LEVEL_STYLES: Record<number, { fontSize: string; fontWeight: number; lineHeight: string }> = {
  1: { fontSize: "2rem",   fontWeight: 800, lineHeight: "1.2" },
  2: { fontSize: "1.5rem", fontWeight: 700, lineHeight: "1.3" },
  3: { fontSize: "1.25rem",fontWeight: 600, lineHeight: "1.4" },
};

export function HeadingBlock({ block }: { block: Block }) {
  const updateBlock = useEditorStore((s) => s.updateBlock);
  const level = (block.props.level as number) ?? 1;
  const text = (block.props.text as string) ?? "";
  const style = LEVEL_STYLES[level] ?? LEVEL_STYLES[1];

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
        contentEditable
        suppressContentEditableWarning
        onBlur={(e) => updateBlock(block.id, { text: e.currentTarget.textContent ?? "" })}
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
    </div>
  );
}
