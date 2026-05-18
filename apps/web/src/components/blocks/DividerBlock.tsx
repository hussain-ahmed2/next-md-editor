"use client";

import type { Block } from "@next-md-editor/types";

export function DividerBlock({ block: _ }: { block: Block }) {
  return (
    <div style={{ padding: "8px 0", display: "flex", alignItems: "center", gap: 12 }}>
      <div style={{ flex: 1, height: 1, background: "var(--border)", borderRadius: 1 }} />
      <div style={{
        width: 6,
        height: 6,
        borderRadius: "50%",
        background: "var(--border)",
      }} />
      <div style={{ flex: 1, height: 1, background: "var(--border)", borderRadius: 1 }} />
    </div>
  );
}
