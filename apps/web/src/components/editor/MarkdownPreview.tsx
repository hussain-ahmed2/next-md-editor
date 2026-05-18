"use client";

import { useEditorStore } from "@next-md-editor/editor-core";
import { serializeToMarkdown } from "@/features/markdown/serializer";

export function MarkdownPreview() {
  const blocks = useEditorStore((s) => s.blocks);
  const markdown = serializeToMarkdown(blocks);

  return (
    <aside style={{
      width: 340,
      background: "var(--bg-surface)",
      borderLeft: "1px solid var(--border-subtle)",
      display: "flex",
      flexDirection: "column",
      flexShrink: 0,
      overflow: "hidden",
    }}>
      <div style={{
        padding: "10px 16px",
        borderBottom: "1px solid var(--border-subtle)",
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        color: "var(--text-muted)",
        display: "flex",
        alignItems: "center",
        gap: 6,
      }}>
        <span style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: "var(--accent)",
          display: "inline-block",
        }} />
        Markdown Output
      </div>
      <pre style={{
        flex: 1,
        overflow: "auto",
        padding: "16px",
        fontSize: 12.5,
        lineHeight: 1.7,
        fontFamily: "var(--font-mono)",
        color: "var(--text-secondary)",
        whiteSpace: "pre-wrap",
        wordBreak: "break-word",
        margin: 0,
        background: "transparent",
      }}>
        {markdown || (
          <span style={{ color: "var(--text-muted)", fontStyle: "italic" }}>
            Add blocks to see markdown output…
          </span>
        )}
      </pre>
    </aside>
  );
}
