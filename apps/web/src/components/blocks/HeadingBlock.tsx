"use client";

import { useEditorStore } from "@next-md-editor/editor-core";
import type { Block } from "@next-md-editor/types";
import { renderInlineMarkdown } from "@/features/markdown/highlighter";
import { LexicalRichText } from "@/components/editor/LexicalRichText";

const LEVEL_STYLES: Record<
  number,
  {
    fontSize: string;
    fontWeight: number;
    lineHeight: string;
    borderBottom?: string;
    paddingBottom?: string;
    marginBottom?: string;
    color?: string;
  }
> = {
  1: {
    fontSize: "2em",
    fontWeight: 600,
    lineHeight: "1.25",
    borderBottom: "1px solid var(--border-subtle)",
    paddingBottom: "0.3em",
    marginBottom: "8px",
  },
  2: {
    fontSize: "1.5em",
    fontWeight: 600,
    lineHeight: "1.25",
    borderBottom: "1px solid var(--border-subtle)",
    paddingBottom: "0.3em",
    marginBottom: "8px",
  },
  3: { fontSize: "1.25em", fontWeight: 600, lineHeight: "1.25" },
  4: { fontSize: "1.1em", fontWeight: 600, lineHeight: "1.25" },
  5: { fontSize: "1em", fontWeight: 600, lineHeight: "1.25" },
  6: { fontSize: "0.85em", fontWeight: 600, lineHeight: "1.25", color: "var(--text-muted)" },
};

export function HeadingBlock({ block }: { block: Block }) {
  const updateBlock = useEditorStore((s) => s.updateBlock);

  const level = (block.props.level as number) ?? 1;
  // Fallback to converting legacy text if content is missing
  const content = (block.props.content as string) || (block.props.text ? renderInlineMarkdown(block.props.text as string) : "");
  const style = LEVEL_STYLES[level] ?? LEVEL_STYLES[1];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <LexicalRichText 
        blockId={block.id} 
        initialHtml={content} 
        placeholder={`Heading ${level}`}
        contentStyle={{
          ...style,
          color: "var(--text-primary)",
          minHeight: "1.4em",
          letterSpacing: level === 1 ? "-0.03em" : "-0.01em",
        }}
        topUI={
          <div style={{ display: "flex", gap: 6, marginBottom: 2 }}>
            {[1, 2, 3, 4, 5, 6].map((l) => (
              <button
                key={l}
                onClick={(e) => {
                  e.stopPropagation();
                  updateBlock(block.id, { level: l });
                }}
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
        }
      />
    </div>
  );
}
