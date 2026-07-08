"use client";

import type { Block } from "@next-md-editor/types";
import { renderInlineMarkdown } from "@/features/markdown/highlighter";
import { LexicalRichText } from "@/components/editor/LexicalRichText";

export function QuoteBlock({ block }: { block: Block }) {
  const content = (block.props.content as string) || (block.props.text ? renderInlineMarkdown(block.props.text as string) : "");

  return (
    <div
      style={{
        display: "flex",
        gap: 14,
        padding: "0 16px",
        borderRadius: "0",
        background: "transparent",
      }}
    >
      <div
        style={{
          width: 4,
          borderRadius: 0,
          background: "var(--border)",
          flexShrink: 0,
          alignSelf: "stretch",
        }}
      />
      <div
        style={{
          flex: 1,
          fontSize: "1rem",
          color: "var(--text-secondary)",
          fontStyle: "normal",
          minHeight: "1.6em",
        }}
      >
        <LexicalRichText blockId={block.id} initialHtml={content} placeholder="Empty quote" />
      </div>
    </div>
  );
}
